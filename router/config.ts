import type {
  VersionType,
  RouterConfigType,
  RouterRegex,
  RouteType,
  ViewModulesType,
} from "./types";

/**
 * Router version number
 * @since 0.1.1
 */
export const version: VersionType = "0.4.1";

/**
 * Constants for route parsing
 * @since 0.2.5
 */
export const REGEX: RouterRegex = {
  LANG_CODE: /^\/([a-z]{2})\//,
  PARAM: /{([^}]+)}/g,
  PARAM_REPLACE: /{[^}]+}/g,
};

/**
 * Core router configuration
 * Default settings that can be overridden via initRouter()
 * @since 0.1.0
 */
export const routerConfig: RouterConfigType = {
  defaultLang: "en",
  currentLang: "en",
  supportedLangs: ["en"],
  routes: {} as Record<string, RouteType>,
  routeModules: undefined,
  views: {} as ViewModulesType,
  viewsCache: new Map<string, { default: any }>(),
  viewsPath: "/src/views",
  viewsExtension: "jsx",
};

/**
 * Initialize router with custom configuration
 * @param config Configuration object
 * @param config.defaultLang Default language code
 * @param config.currentLang Current language code
 * @param config.supportedLangs Array of supported languages
 * @param config.routes Routes configuration
 * @param config.routeModules Route modules from Vite's glob import
 * @param config.views View modules from Vite's glob import
 * @param config.viewsCache Views cache
 * @param config.viewsPath Path to the views folder
 * @param config.viewsExtension Views extension
 * @example
 * ```ts
 * initRouter({
 *   defaultLang: "en",
 *   routes: { home: { view: "Home", paths: { en: "/home", fr: "/accueil" } } },
 *   views: { home: () => import("./views/Home.jsx") },
 * });
 * ```
 * @since 0.1.0
 */
export const initRouter = async (config: Partial<RouterConfigType> = {}): Promise<void> => {
  Object.assign(routerConfig, config);
};
