import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types matching database structures
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "seller" | "customer";
  status: "active" | "suspended";
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  description: string;
  baseUnit: "g" | "kg" | "mL" | "L" | "unit";
  basePrice: number;
  stockQuantity: number;
  image: string;
  status: "active" | "draft" | "archived";
  sellerId: string;
  createdAt: string;
}

export interface InventoryLog {
  id: number;
  productId: number;
  quantity: number;
  unit: string;
  transactionType: "IN" | "OUT" | "ADJUSTMENT";
  note: string;
  referenceId?: number;
  referenceType?: string;
  createdAt: string;
}

export interface UnitConversion {
  id: number;
  category: "weight" | "volume" | "count";
  fromUnit: string;
  toUnit: string;
  factor: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
  unit: "g" | "kg" | "mL" | "L" | "unit";
}

export interface QuotationItem {
  productId: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface Quotation {
  id: number;
  userId: string;
  status: "pending" | "approved" | "converted" | "rejected";
  items: QuotationItem[];
  totalAmount: number;
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
}

export interface Order {
  id: number;
  quotationId?: number;
  userId: string;
  status: "pending" | "approved" | "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: string;
  message: string;
  type: "alert" | "success" | "info";
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: number;
  userId: string;
  userRole: string;
  action: string;
  details: string;
  createdAt: string;
}

interface AppState {
  // Database Tables State
  users: User[];
  activeUser: User | null;
  categories: Category[];
  products: Product[];
  inventoryLogs: InventoryLog[];
  unitConversions: UnitConversion[];
  quotations: Quotation[];
  orders: Order[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  cart: CartItem[];

  // General UI state
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Authentication actions
  login: (email: string) => boolean;
  logout: () => void;
  registerUser: (name: string, email: string, role: "admin" | "seller" | "customer") => void;
  updateUserStatus: (id: string, status: "active" | "suspended") => void;

  // Product actions
  addProduct: (product: Omit<Product, "id" | "createdAt" | "sellerId">) => void;
  updateProduct: (id: number, product: Partial<Product>) => void;
  deleteProduct: (id: number) => void;

  // Category actions
  addCategory: (name: string, description: string) => void;

  // Inventory actions
  adjustStock: (productId: number, qtyChange: number, unit: string, type: "IN" | "OUT" | "ADJUSTMENT", note: string) => void;

  // Conversion actions
  addUnitConversion: (category: "weight" | "volume" | "count", fromUnit: string, toUnit: string, factor: number) => void;
  deleteUnitConversion: (id: number) => void;

  // Quotation Cart & system
  addToCart: (productId: number, quantity: number, unit: "g" | "kg" | "mL" | "L" | "unit") => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number, unit: "g" | "kg" | "mL" | "L" | "unit") => void;
  clearCart: () => void;
  submitQuotationRequest: () => void;
  approveQuotation: (id: number) => void;
  rejectQuotation: (id: number) => void;
  convertQuotationToOrder: (id: number) => void;

  // Order actions
  placeDirectOrder: (items: OrderItem[]) => void;
  updateOrderStatus: (id: number, status: Order["status"]) => void;

  // Notifications
  addNotification: (userId: string, message: string, type: Notification["type"]) => void;
  markNotificationRead: (id: number) => void;
  markAllNotificationsRead: (userId: string) => void;

  // Helper selectors
  getConversionFactor: (fromUnit: string, toUnit: string) => number;
}

// Seed data
const defaultUsers: User[] = [
  { id: "usr_admin", email: "admin@aasamedchem.com", name: "Dr. Clara Sterling", role: "admin", status: "active", createdAt: new Date().toISOString() },
  { id: "usr_seller", email: "seller@aasamedchem.com", name: "Apex Reagents Ltd.", role: "seller", status: "active", createdAt: new Date().toISOString() },
  { id: "usr_customer", email: "customer@labtech.com", name: "Biotech Innovations Inc.", role: "customer", status: "active", createdAt: new Date().toISOString() },
];

const defaultCategories: Category[] = [
  { id: 1, name: "Solvents & Cleaning", description: "High purity chemical solvents for chromatography and cleaning" },
  { id: 2, name: "Inorganic Reagents", description: "Acids, bases, and salts for laboratory synthesis and testing" },
  { id: 3, name: "Catalysts & Ligands", description: "Metal catalysts, coordination compounds, and organic ligands" },
  { id: 4, name: "Organic Compounds", description: "Intermediates, building blocks, and custom organic synthesis reagents" },
  { id: 5, name: "Labware & Consumables", description: "Disposable tips, vials, filters, and safety accessories" },
];

const defaultProducts: Product[] = [
  { id: 1, name: "Ethanol anhydrous 99.8%", sku: "CHM-ETH-001", categoryId: 1, description: "Highly pure anhydrous absolute ethanol, ideal as a solvent and chemical reactant.", baseUnit: "L", basePrice: 15.50, stockQuantity: 250, image: "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
  { id: 2, name: "Sodium Hydroxide pellets", sku: "CHM-NAOH-002", categoryId: 2, description: "Analytical grade NaOH pellets, widely used as a strong base and for pH adjustment.", baseUnit: "kg", basePrice: 8.20, stockQuantity: 180, image: "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
  { id: 3, name: "Palladium on carbon 10%", sku: "CHM-PDC-003", categoryId: 3, description: "10 wt. % loading matrix catalyst on activated carbon powder, optimized for hydrogenation.", baseUnit: "g", basePrice: 4.80, stockQuantity: 500, image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
  { id: 4, name: "Acetonitrile HPLC grade", sku: "CHM-ACN-004", categoryId: 1, description: "High-pressure liquid chromatography (HPLC) solvent with low UV background absorption.", baseUnit: "L", basePrice: 22.00, stockQuantity: 150, image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
  { id: 5, name: "Hydrochloric Acid 37%", sku: "CHM-HCL-005", categoryId: 2, description: "Concentrated analytical grade HCl for general chemical preparation and acidifications.", baseUnit: "mL", basePrice: 0.02, stockQuantity: 25000, image: "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
  { id: 6, name: "Lab Pipette Tips 200uL", sku: "CON-PIP-006", categoryId: 5, description: "Polypropylene disposable barrier filter tips, DNase/RNase-free, pack of 96.", baseUnit: "unit", basePrice: 0.12, stockQuantity: 5000, image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?w=200&auto=format&fit=crop&q=60", sellerId: "usr_seller", status: "active", createdAt: new Date().toISOString() },
];

const defaultConversions: UnitConversion[] = [
  // Weight Conversions
  { id: 1, category: "weight", fromUnit: "kg", toUnit: "g", factor: 1000 },
  { id: 2, category: "weight", fromUnit: "g", toUnit: "kg", factor: 0.001 },
  // Volume Conversions
  { id: 3, category: "volume", fromUnit: "L", toUnit: "mL", factor: 1000 },
  { id: 4, category: "volume", fromUnit: "mL", toUnit: "L", factor: 0.001 },
  // Count Conversions
  { id: 5, category: "count", fromUnit: "unit", toUnit: "unit", factor: 1 },
];

export const useAppStateStore = create<AppState>()(
  persist(
    (set, get) => ({
      users: defaultUsers,
      activeUser: defaultUsers[0], // Start as Clara (Admin) for immediate convenience
      categories: defaultCategories,
      products: defaultProducts,
      inventoryLogs: [
        { id: 1, productId: 1, quantity: 250, unit: "L", transactionType: "IN", note: "Initial stock intake", createdAt: new Date().toISOString() },
        { id: 2, productId: 2, quantity: 180, unit: "kg", transactionType: "IN", note: "Warehouse stock intake", createdAt: new Date().toISOString() },
        { id: 3, productId: 3, quantity: 500, unit: "g", transactionType: "IN", note: "Catalyst batch inbound", createdAt: new Date().toISOString() },
        { id: 4, productId: 4, quantity: 150, unit: "L", transactionType: "IN", note: "Solvent pallet stock", createdAt: new Date().toISOString() },
        { id: 5, productId: 5, quantity: 25000, unit: "mL", transactionType: "IN", note: "Chemical acid drums", createdAt: new Date().toISOString() },
        { id: 6, productId: 6, quantity: 5000, unit: "unit", transactionType: "IN", note: "Vial batch intake", createdAt: new Date().toISOString() },
      ],
      unitConversions: defaultConversions,
      quotations: [],
      orders: [],
      notifications: [
        { id: 1, userId: "usr_admin", message: "System started successfully. Welcome, Dr. Clara Sterling.", type: "info", read: false, createdAt: new Date().toISOString() },
        { id: 2, userId: "usr_seller", message: "Your seller storefront is now online.", type: "info", read: false, createdAt: new Date().toISOString() },
      ],
      activityLogs: [
        { id: 1, userId: "System", userRole: "system", action: "SEED_DATABASE", details: "Populated default items, categories, and conversions.", createdAt: new Date().toISOString() },
      ],
      cart: [],
      searchQuery: "",

      setSearchQuery: (query) => set({ searchQuery: query }),

      // Authentication Helper Selectors & Methods
      login: (email) => {
        const user = get().users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
          if (user.status === "suspended") {
            return false;
          }
          set({ activeUser: user });
          
          // Log Activity
          const logId = get().activityLogs.length + 1;
          const newLog: ActivityLog = {
            id: logId,
            userId: user.email,
            userRole: user.role,
            action: "USER_LOGIN",
            details: `Logged in to dashboard successfully.`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
          return true;
        }
        return false;
      },

      logout: () => {
        const user = get().activeUser;
        if (user) {
          const logId = get().activityLogs.length + 1;
          const newLog: ActivityLog = {
            id: logId,
            userId: user.email,
            userRole: user.role,
            action: "USER_LOGOUT",
            details: `User logged out cleanly.`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({
            activeUser: null,
            cart: [], // Clear customer cart on logout
            activityLogs: [newLog, ...state.activityLogs],
          }));
        }
      },

      registerUser: (name, email, role) => {
        const userId = "usr_" + Math.random().toString(36).substring(2, 9);
        const newUser: User = {
          id: userId,
          name,
          email,
          role,
          status: "active",
          createdAt: new Date().toISOString(),
        };

        const currentActive = get().activeUser;
        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: currentActive ? currentActive.email : email,
          userRole: currentActive ? currentActive.role : role,
          action: "REGISTER_USER",
          details: `Registered new user ${name} (${email}) as role ${role}.`,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          users: [...state.users, newUser],
          activityLogs: [newLog, ...state.activityLogs],
        }));

        get().addNotification(userId, `Welcome to AasaMedChem, ${name}! Your account role is: ${role}.`, "info");
      },

      updateUserStatus: (id, status) => {
        const active = get().activeUser;
        if (active?.role !== "admin") return; // Admin only

        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status } : u)),
        }));

        const affectedUser = get().users.find((u) => u.id === id);
        if (affectedUser) {
          const logId = get().activityLogs.length + 1;
          const newLog: ActivityLog = {
            id: logId,
            userId: active.email,
            userRole: active.role,
            action: status === "suspended" ? "SUSPEND_USER" : "ACTIVATE_USER",
            details: `Admin changed status of ${affectedUser.name} (${affectedUser.email}) to ${status}.`,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));

          get().addNotification(id, `Your account has been ${status} by the administrator.`, status === "suspended" ? "alert" : "success");
        }
      },

      // Conversion factors logic
      getConversionFactor: (fromUnit, toUnit) => {
        if (fromUnit === toUnit) return 1;
        const conv = get().unitConversions.find(
          (c) => c.fromUnit.toLowerCase() === fromUnit.toLowerCase() && c.toUnit.toLowerCase() === toUnit.toLowerCase()
        );
        if (conv) return conv.factor;
        // Fallback checks
        const reverseConv = get().unitConversions.find(
          (c) => c.fromUnit.toLowerCase() === toUnit.toLowerCase() && c.toUnit.toLowerCase() === fromUnit.toLowerCase()
        );
        if (reverseConv) return 1 / reverseConv.factor;
        return 1;
      },

      // Product actions
      addProduct: (prod) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const id = get().products.length > 0 ? Math.max(...get().products.map((p) => p.id)) + 1 : 1;
        const newProduct: Product = {
          ...prod,
          id,
          sellerId: active.id,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          products: [...state.products, newProduct],
        }));

        // Log transaction & Audit Log
        get().adjustStock(id, prod.stockQuantity, prod.baseUnit, "IN", "Initial product stock intake");

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "CREATE_PRODUCT",
          details: `Created new product ${prod.name} (SKU: ${prod.sku}) with base price $${prod.basePrice}/${prod.baseUnit}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));

        // Notify admins/sellers
        get().addNotification("usr_admin", `New chemical added: ${prod.name} (SKU: ${prod.sku}) by ${active.name}.`, "success");
      },

      updateProduct: (id, data) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const original = get().products.find((p) => p.id === id);
        if (!original) return;

        // Verify ownership for sellers
        if (active.role === "seller" && original.sellerId !== active.id) return;

        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "UPDATE_PRODUCT",
          details: `Updated product fields for ${original.name} (SKU: ${original.sku}).`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      deleteProduct: (id) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const prod = get().products.find((p) => p.id === id);
        if (!prod) return;

        if (active.role === "seller" && prod.sellerId !== active.id) return;

        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        }));

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "DELETE_PRODUCT",
          details: `Archived/Deleted product ${prod.name} (SKU: ${prod.sku}).`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      // Categories
      addCategory: (name, description) => {
        const active = get().activeUser;
        if (active?.role !== "admin") return;

        const id = get().categories.length > 0 ? Math.max(...get().categories.map((c) => c.id)) + 1 : 1;
        const newCat: Category = { id, name, description };

        set((state) => ({
          categories: [...state.categories, newCat],
        }));

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "CREATE_CATEGORY",
          details: `Created new category: ${name}.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      // Stock levels adjustment
      adjustStock: (productId, qtyChange, unit, type, note) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;

        // Convert the qtyChange from the input unit to the base unit
        const factor = get().getConversionFactor(unit, product.baseUnit);
        const baseQtyChange = qtyChange * factor;

        set((state) => ({
          products: state.products.map((p) =>
            p.id === productId ? { ...p, stockQuantity: Math.max(0, p.stockQuantity + baseQtyChange) } : p
          ),
          inventoryLogs: [
            {
              id: state.inventoryLogs.length + 1,
              productId,
              quantity: qtyChange,
              unit,
              transactionType: type,
              note,
              createdAt: new Date().toISOString(),
            },
            ...state.inventoryLogs,
          ],
        }));

        // Trigger stock notifications if it falls below 20 baseUnits
        const updatedProduct = get().products.find((p) => p.id === productId);
        if (updatedProduct && updatedProduct.stockQuantity < 20 && updatedProduct.status === "active") {
          get().addNotification(
            updatedProduct.sellerId,
            `Stock Warning: ${updatedProduct.name} is extremely low (${updatedProduct.stockQuantity.toFixed(2)} ${updatedProduct.baseUnit} remaining).`,
            "alert"
          );
          get().addNotification(
            "usr_admin",
            `Stock Warning: ${updatedProduct.name} (SKU: ${updatedProduct.sku}) is low (${updatedProduct.stockQuantity.toFixed(2)} ${updatedProduct.baseUnit}).`,
            "alert"
          );
        }
      },

      // Add conversions
      addUnitConversion: (category, fromUnit, toUnit, factor) => {
        const active = get().activeUser;
        if (active?.role !== "admin") return;

        const id = get().unitConversions.length > 0 ? Math.max(...get().unitConversions.map((u) => u.id)) + 1 : 1;
        const newConv: UnitConversion = { id, category, fromUnit, toUnit, factor };

        set((state) => ({
          unitConversions: [...state.unitConversions, newConv],
        }));

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "CREATE_CONVERSION",
          details: `Added conversion rule: 1 ${fromUnit} = ${factor} ${toUnit} (${category}).`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      deleteUnitConversion: (id) => {
        const active = get().activeUser;
        if (active?.role !== "admin") return;

        const rule = get().unitConversions.find((c) => c.id === id);
        if (!rule) return;

        set((state) => ({
          unitConversions: state.unitConversions.filter((c) => c.id !== id),
        }));

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "DELETE_CONVERSION",
          details: `Deleted conversion rule for: ${rule.fromUnit} -> ${rule.toUnit}.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      // Cart management
      addToCart: (productId, quantity, unit) => {
        const active = get().activeUser;
        if (!active || active.role !== "customer") return;

        set((state) => {
          const existingIndex = state.cart.findIndex((item) => item.productId === productId);
          if (existingIndex > -1) {
            const updatedCart = [...state.cart];
            updatedCart[existingIndex] = { productId, quantity, unit };
            return { cart: updatedCart };
          }
          return { cart: [...state.cart, { productId, quantity, unit }] };
        });
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.productId !== productId),
        }));
      },

      updateCartQuantity: (productId, quantity, unit) => {
        set((state) => ({
          cart: state.cart.map((item) => (item.productId === productId ? { ...item, quantity, unit } : item)),
        }));
      },

      clearCart: () => set({ cart: [] }),

      submitQuotationRequest: () => {
        const active = get().activeUser;
        if (!active || active.role !== "customer" || get().cart.length === 0) return;

        // Compile items in the cart
        const qItems: QuotationItem[] = get().cart.map((item) => {
          const product = get().products.find((p) => p.id === item.productId)!;
          // Calculate unit price based on user-selected unit
          const factor = get().getConversionFactor(item.unit, product.baseUnit); // Convert unit to base
          // price = qty * basePrice * factor
          const linePrice = product.basePrice / factor; // Price per user-selected unit (e.g. if 1kg = $10, 1g = $0.01)
          const lineTotal = linePrice * item.quantity;

          return {
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: linePrice,
            totalAmount: lineTotal,
          };
        });

        const totalAmount = qItems.reduce((acc, current) => acc + current.totalAmount, 0);
        const qId = get().quotations.length > 0 ? Math.max(...get().quotations.map((q) => q.id)) + 1 : 1001;

        const newQuotation: Quotation = {
          id: qId,
          userId: active.id,
          status: "pending",
          items: qItems,
          totalAmount,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          quotations: [...state.quotations, newQuotation],
          cart: [], // Empty cart
        }));

        // Notifications
        get().addNotification("usr_admin", `New quote request #${qId} submitted by ${active.name} ($${totalAmount.toFixed(2)})`, "info");
        get().addNotification(active.id, `Quotation request #${qId} submitted successfully. Pending admin review.`, "success");

        // Sellers notification
        const affectedSellers = Array.from(new Set(qItems.map((qi) => get().products.find((p) => p.id === qi.productId)?.sellerId)));
        affectedSellers.forEach((sellerId) => {
          if (sellerId) get().addNotification(sellerId, `New quote request #${qId} received for your chemicals.`, "info");
        });

        // Audit Trail
        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "SUBMIT_QUOTATION",
          details: `Submitted quotation request #${qId} containing ${qItems.length} chemicals. Total: $${totalAmount.toFixed(2)}`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      approveQuotation: (id) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const quote = get().quotations.find((q) => q.id === id);
        if (!quote) return;

        set((state) => ({
          quotations: state.quotations.map((q) => (q.id === id ? { ...q, status: "approved" } : q)),
        }));

        // Send notification
        get().addNotification(quote.userId, `Your quotation request #${id} has been APPROVED. You can now place your order.`, "success");

        // Log Activity
        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "APPROVE_QUOTATION",
          details: `Approved quotation request #${id} (Customer ID: ${quote.userId}).`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      rejectQuotation: (id) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const quote = get().quotations.find((q) => q.id === id);
        if (!quote) return;

        set((state) => ({
          quotations: state.quotations.map((q) => (q.id === id ? { ...q, status: "rejected" } : q)),
        }));

        get().addNotification(quote.userId, `Your quotation request #${id} has been declined. Contact support for details.`, "alert");

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "REJECT_QUOTATION",
          details: `Rejected quotation request #${id}.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      convertQuotationToOrder: (id) => {
        const active = get().activeUser;
        if (!active) return;

        const quote = get().quotations.find((q) => q.id === id);
        if (!quote) return;

        // Check stock availability before converting
        let stockAvailable = true;
        let failingProduct = "";

        quote.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product) {
            const factor = get().getConversionFactor(item.unit, product.baseUnit);
            const neededBaseQty = item.quantity * factor;
            if (product.stockQuantity < neededBaseQty) {
              stockAvailable = false;
              failingProduct = product.name;
            }
          }
        });

        if (!stockAvailable) {
          get().addNotification(active.id, `Failed to convert Quote #${id} to Order. Low stock on: ${failingProduct}`, "alert");
          return;
        }

        // Deduct inventory stock
        quote.items.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId)!;
          const factor = get().getConversionFactor(item.unit, product.baseUnit);
          const neededBaseQty = item.quantity * factor;
          // Deduct
          get().adjustStock(item.productId, -item.quantity, item.unit, "OUT", `Stock deduction for order converted from quote #${id}`);
        });

        // Create the order
        const orderId = get().orders.length > 0 ? Math.max(...get().orders.map((o) => o.id)) + 1 : 5001;
        const newOrder: Order = {
          id: orderId,
          quotationId: quote.id,
          userId: quote.userId,
          status: "pending",
          items: quote.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
          })),
          totalAmount: quote.totalAmount,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          quotations: state.quotations.map((q) => (q.id === id ? { ...q, status: "converted" } : q)),
          orders: [...state.orders, newOrder],
        }));

        // Notifications
        get().addNotification(quote.userId, `Order #${orderId} generated successfully. Status: Pending.`, "success");
        get().addNotification("usr_admin", `Quotation #${id} converted into Order #${orderId} by ${active.name}.`, "success");

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "CONVERT_QUOTE_TO_ORDER",
          details: `Converted Quotation #${id} to Order #${orderId}. Inventory stock deducted.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      placeDirectOrder: (oItems) => {
        const active = get().activeUser;
        if (!active || active.role !== "customer") return;

        // Verify stocks
        let stockAvailable = true;
        let failingProduct = "";

        oItems.forEach((item) => {
          const product = get().products.find((p) => p.id === item.productId);
          if (product) {
            const factor = get().getConversionFactor(item.unit, product.baseUnit);
            const neededBaseQty = item.quantity * factor;
            if (product.stockQuantity < neededBaseQty) {
              stockAvailable = false;
              failingProduct = product.name;
            }
          }
        });

        if (!stockAvailable) {
          get().addNotification(active.id, `Failed to place order. Low stock on: ${failingProduct}`, "alert");
          return;
        }

        // Deduct inventory stock
        oItems.forEach((item) => {
          get().adjustStock(item.productId, -item.quantity, item.unit, "OUT", `Stock deduction for direct order placement`);
        });

        const totalAmount = oItems.reduce((acc, item) => acc + item.totalAmount, 0);
        const orderId = get().orders.length > 0 ? Math.max(...get().orders.map((o) => o.id)) + 1 : 5001;

        const newOrder: Order = {
          id: orderId,
          userId: active.id,
          status: "pending",
          items: oItems,
          totalAmount,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          orders: [...state.orders, newOrder],
        }));

        get().addNotification(active.id, `Order #${orderId} placed successfully. Status: Pending.`, "success");
        get().addNotification("usr_admin", `New direct order #${orderId} placed by customer ${active.name} ($${totalAmount.toFixed(2)}).`, "info");

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "PLACE_DIRECT_ORDER",
          details: `Placed direct order #${orderId}. Total: $${totalAmount.toFixed(2)}.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      updateOrderStatus: (id, status) => {
        const active = get().activeUser;
        if (!active || active.role === "customer") return;

        const order = get().orders.find((o) => o.id === id);
        if (!order) return;

        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));

        get().addNotification(order.userId, `Your order #${id} status has been updated to: ${status.toUpperCase()}.`, "info");

        // If order cancelled, return stocks
        if (status === "cancelled") {
          order.items.forEach((item) => {
            get().adjustStock(item.productId, item.quantity, item.unit, "IN", `Returned stock from cancelled order #${id}`);
          });
        }

        const logId = get().activityLogs.length + 1;
        const newLog: ActivityLog = {
          id: logId,
          userId: active.email,
          userRole: active.role,
          action: "UPDATE_ORDER_STATUS",
          details: `Updated order #${id} status to ${status}.`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ activityLogs: [newLog, ...state.activityLogs] }));
      },

      // Notification triggers
      addNotification: (userId, message, type) => {
        set((state) => {
          const id = state.notifications.length > 0 ? Math.max(...state.notifications.map((n) => n.id)) + 1 : 1;
          const newNotif: Notification = {
            id,
            userId,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString(),
          };
          return { notifications: [newNotif, ...state.notifications] };
        });
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllNotificationsRead: (userId) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
        }));
      },
    }),
    {
      name: "aasamedchem-state-store",
    }
  )
);
