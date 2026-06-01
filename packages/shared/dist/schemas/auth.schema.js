import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
});
//# sourceMappingURL=auth.schema.js.map