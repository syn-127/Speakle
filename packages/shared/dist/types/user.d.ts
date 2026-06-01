export type UserRole = 'admin' | 'editor' | 'viewer';
export interface User {
    id: string;
    email: string;
    username: string;
    role: UserRole;
    avatarUrl: string | null;
    displayName: string | null;
    bio: string | null;
    createdAt: number;
    updatedAt: number;
}
export type SafeUser = Omit<User, never>;
//# sourceMappingURL=user.d.ts.map