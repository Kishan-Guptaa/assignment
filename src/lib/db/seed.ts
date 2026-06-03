import { db } from "./db";
import { roles, categories, unitConversions } from "./schema";

export async function seedDatabase() {
  try {
    // 1. Seed Roles
    const existingRoles = await db.select().from(roles).limit(1);
    if (existingRoles.length === 0) {
      await db.insert(roles).values([
        { id: 1, name: "Admin" },
        { id: 2, name: "Seller" },
        { id: 3, name: "User" },
      ]);
      console.log("Seeded default roles successfully!");
    }

    // 2. Seed Categories
    const existingCategories = await db.select().from(categories).limit(1);
    if (existingCategories.length === 0) {
      await db.insert(categories).values([
        { id: 1, name: "Acids", description: "General acids and laboratory solutions" },
        { id: 2, name: "Solvents", description: "High-purity organic chemical solvents" },
        { id: 3, name: "Laboratory Chemicals", description: "General reagents and laboratory compounds" },
        { id: 4, name: "Organic Chemicals", description: "Organic synthesis building blocks" },
        { id: 5, name: "Inorganic Chemicals", description: "Salts, bases and inorganic reactions" },
      ]);
      console.log("Seeded default categories successfully!");
    }

    // 3. Seed Unit Conversions
    const existingConversions = await db.select().from(unitConversions).limit(1);
    if (existingConversions.length === 0) {
      await db.insert(unitConversions).values([
        { unitType: "weight", fromUnit: "kg", toUnit: "g", factor: 1000 },
        { unitType: "weight", fromUnit: "g", toUnit: "kg", factor: 0.001 },
        { unitType: "volume", fromUnit: "L", toUnit: "mL", factor: 1000 },
        { unitType: "volume", fromUnit: "mL", toUnit: "L", factor: 0.001 },
        { unitType: "count", fromUnit: "unit", toUnit: "unit", factor: 1 },
      ]);
      console.log("Seeded default unit conversions successfully!");
    }
  } catch (error) {
    console.error("Database seeding encountered an error:", error);
  }
}
export default seedDatabase;
