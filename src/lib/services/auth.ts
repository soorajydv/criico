import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db/connect";
import { User, type UserDoc } from "@/lib/db/models/user";
import type { SessionPayload } from "@/lib/auth/jwt";
import { ConflictError, UnauthorizedError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validation/auth";

const BCRYPT_ROUNDS = 10;

// Compared against when the email is unknown, so "no such user" and "wrong
// password" take the same time and the response cannot be used to probe
// which emails are registered.
const DUMMY_HASH = bcrypt.hashSync("criico-timing-equaliser", BCRYPT_ROUNDS);

function toSessionPayload(user: Pick<UserDoc, "_id" | "name" | "email" | "role">): SessionPayload {
  return { sub: user._id.toString(), name: user.name, email: user.email, role: user.role };
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export async function registerUser(input: unknown): Promise<SessionPayload> {
  const { name, email, password } = registerSchema.parse(input);
  await connectDB();

  if (await User.exists({ email })) {
    throw new ConflictError("An account with this email already exists");
  }

  try {
    const user = await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    });
    return toSessionPayload(user);
  } catch (error) {
    // Two sign-ups racing past the exists() check: the unique index decides.
    if (isDuplicateKeyError(error)) {
      throw new ConflictError("An account with this email already exists");
    }
    throw error;
  }
}

export async function authenticateUser(input: unknown): Promise<SessionPayload> {
  const { email, password } = loginSchema.parse(input);
  await connectDB();

  const user = await User.findOne({ email }).select("+passwordHash").lean<UserDoc>();
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !valid) {
    throw new UnauthorizedError("Invalid email or password");
  }
  return toSessionPayload(user);
}
