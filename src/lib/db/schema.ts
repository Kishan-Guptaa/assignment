import { pgTable, serial, text, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Roles Table
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Admin, Seller, User
});

// 2. Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  phone: text("phone"),
  companyName: text("company_name"),
  gstNumber: text("gst_number"),
  licenseUrl: text("license_url"),
  verificationStatus: text("verification_status").default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 3. Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  sellerId: integer("seller_id").references(() => users.id).notNull(),
  baseUnit: text("base_unit").$type<"g" | "kg" | "mL" | "L" | "unit">().notNull(),
  basePrice: doublePrecision("base_price").notNull(), // rate per base unit
  status: text("status").$type<"active" | "draft" | "archived">().default("active").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 5. Inventory Table
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull().unique(),
  availableQuantity: doublePrecision("available_quantity").default(0).notNull(),
  reservedQuantity: doublePrecision("reserved_quantity").default(0).notNull(),
  minimumStock: doublePrecision("minimum_stock").default(10).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 6. Unit Conversions Table
export const unitConversions = pgTable("unit_conversions", {
  id: serial("id").primaryKey(),
  unitType: text("unit_type").$type<"weight" | "volume" | "count">().notNull(),
  fromUnit: text("from_unit").notNull(),
  toUnit: text("to_unit").notNull(),
  factor: doublePrecision("factor").notNull(), // Multiply fromUnit * factor to get toUnit
});

// 7. Quotations Table
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(), // e.g., "QTN-2026-0001"
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").$type<"Pending" | "Approved" | "Rejected" | "Converted_To_Order">().default("Pending").notNull(),
  totalAmount: doublePrecision("total_amount").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 8. Quotation Items Table
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: doublePrecision("quantity").notNull(), // User requested quantity
  unit: text("unit").notNull(), // User requested unit
  convertedQuantity: doublePrecision("converted_quantity").notNull(), // Quantity converted to product base unit
  rate: doublePrecision("rate").notNull(), // Price rate per requested unit
  subtotal: doublePrecision("subtotal").notNull(),
});

// 9. Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(), // e.g., "ORD-2026-0001"
  quotationId: integer("quotation_id").references(() => quotations.id), // Nullable if direct
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").$type<"Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled">().default("Pending").notNull(),
  totalAmount: doublePrecision("total_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 10. Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit").notNull(),
  rate: doublePrecision("rate").notNull(),
  subtotal: doublePrecision("subtotal").notNull(),
});

// 11. Notifications Table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 12. Activity Logs Table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // Admin created product, Seller updated inventory, User submitted quotation
  entityType: text("entity_type").notNull(), // "product", "inventory", "quotation", "order", "user"
  entityId: integer("entity_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RELATION DEFINITIONS
export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  role: one(roles, {
    fields: [users.roleId],
    references: [roles.id],
  }),
  products: many(products),
  quotations: many(quotations),
  orders: many(orders),
  notifications: many(notifications),
  activityLogs: many(activityLogs),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  inventory: one(inventory),
  quotationItems: many(quotationItems),
  orderItems: many(orderItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const quotationsRelations = relations(quotations, ({ one, many }) => ({
  user: one(users, {
    fields: [quotations.userId],
    references: [users.id],
  }),
  items: many(quotationItems),
}));

export const quotationItemsRelations = relations(quotationItems, ({ one }) => ({
  quotation: one(quotations, {
    fields: [quotationItems.quotationId],
    references: [quotations.id],
  }),
  product: one(products, {
    fields: [quotationItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  quotation: one(quotations, {
    fields: [orders.quotationId],
    references: [quotations.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
