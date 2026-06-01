export interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    color: string | null;
    createdAt: number;
    updatedAt: number;
}
export interface CategoryWithChildren extends Category {
    children: CategoryWithChildren[];
    postCount?: number;
}
export interface Tag {
    id: string;
    name: string;
    slug: string;
    createdAt: number;
}
//# sourceMappingURL=category.d.ts.map