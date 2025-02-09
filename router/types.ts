export interface RouterConfigType {
  defaultLang: string;
  supportedLangs: string[];
  routes: Record<string, RouteType>;
  routeModules?: Record<string, RouteModulesType> | undefined;
  views: Record<string, ViewModulesType>;
  viewsCache: Map<string, { default: any }>;
  viewsExtension: string;
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

export interface ViewModulesType {
  [filePath: string]: () => Promise<{ default: any }>;
}

export interface RouteHelpersType {
  r: (uri: string, params?: Record<string, string>) => string;
}
