"use server";

import { db } from "../db/db";
import { users, roles, activityLogs } from "../db/schema";
import { eq, and, desc, not } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSellers() {
  try {
    const sellerRole = await db.select().from(roles).where(eq(roles.name, "Seller"));
    if (!sellerRole.length) return [];

    const sellersList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        companyName: users.companyName,
        gstNumber: users.gstNumber,
        licenseUrl: users.licenseUrl,
        verificationStatus: users.verificationStatus,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.roleId, sellerRole[0].id))
      .orderBy(desc(users.createdAt));
      
    return sellersList;
  } catch (error) {
    console.error("Failed to get sellers", error);
    return [];
  }
}

export async function approveSeller(userId: number) {
  try {
    await db.update(users).set({ verificationStatus: "approved" }).where(eq(users.id, userId));
    
    // Log activity
    await db.insert(activityLogs).values({
      userId: userId,
      action: "Seller Approved",
      entityType: "user",
      entityId: userId,
    });
    
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (error) {
    console.error("Failed to approve seller", error);
    return { success: false, message: "Failed to approve seller" };
  }
}

export async function rejectSeller(userId: number) {
  try {
    await db.update(users).set({ verificationStatus: "rejected" }).where(eq(users.id, userId));
    
    // Log activity
    await db.insert(activityLogs).values({
      userId: userId,
      action: "Seller Rejected",
      entityType: "user",
      entityId: userId,
    });
    
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (error) {
    console.error("Failed to reject seller", error);
    return { success: false, message: "Failed to reject seller" };
  }
}

export async function toggleUserRole(userId: number, nextRoleId: number) {
  try {
    await db.update(users).set({ roleId: nextRoleId }).where(eq(users.id, userId));
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle user role", error);
    return { success: false };
  }
}
