import { revalidatePath } from "next/cache";
import { handleApiError, ok, readJson } from "@/lib/api/http";
import { requireAdmin, requireSession } from "@/lib/auth/session";
import { listMatches, recordMatch } from "@/lib/services/matches";

export async function listMatchesController() {
  try {
    await requireSession();
    return ok(await listMatches());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function createMatchController(request: Request) {
  try {
    const session = await requireAdmin();
    const match = await recordMatch(await readJson(request), session.sub);
    revalidatePath("/dashboard", "layout");
    return ok(match, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
