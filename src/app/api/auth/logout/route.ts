import { logoutController } from "@/lib/controllers/auth.controller";

/** POST /api/auth/logout: clears the session cookie. */
export const POST = logoutController;
