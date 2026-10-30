import { currentUserController } from "@/lib/controllers/auth.controller";

/** GET /api/auth/me: the signed-in user, decoded from the session cookie. */
export const GET = currentUserController;
