export interface Theme {
    id: string;
    name: string;
    slug: string;
    version: string;
    author: string | null;
    previewUrl: string | null;
    config: ThemeConfig | null;
    isActive: boolean;
    isBundled: boolean;
    installedAt: number;
}
export interface ThemeConfig {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    headingFont?: string;
    layout?: 'standard' | 'wide' | 'sidebar';
    [key: string]: unknown;
}
export interface ThemeManifest {
    id: string;
    name: string;
    version: string;
    author: string;
    screenshot: string;
    configSchema: Record<string, {
        type: 'color' | 'select' | 'text';
        label: string;
        options?: string[];
        default: unknown;
    }>;
}
//# sourceMappingURL=theme.d.ts.map