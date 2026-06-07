/**
 * lib/admin-auth.ts
 * 
 * Unified admin authorization helper for /api/admin/* routes.
 * Returns the authenticated user with role info, or throws 401/403.
 * 
 * Usage in any /api/admin/* route handler:
 *   const admin = await adminAuth();
 *   // admin is { id, email, role }
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

const ALLOWED_ROLES = ["ADMIN_DATA", "SUPER_ADMIN"];

export interface AdminUser {
  id: string;
  email: string;
  role: string;
}

type AuthResult =
  | { authorized: true; user: AdminUser }
  | { authorized: false; response: NextResponse };

async function checkAdminAuth(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }

  const role = (session.user as any).role;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "无权限访问管理接口" }, { status: 403 }),
    };
  }

  return {
    authorized: true,
    user: {
      id: session.user.id,
      email: session.user.email || "",
      role,
    },
  };
}

/**
 * Authenticate admin request. Returns the admin user or throws a Response.
 * Wrap in a try/catch if you need custom error handling.
 */
export async function adminAuth(): Promise<AdminUser> {
  const result = await checkAdminAuth();
  if (!result.authorized) {
    throw result.response;
  }
  return result.user;
}
