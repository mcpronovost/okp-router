export interface RouterConfigType {
  defaultLang: string;
}

export interface RouteConfigType {
  view: string;
  paths: Record<string, string>;
  auth?: boolean;
  props?: Record<string, any>;
  params?: Record<string, string>;
  children?: Record<string, RouteConfigType>;
}

export interface RouteModuleType {
  [key: string]: RouteConfigType;
}

export interface RouteHelpersType {
  r: (uri: string, params?: Record<string, string>) => string;
}
