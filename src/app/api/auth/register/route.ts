import { handleApiError, ok, readJson } from "@/lib/api/http";
import { startSession } from "@/lib/auth/session";
import { registerUser } from "@/lib/services/auth";

/** POST /api/auth/register: { name, email, password, confirmPassword } */
export async function POST(request: Request) {
  try {
    const user = await registerUser(await readJson(request));
    await startSession(user);
    return ok(
      { user: { id: user.sub, name: user.name, email: user.email, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
