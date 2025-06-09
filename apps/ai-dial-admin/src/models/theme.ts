export interface ThemeConfiguration {
  themes: Theme[];
  images: ThemeImages;
}

export interface ThemeImages {
  'default-addon': string;
  'default-model': string;
  favicon: string;
}

export interface Theme {
  id: string;
  displayName: string;
  colors: Record<string, string>;
  'app-logo': string;
}
