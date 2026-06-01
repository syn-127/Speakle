export const USER_ROLES = ['admin', 'editor', 'viewer'] as const;

export const ROLE_PERMISSIONS = {
  admin: ['*'],
  editor: ['posts:*', 'categories:read', 'tags:*', 'media:*', 'comments:*'],
  viewer: ['posts:read', 'categories:read', 'tags:read'],
} as const;
