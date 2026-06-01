export interface Plugin {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string | null;
  author: string | null;
  entryPoint: string;
  config: Record<string, unknown> | null;
  isActive: boolean;
  installedAt: number;
  updatedAt: number;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  hooks: string[];
  configSchema?: Record<string, { type: string; label: string; default?: unknown }>;
}
