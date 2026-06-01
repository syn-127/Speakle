export declare const USER_ROLES: readonly ["admin", "editor", "viewer"];
export declare const ROLE_PERMISSIONS: {
    readonly admin: readonly ["*"];
    readonly editor: readonly ["posts:*", "categories:read", "tags:*", "media:*", "comments:*"];
    readonly viewer: readonly ["posts:read", "categories:read", "tags:read"];
};
//# sourceMappingURL=roles.d.ts.map