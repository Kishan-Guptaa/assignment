"use server";

import { eq, and, desc } from "drizzle-orm";
import { db } from "../db/db";
import {
  quotations,
  quotationItems,
  orders,
  orderItems,
  inventory,
  notifications,
  activityLogs,
  users,
  products,
} from "../db/schema";
import { getCurrentUser } from "./auth";
import { getDBConversionFactor } from "./inventoryActions";

// ─────────────────────────────────────────────────────────────────────────────
// READ QUERIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all quotations from database.
 * Customers see only their own; admins/sellers see all.
 */
export async function getQuotationsList() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const qList =
      user.role === "customer"
        ? await db.select().from(quotations).where(eq(quotations.userId, user.id)).orderBy(desc(quotations.createdAt))
        : await db.select().from(quotations).orderBy(desc(quotations.createdAt));

    const [userList, qItemsList] = await Promise.all([
      db.select().from(users),
      db.select().from(quotationItems),
    ]);

    return qList.map((q) => {
      const u = userList.find((x) => x.id === q.userId);
      const items = qItemsList.filter((qi) => qi.quotationId === q.id);
      return {
        id: q.id,
        quotationNumber: q.quotationNumber,
        userId: q.userId,
        customerName: u?.name ?? "Unknown Customer",
        customerEmail: u?.email ?? "N/A",
        status: q.status,
        totalAmount: q.totalAmount,
        createdAt: q.createdAt.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          convertedQuantity: item.convertedQuantity,
          rate: item.rate,
          subtotal: item.subtotal,
        })),
      };
    });
  } catch (error) {
    console.error("Fetch quotations failed:", error);
    return [];
  }
}

/**
 * Fetches all orders from database.
 * Customers see only their own; admins/sellers see all.
 */
export async function getOrdersList() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const oList =
      user.role === "customer"
        ? await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt))
        : await db.select().from(orders).orderBy(desc(orders.createdAt));

    const [userList, oItemsList] = await Promise.all([
      db.select().from(users),
      db.select().from(orderItems),
    ]);

    return oList.map((o) => {
      const u = userList.find((x) => x.id === o.userId);
      const items = oItemsList.filter((oi) => oi.orderId === o.id);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        quotationId: o.quotationId,
        userId: o.userId,
        customerName: u?.name ?? "Unknown Customer",
        customerEmail: u?.email ?? "N/A",
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          subtotal: item.subtotal,
        })),
      };
    });
  } catch (error) {
    console.error("Fetch orders failed:", error);
    return [];
  }
}

/**
 * Fetches notifications for current logged-in user.
 */
export async function getNotificationsList() {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt));
  } catch (error) {
    console.error("Fetch notifications failed:", error);
    return [];
  }
}

/**
 * Marks a single notification as read.
 */
export async function markNotificationReadAction(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Unauthorized." };
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)));
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to mark notification read." };
  }
}

/**
 * Marks all notifications for current user as read.
 */
export async function markAllNotificationsReadAction() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, message: "Unauthorized." };
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, user.id));
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to mark notifications read." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTATION FLOW — ALL INSIDE ONE TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer submits a quotation request.
 *
 * Transaction guarantees:
 *   1. Create quotation header
 *   2. Create quotation item rows
 *   3. Reserve stock (increment reservedQuantity)
 *   4. Insert admin/seller/customer notifications
 *   5. Insert activity log
 *
 * If anything fails → full rollback, no partial data.
 */
export async function submitQuotationRequestAction(
  items: { productId: number; quantity: number; unit: string }[]
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer") {
      return { success: false, message: "Unauthorized clearance level." };
    }
    if (items.length === 0) {
      return { success: false, message: "Cart is empty." };
    }

    // ── Pre-transaction: calculate totals and validate products ──────────────
    let totalAmount = 0;
    const compiledItems: {
      productId: number;
      quantity: number;
      unit: string;
      convertedQuantity: number;
      rate: number;
      subtotal: number;
      sellerId: number;
      productName: string;
    }[] = [];

    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (!product) {
        return { success: false, message: `Product ID ${item.productId} not found.` };
      }

      const factor = await getDBConversionFactor(item.unit, product.baseUnit);
      const convertedQuantity = item.quantity * factor;
      const rate = product.basePrice / factor;
      const subtotal = rate * item.quantity;
      totalAmount += subtotal;

      compiledItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        convertedQuantity,
        rate,
        subtotal,
        sellerId: product.sellerId,
        productName: product.name,
      });
    }

    const quotationNumber = `QTN-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Fetch admin list before transaction (read-only, safe outside tx)
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.roleId, 1));
    const uniqueSellerIds = [...new Set(compiledItems.map((x) => x.sellerId).filter(Boolean))];

    // ── TRANSACTION ──────────────────────────────────────────────────────────
    const newQuote = await db.transaction(async (tx) => {
      // 1. Create quotation header
      const [insertedQuote] = await tx
        .insert(quotations)
        .values({ quotationNumber, userId: user.id, status: "Pending", totalAmount })
        .returning();

      // 2. Create items + reserve stock
      for (const ci of compiledItems) {
        await tx.insert(quotationItems).values({
          quotationId: insertedQuote.id,
          productId: ci.productId,
          quantity: ci.quantity,
          unit: ci.unit,
          convertedQuantity: ci.convertedQuantity,
          rate: ci.rate,
          subtotal: ci.subtotal,
        });

        // Reserve stock — increment reservedQuantity
        const [inv] = await tx.select().from(inventory).where(eq(inventory.productId, ci.productId));
        if (inv) {
          await tx
            .update(inventory)
            .set({ reservedQuantity: inv.reservedQuantity + ci.convertedQuantity, updatedAt: new Date() })
            .where(eq(inventory.productId, ci.productId));
        }
      }

      // 3. Activity log
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: "SUBMIT_QUOTATION",
        entityType: "quotation",
        entityId: insertedQuote.id,
      });

      // 4. Notifications for admins
      for (const admin of admins) {
        await tx.insert(notifications).values({
          userId: admin.id,
          title: "New Quote Request",
          message: `New quote ${quotationNumber} submitted by ${user.name} (₹${totalAmount.toFixed(2)})`,
        });
      }

      // 5. Notifications for involved sellers
      for (const sellerId of uniqueSellerIds) {
        await tx.insert(notifications).values({
          userId: sellerId,
          title: "New Quote Request",
          message: `Quote ${quotationNumber} received for your chemical products.`,
        });
      }

      // 6. Confirmation notification for customer
      await tx.insert(notifications).values({
        userId: user.id,
        title: "Quote Submitted",
        message: `Quotation ${quotationNumber} submitted successfully. Pending admin review.`,
      });

      return insertedQuote;
    });

    return { success: true, quotationId: newQuote.id };
  } catch (error: any) {
    console.error("Submit quote failed:", error);
    return { success: false, message: error?.message || "Submit quotation failed." };
  }
}

/**
 * Admin/Seller approves a quotation.
 * Wrapped in a transaction: update status + insert log + insert notification.
 */
export async function approveQuotationAction(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    const [quote] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quote) return { success: false, message: "Quotation not found." };

    await db.transaction(async (tx) => {
      await tx.update(quotations).set({ status: "Approved" }).where(eq(quotations.id, id));

      await tx.insert(activityLogs).values({
        userId: user.id,
        action: "APPROVE_QUOTATION",
        entityType: "quotation",
        entityId: id,
      });

      await tx.insert(notifications).values({
        userId: quote.userId,
        title: "Quotation Approved",
        message: `Your quotation ${quote.quotationNumber} has been APPROVED. You can now convert it to an order.`,
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to approve quotation." };
  }
}

/**
 * Admin rejects a quotation — releases reserved stock back.
 * Transaction: update status + release reservations + log + notify.
 */
export async function rejectQuotationAction(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    const [quote] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quote) return { success: false, message: "Quotation not found." };

    await db.transaction(async (tx) => {
      await tx.update(quotations).set({ status: "Rejected" }).where(eq(quotations.id, id));

      // Release reserved stock
      const qItems = await tx.select().from(quotationItems).where(eq(quotationItems.quotationId, id));
      for (const item of qItems) {
        const [inv] = await tx.select().from(inventory).where(eq(inventory.productId, item.productId));
        if (inv) {
          await tx
            .update(inventory)
            .set({ reservedQuantity: Math.max(0, inv.reservedQuantity - item.convertedQuantity), updatedAt: new Date() })
            .where(eq(inventory.productId, item.productId));
        }
      }

      await tx.insert(activityLogs).values({
        userId: user.id,
        action: "REJECT_QUOTATION",
        entityType: "quotation",
        entityId: id,
      });

      await tx.insert(notifications).values({
        userId: quote.userId,
        title: "Quotation Declined",
        message: `Your quotation ${quote.quotationNumber} was declined by the administrator.`,
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to decline quotation." };
  }
}

/**
 * Converts approved quotation → order.
 *
 * Transaction guarantees:
 *   1. Stock validation (pre-transaction)
 *   2. Create order header
 *   3. Create order items
 *   4. Deduct availableQuantity and reservedQuantity from inventory
 *   5. Update quotation status to Converted_To_Order
 *   6. Insert activity log
 *   7. Insert customer + admin notifications
 *
 * Rollback on any failure.
 */
export async function convertQuotationToOrderAction(id: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    const [quote] = await db.select().from(quotations).where(eq(quotations.id, id));
    if (!quote) return { success: false, message: "Quotation not found." };

    const qItems = await db.select().from(quotationItems).where(eq(quotationItems.quotationId, id));

    // Pre-transaction stock validation
    for (const item of qItems) {
      const [[inv], [prod]] = await Promise.all([
        db.select().from(inventory).where(eq(inventory.productId, item.productId)),
        db.select().from(products).where(eq(products.id, item.productId)),
      ]);
      if (!inv || !prod) {
        return { success: false, message: "Product or inventory record missing." };
      }
      if (inv.availableQuantity < item.convertedQuantity) {
        return {
          success: false,
          message: `Insufficient stock for ${prod.name}. Need ${item.convertedQuantity} ${prod.baseUnit}, only ${inv.availableQuantity.toFixed(2)} available.`,
        };
      }
    }

    const orderNumber = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.roleId, 1));

    const newOrder = await db.transaction(async (tx) => {
      // 1. Create order
      const [insertedOrder] = await tx
        .insert(orders)
        .values({ orderNumber, quotationId: quote.id, userId: quote.userId, status: "Pending", totalAmount: quote.totalAmount })
        .returning();

      // 2. Create order items + deduct inventory
      for (const item of qItems) {
        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          subtotal: item.subtotal,
        });

        const [inv] = await tx.select().from(inventory).where(eq(inventory.productId, item.productId));
        if (inv) {
          await tx
            .update(inventory)
            .set({
              availableQuantity: Math.max(0, inv.availableQuantity - item.convertedQuantity),
              reservedQuantity: Math.max(0, inv.reservedQuantity - item.convertedQuantity),
              updatedAt: new Date(),
            })
            .where(eq(inventory.productId, item.productId));
        }
      }

      // 3. Mark quotation converted
      await tx.update(quotations).set({ status: "Converted_To_Order" }).where(eq(quotations.id, quote.id));

      // 4. Activity log
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: "CONVERT_QUOTE_TO_ORDER",
        entityType: "order",
        entityId: insertedOrder.id,
      });

      // 5. Notify customer
      await tx.insert(notifications).values({
        userId: quote.userId,
        title: "Order Placed",
        message: `Quote #${quote.quotationNumber} converted to Order #${orderNumber}. Status: Pending.`,
      });

      // 6. Notify admins
      for (const admin of admins) {
        await tx.insert(notifications).values({
          userId: admin.id,
          title: "New Order Created",
          message: `Order ${orderNumber} created from quote ${quote.quotationNumber} (₹${quote.totalAmount.toFixed(2)}).`,
        });
      }

      return insertedOrder;
    });

    return { success: true, orderId: newOrder.id };
  } catch (error: any) {
    console.error("Convert quote error:", error);
    return { success: false, message: error?.message || "Failed to convert quote to order." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DIRECT ORDER FLOW — ALL INSIDE ONE TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer places a direct order (instant checkout).
 *
 * Transaction guarantees:
 *   1. Stock validation (pre-transaction — fail fast before acquiring locks)
 *   2. Create order header
 *   3. Create order items
 *   4. Deduct availableQuantity (prevents stock going below zero)
 *   5. Insert activity log
 *   6. Insert customer + admin + seller notifications
 *
 * Rollback on any failure → no order, no stock deduction.
 */
export async function placeDirectOrderAction(
  items: { productId: number; quantity: number; unit: string }[]
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "customer") {
      return { success: false, message: "Unauthorized clearance level." };
    }
    if (items.length === 0) {
      return { success: false, message: "Order is empty." };
    }

    // ── Pre-transaction: validate stock + calculate totals ──────────────────
    let totalAmount = 0;
    const compiledItems: {
      productId: number;
      quantity: number;
      unit: string;
      convertedQuantity: number;
      rate: number;
      subtotal: number;
      sellerId: number;
      productName: string;
    }[] = [];

    for (const item of items) {
      const [[product], [inv]] = await Promise.all([
        db.select().from(products).where(eq(products.id, item.productId)),
        db.select().from(inventory).where(eq(inventory.productId, item.productId)),
      ]);

      if (!product) {
        return { success: false, message: `Product ID ${item.productId} not found.` };
      }

      const factor = await getDBConversionFactor(item.unit, product.baseUnit);
      const convertedQuantity = item.quantity * factor;

      // ── Inventory guard: prevent stock going below zero ──────────────────
      if (!inv || inv.availableQuantity < convertedQuantity) {
        return {
          success: false,
          message: `Insufficient stock for ${product.name}. Needed: ${convertedQuantity.toFixed(2)} ${product.baseUnit}, Available: ${(inv?.availableQuantity ?? 0).toFixed(2)} ${product.baseUnit}.`,
        };
      }

      const rate = product.basePrice / factor;
      const subtotal = rate * item.quantity;
      totalAmount += subtotal;

      compiledItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unit: item.unit,
        convertedQuantity,
        rate,
        subtotal,
        sellerId: product.sellerId,
        productName: product.name,
      });
    }

    const orderNumber = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const admins = await db.select({ id: users.id }).from(users).where(eq(users.roleId, 1));
    const uniqueSellerIds = [...new Set(compiledItems.map((x) => x.sellerId).filter(Boolean))];

    // ── TRANSACTION ──────────────────────────────────────────────────────────
    const newOrder = await db.transaction(async (tx) => {
      // 1. Create order header
      const [insertedOrder] = await tx
        .insert(orders)
        .values({ orderNumber, quotationId: null, userId: user.id, status: "Pending", totalAmount })
        .returning();

      // 2. Create order items + deduct stock
      for (const ci of compiledItems) {
        await tx.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: ci.productId,
          quantity: ci.quantity,
          unit: ci.unit,
          rate: ci.rate,
          subtotal: ci.subtotal,
        });

        // Re-read inside tx to get the latest value under a transaction lock
        const [inv] = await tx.select().from(inventory).where(eq(inventory.productId, ci.productId));
        if (!inv) {
          throw new Error(`Inventory record for product ${ci.productId} disappeared — rolling back.`);
        }

        // Double-check inside tx to guard against concurrent orders
        if (inv.availableQuantity < ci.convertedQuantity) {
          throw new Error(
            `Concurrent stock conflict: ${ci.productName} no longer has sufficient stock. Please refresh and retry.`
          );
        }

        await tx
          .update(inventory)
          .set({
            availableQuantity: inv.availableQuantity - ci.convertedQuantity,
            updatedAt: new Date(),
          })
          .where(eq(inventory.productId, ci.productId));
      }

      // 3. Activity log
      await tx.insert(activityLogs).values({
        userId: user.id,
        action: "PLACE_DIRECT_ORDER",
        entityType: "order",
        entityId: insertedOrder.id,
      });

      // 4. Notify customer
      await tx.insert(notifications).values({
        userId: user.id,
        title: "Direct Order Placed",
        message: `Your order ${orderNumber} was placed successfully. Total: ₹${totalAmount.toFixed(2)}.`,
      });

      // 5. Notify admins
      for (const admin of admins) {
        await tx.insert(notifications).values({
          userId: admin.id,
          title: "New Direct Order",
          message: `Customer ${user.name} placed order ${orderNumber} (₹${totalAmount.toFixed(2)}).`,
        });
      }

      // 6. Notify sellers
      for (const sellerId of uniqueSellerIds) {
        await tx.insert(notifications).values({
          userId: sellerId,
          title: "Order Placed",
          message: `Direct order ${orderNumber} received involving your products.`,
        });
      }

      return insertedOrder;
    });

    return { success: true, orderId: newOrder.id };
  } catch (error: any) {
    console.error("Direct checkout failed:", error);
    return { success: false, message: error?.message || "Direct checkout failed." };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER STATUS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates order status. If Cancelled, restores stock inside the same transaction.
 */
export async function updateOrderStatusAction(
  orderId: number,
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "customer") return { success: false, message: "Unauthorized." };

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return { success: false, message: "Order not found." };

    const oldStatus = order.status;

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status }).where(eq(orders.id, orderId));

      // Restore stock if cancelling a non-cancelled order
      if (status === "Cancelled" && oldStatus !== "Cancelled") {
        const oItems = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
        for (const item of oItems) {
          const [prod] = await tx.select().from(products).where(eq(products.id, item.productId));
          if (prod) {
            const factor = await getDBConversionFactor(item.unit, prod.baseUnit);
            const convertedQuantity = item.quantity * factor;
            const [inv] = await tx.select().from(inventory).where(eq(inventory.productId, item.productId));
            if (inv) {
              await tx
                .update(inventory)
                .set({ availableQuantity: inv.availableQuantity + convertedQuantity, updatedAt: new Date() })
                .where(eq(inventory.productId, item.productId));
            }
          }
        }
      }

      await tx.insert(activityLogs).values({
        userId: user.id,
        action: `ORDER_${status.toUpperCase()}`,
        entityType: "order",
        entityId: orderId,
      });

      await tx.insert(notifications).values({
        userId: order.userId,
        title: `Order Status: ${status}`,
        message: `Your Order ${order.orderNumber} status has been updated to: ${status}.`,
      });
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, message: error?.message || "Failed to update order status." };
  }
}
