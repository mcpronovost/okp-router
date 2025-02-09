export interface RouterConfigType {
  defaultLang: string;
}

export interface RouteType {
  view: string;
  paths: Record<string, string>;
  auth?: boolean;
  props?: Record<string, any>;
  params?: Record<string, string>;
  children?: Record<string, RouteType>;
}

export interface RouteModulesType {
  [filePath: string]: {
    routes: Record<string, RouteType>;
  };
}

export interface RouteHelpersType {
  r: (uri: string, params?: Record<string, string>) => string;
}
