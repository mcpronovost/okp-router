export type VersionType = `${number}.${number}.${number}`;

export interface RouterConfigType {
  defaultLang?: string;
  currentLang?: string;
  supportedLangs?: string[];
  routes?: Record<string, RouteType>;
  routeModules?: Record<string, RouteModulesType> | undefined;
  views?: ViewModulesType;
  viewsCache?: Map<string, { default: any }>;
  viewsPath?: string;
  /** @deprecated Use `viewsExtensions` instead. This will be removed in a future version. */
  viewsExtension?: string;
  viewsExtensions?: string[];
}

export interface RouterRegex {
  LANG_CODE: RegExp;
  PARAM: RegExp;
  PARAM_REPLACE: RegExp;
};

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
  switchLang: (toLang: string, additionalParams?: Record<string, string>) => string;
}
