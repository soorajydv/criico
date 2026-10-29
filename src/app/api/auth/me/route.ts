import { handleApiError, ok } from "@/lib/api/http";
import { requireSession } from "@/lib/auth/session";

/** GET /api/auth/me: the signed-in user, decoded from the session cookie. */
export async function GET() {
  try {
    const session = await requireSession();
    return ok({ user: { id: session.sub, name: session.name, email: session.email, role: session.role } });
  } catch (error) {
    return handleApiError(error);
  }
}
