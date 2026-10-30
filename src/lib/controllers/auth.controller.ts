import { handleApiError, ok, readJson } from "@/lib/api/http";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth/jwt";
import { endSession, requireSession, startSession } from "@/lib/auth/session";
import { authenticateUser, registerUser } from "@/lib/services/auth";

const userResponse = (user: { sub: string; name: string; email: string; role: string }) => ({
  id: user.sub,
  name: user.name,
  email: user.email,
  role: user.role,
});

export async function loginController(request: Request) {
  try {
    const user = await authenticateUser(await readJson(request));
    await startSession(user);
    return ok({ user: userResponse(user), expiresIn: SESSION_MAX_AGE_SECONDS });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function registerController(request: Request) {
  try {
    const user = await registerUser(await readJson(request));
    await startSession(user);
    return ok({ user: userResponse(user) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function logoutController() {
  await endSession();
  return ok({ loggedOut: true });
}

export async function currentUserController() {
  try {
    const session = await requireSession();
    return ok({ user: userResponse(session) });
  } catch (error) {
    return handleApiError(error);
  }
}
