// Extended TechStack interface with additional details
export interface TechStackDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription?: string;
  icon: 'code' | 'server' | 'database' | 'layers' | 'globe';
  popularity?: number; // 1-10 scale
  isNew?: boolean;
  version?: string;
  releaseDate?: string;
  documentationLinks?: {
    id: string
    name: string;
    url: string;
    description?: string;
  }[];
  /** Management Control Panel server configurations */
  mcpServers?: {
    id: string;
    name: string;
    configuration: {
      command: string;
      args: string[];
      [key: string]:
        | string
        | string[]
        | number
        | boolean
        | Record<string, unknown>;
    };
  }[];
}
