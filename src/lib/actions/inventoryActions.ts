"use server";

import { eq, and } from "drizzle-orm";
import { db } from "../db/db";
import {
  products,
  inventory,
  categories,
  unitConversions,
  activityLogs,
  notifications,
  users
} from "../db/schema";
import { getCurrentUser } from "./auth";
import { seedDatabase } from "../db/seed";

/**
 * Fetches all products with category and inventory details.
 */
export async function getProductsList() {
  try {
    await seedDatabase();
    const list = await db.select().from(products);
    const invList = await db.select().from(inventory);
    const catList = await db.select().from(categories);

    return list.map((p) => {
      const inv = invList.find((i) => i.productId === p.id);
      const cat = catList.find((c) => c.id === p.categoryId);
      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        description: p.description,
        categoryId: p.categoryId,
        categoryName: cat?.name || "N/A",
        sellerId: p.sellerId,
        baseUnit: p.baseUnit,
        basePrice: p.basePrice,
        status: p.status,
        imageUrl: p.imageUrl,
        stockQuantity: inv ? inv.availableQuantity : 0,
        reservedQuantity: inv ? inv.reservedQuantity : 0,
        minimumStock: inv ? inv.minimumStock : 10,
        createdAt: p.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("Fetch products failed:", error);
    return [];
  }
}

/**
 * Creates a new product and initializes its stock tracks.
 */
export async function createProduct(formData: {
  name: string;
  sku: string;
  description?: string;
  categoryId: number;
  baseUnit: "g" | "kg" | "mL" | "L" | "unit";
  basePrice: number;
  initialStock: number;
  minimumStock?: number;
  imageUrl?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") {
      return { success: false, message: "Unauthorized clearance level." };
    }

    // Verify unique SKU
    const existing = await db.select().from(products).where(eq(products.sku, formData.sku));
    if (existing.length > 0) {
      return { success: false, message: "A chemical with this SKU already exists." };
    }

    // Create product
    const [inserted] = await db.insert(products).values({
      name: formData.name,
      sku: formData.sku,
      description: formData.description || null,
      categoryId: formData.categoryId,
      sellerId: user.id,
      baseUnit: formData.baseUnit,
      basePrice: formData.basePrice,
      imageUrl: formData.imageUrl || null,
      status: "active",
    }).returning();

    // Create inventory record
    await db.insert(inventory).values({
      productId: inserted.id,
      availableQuantity: formData.initialStock,
      reservedQuantity: 0,
      minimumStock: formData.minimumStock || 10,
    });

    // Log Activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: "CREATE_PRODUCT",
      entityType: "product",
      entityId: inserted.id,
    });

    return { success: true, product: inserted };
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return { success: false, message: error?.message || "Failed to create chemical." };
  }
}

/**
 * Modifies an existing chemical definition.
 */
export async function editProduct(
  id: number,
  formData: {
    name: string;
    sku: string;
    description?: string;
    categoryId: number;
    basePrice: number;
    imageUrl?: string;
  }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    await db.update(products).set({
      name: formData.name,
      sku: formData.sku,
      description: formData.description || null,
      categoryId: formData.categoryId,
      basePrice: formData.basePrice,
      imageUrl: formData.imageUrl || null,
      updatedAt: new Date(),
    }).where(eq(products.id, id));

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "UPDATE_PRODUCT",
      entityType: "product",
      entityId: id,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Edit product failed." };
  }
}

/**
 * Archives/Deletes a product listing.
 */
export async function deleteProduct(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    // Cascade delete handles inventory connection in schema relationships normally,
    // here we remove inventory first then product to be safe with constraint sequences
    await db.delete(inventory).where(eq(inventory.productId, id));
    await db.delete(products).where(eq(products.id, id));

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "DELETE_PRODUCT",
      entityType: "product",
      entityId: id,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Delete product failed." };
  }
}

/**
 * Helper to fetch database unit conversion multiplier
 */
export async function getDBConversionFactor(fromUnit: string, toUnit: string): Promise<number> {
  if (fromUnit.toLowerCase() === toUnit.toLowerCase()) return 1;
  
  try {
    const list = await db.select().from(unitConversions);
    const rule = list.find(
      (c) => c.fromUnit.toLowerCase() === fromUnit.toLowerCase() && c.toUnit.toLowerCase() === toUnit.toLowerCase()
    );
    if (rule) return rule.factor;

    const reverseRule = list.find(
      (c) => c.fromUnit.toLowerCase() === toUnit.toLowerCase() && c.toUnit.toLowerCase() === fromUnit.toLowerCase()
    );
    if (reverseRule) return 1 / reverseRule.factor;
  } catch {}
  
  return 1;
}

/**
 * Restocks or adjusts inventory quantity, triggers low-stock alerts.
 */
export async function adjustProductStock(
  productId: number,
  qtyChange: number, // positive for add, negative for remove
  unit: string,
  type: "IN" | "OUT" | "ADJUSTMENT",
  note: string
) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Unauthorized." };

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) return { success: false, message: "Product not found." };

    const [inv] = await db.select().from(inventory).where(eq(inventory.productId, productId));
    if (!inv) return { success: false, message: "Inventory record missing." };

    // Convert requested unit quantity change to base unit quantity
    const multiplier = await getDBConversionFactor(unit, product.baseUnit);
    const baseQtyChange = qtyChange * multiplier;

    const nextAvailableQty = Math.max(0, inv.availableQuantity + baseQtyChange);

    // Commit change
    await db.update(inventory).set({
      availableQuantity: nextAvailableQty,
      updatedAt: new Date(),
    }).where(eq(inventory.productId, productId));

    // Audit logs
    await db.insert(activityLogs).values({
      userId: user.id,
      action: `${type}_INVENTORY`,
      entityType: "inventory",
      entityId: inv.id,
    });

    // Alert Checks: Available stock drops below minimum stock threshold
    if (nextAvailableQty < inv.minimumStock) {
      // 1. Notify Admin
      const admins = await db.select().from(users).where(eq(users.roleId, 1));
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          title: "Low Stock Alert",
          message: `Stock for ${product.name} (SKU: ${product.sku}) has dropped to ${nextAvailableQty.toFixed(2)} ${product.baseUnit}. Minimum: ${inv.minimumStock}.`,
        });
      }
      
      // 2. Notify Seller (if different from admin)
      if (product.sellerId) {
        await db.insert(notifications).values({
          userId: product.sellerId,
          title: "Low Stock Alert",
          message: `Your chemical ${product.name} is low on stock (${nextAvailableQty.toFixed(2)} ${product.baseUnit} available). Please restock soon.`,
        });
      }
    }

    return { success: true, newQuantity: nextAvailableQty };
  } catch (error: any) {
    console.error("Adjust stock failed:", error);
    return { success: false, message: error?.message || "Stock adjustment failed." };
  }
}

/**
 * Fetches list of categories.
 */
export async function getCategoriesList() {
  try {
    return await db.select().from(categories);
  } catch {
    return [];
  }
}

/**
 * Fetches all conversions rules.
 */
export async function getUnitConversionsList() {
  try {
    return await db.select().from(unitConversions);
  } catch {
    return [];
  }
}

/**
 * Configures a custom conversion rule.
 */
export async function addUnitConversionRule(rule: {
  unitType: "weight" | "volume" | "count";
  fromUnit: string;
  toUnit: string;
  factor: number;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") return { success: false, message: "Unauthorized." };

    const [inserted] = await db.insert(unitConversions).values({
      unitType: rule.unitType,
      fromUnit: rule.fromUnit.toLowerCase(),
      toUnit: rule.toUnit.toLowerCase(),
      factor: rule.factor,
    }).returning();

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "CREATE_CONVERSION",
      entityType: "unit_conversions",
      entityId: inserted.id,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to configure conversion rule." };
  }
}

/**
 * Removes a conversion rule.
 */
export async function deleteUnitConversionRule(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "admin") return { success: false, message: "Unauthorized." };

    await db.delete(unitConversions).where(eq(unitConversions.id, id));

    await db.insert(activityLogs).values({
      userId: user.id,
      action: "DELETE_CONVERSION",
      entityType: "unit_conversions",
      entityId: id,
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to remove conversion rule." };
  }
}

/**
 * Fetches system-wide activities audit trail.
 */
export async function getActivityLogsList() {
  try {
    const list = await db.select().from(activityLogs);
    const userList = await db.select().from(users);

    return list.map((log) => {
      const u = userList.find((x) => x.id === log.userId);
      return {
        id: log.id,
        userId: u ? u.email : "System",
        userRole: u ? (u.roleId === 1 ? "admin" : u.roleId === 2 ? "seller" : "user") : "system",
        action: log.action,
        details: `Performed action on entity type: ${log.entityType} (ID: ${log.entityId})`,
        createdAt: log.createdAt.toISOString(),
      };
    }).reverse();
  } catch (error) {
    console.error("Fetch activity logs failed:", error);
    return [];
  }
}
