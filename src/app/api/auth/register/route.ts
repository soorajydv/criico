import { registerController } from "@/lib/controllers/auth.controller";

/** POST /api/auth/register: { name, email, password, confirmPassword } */
export const POST = registerController;
