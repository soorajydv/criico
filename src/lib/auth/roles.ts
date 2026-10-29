// Kept free of Mongoose imports: middleware.ts runs on the Edge runtime.
export const USER_ROLES = ["ADMIN", "VIEWER"] as const;
export type UserRole = (typeof USER_ROLES)[number];
