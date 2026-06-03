"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "../db/db";
import { users, roles, activityLogs } from "../db/schema";
import { seedDatabase } from "../db/seed";

const SESSION_COOKIE_NAME = "aasamedchem_session";

interface SessionData {
  userId: number;
  email: string;
  roleId: number;
}

/**
 * Ensures basic seeds exist, then registers a new user with hashed credentials.
 */
export async function signupUser(formData: {
  name: string;
  email: string;
  passwordText: string;
  roleId: number;
  phone?: string;
  companyName?: string;
  gstNumber?: string;
  licenseUrl?: string;
}) {
  try {
    // 1. Ensure basic roles and settings exist in database
    await seedDatabase();

    // 2. Validate email availability
    const existing = await db.select().from(users).where(eq(users.email, formData.email.toLowerCase()));
    if (existing.length > 0) {
      return { success: false, message: "Email address is already registered." };
    }

    // 3. Encrypt password
    const hashedPassword = bcrypt.hashSync(formData.passwordText, 10);

    // 4. Create database user
    const [inserted] = await db.insert(users).values({
      name: formData.name,
      email: formData.email.toLowerCase(),
      password: hashedPassword,
      roleId: formData.roleId,
      phone: formData.phone || null,
      companyName: formData.companyName || null,
      gstNumber: formData.gstNumber || null,
      licenseUrl: formData.licenseUrl || null,
    }).returning();

    // 5. Log activity
    const userRole = formData.roleId === 1 ? "Admin" : formData.roleId === 2 ? "Seller" : "User";
    await db.insert(activityLogs).values({
      userId: inserted.id,
      action: `${userRole} Registration`,
      entityType: "user",
      entityId: inserted.id,
    });

    // 6. Establish Session
    await createSession({
      userId: inserted.id,
      email: inserted.email,
      roleId: inserted.roleId,
    });

    return { success: true, user: { id: inserted.id, name: inserted.name, email: inserted.email } };
  } catch (error: any) {
    console.error("Signup Action Error:", error);
    return { success: false, message: error?.message || "Registration failed due to database connectivity issue." };
  }
}

/**
 * Validates credentials and logs the user in.
 */
export async function loginUser(email: string, passwordText: string) {
  try {
    // Check seed on logins too
    await seedDatabase();

    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    if (!user) {
      return { success: false, message: "No account found with this email." };
    }

    // Verify password hash
    const isPasswordValid = bcrypt.compareSync(passwordText, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Invalid email or password." };
    }

    // Establish Session
    await createSession({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
    });

    // Log login activity
    await db.insert(activityLogs).values({
      userId: user.id,
      action: `User Login`,
      entityType: "user",
      entityId: user.id,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Login Action Error:", error);
    return { success: false, message: "Database query failure. Check database link." };
  }
}

/**
 * Removes user cookies session.
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME);
  if (session) {
    try {
      const data = JSON.parse(session.value) as SessionData;
      await db.insert(activityLogs).values({
        userId: data.userId,
        action: `User Logout`,
        entityType: "user",
        entityId: data.userId,
      });
    } catch {}
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  return { success: true };
}

/**
 * Resolves current cookie session to actual user row + role.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE_NAME);
    if (!session) return null;

    const data = JSON.parse(session.value) as SessionData;
    const [user] = await db.select().from(users).where(eq(users.id, data.userId));
    if (!user) return null;

    const [role] = await db.select().from(roles).where(eq(roles.id, user.roleId));
    let roleStr = role ? role.name.toLowerCase() : "customer";
    if (roleStr === "user") roleStr = "customer";
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      role: roleStr as "admin" | "seller" | "customer",
      phone: user.phone,
      companyName: user.companyName,
      gstNumber: user.gstNumber,
      licenseUrl: user.licenseUrl,
      verificationStatus: user.verificationStatus,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches users list for Admin panel.
 */
export async function getUsersList() {
  try {
    const list = await db.select().from(users);
    const rolesList = await db.select().from(roles);
    
    return list.map((u) => {
      const roleName = rolesList.find((r) => r.id === u.roleId)?.name || "User";
      let roleStr = roleName.toLowerCase();
      if (roleStr === "user") roleStr = "customer";
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: roleStr as "admin" | "seller" | "customer",
        phone: u.phone,
        status: "active" as const, // For admin toggles interface alignment
      };
    });
  } catch (error) {
    console.error("Fetch Users list failure:", error);
    return [];
  }
}

/**
 * Automatically registers and authenticates demo profiles in the database
 */
export async function quickLoginDemo(email: string) {
  try {
    await seedDatabase();
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    
    if (!user) {
      let name = "Biotech Innovations Inc.";
      let roleId = 3;
      if (email.includes("admin")) {
        name = "Dr. Clara Sterling";
        roleId = 1;
      } else if (email.includes("seller")) {
        name = "Apex Reagents Ltd.";
        roleId = 2;
      }
      
      await signupUser({
        name,
        email,
        passwordText: "password123",
        roleId,
        phone: "+91 98765 43210",
      });
    }

    return await loginUser(email, "password123");
  } catch (error) {
    console.error("Quick Login Demo Error:", error);
    return { success: false, message: "Demo authentication failed." };
  }
}

// Session writing helper
async function createSession(data: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days session
    path: "/",
  });
}

/**
 * Updates the user's profile
 */
export async function updateUserProfile(userId: number, updates: {
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  gstNumber?: string;
  licenseUrl?: string;
}) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser || sessionUser.id !== userId) {
      return { success: false, message: "Unauthorized." };
    }

    if (updates.email && updates.email.toLowerCase() !== sessionUser.email.toLowerCase()) {
      const existing = await db.select().from(users).where(eq(users.email, updates.email.toLowerCase()));
      if (existing.length > 0) {
        return { success: false, message: "Email address is already taken." };
      }
    }

    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.email !== undefined) payload.email = updates.email.toLowerCase();
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.companyName !== undefined) payload.companyName = updates.companyName;
    if (updates.gstNumber !== undefined) payload.gstNumber = updates.gstNumber;
    if (updates.licenseUrl !== undefined) payload.licenseUrl = updates.licenseUrl;

    await db.update(users).set(payload).where(eq(users.id, userId));
    
    return { success: true, message: "Profile updated successfully." };
  } catch (error) {
    console.error("Update Profile Error:", error);
    return { success: false, message: "Failed to update profile." };
  }
}
