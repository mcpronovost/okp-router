/// <reference types="vite/client" />

import type {
  VersionType,
  RouterConfigType,
  RouterRegex,
  RouteType,
  RouteModulesType,
  ViewModulesType,
  RouteHelpersType,
} from "./types";

/**
 * Router version number
 * @since 0.1.1
 */
export const version: VersionType = "0.3.0";

/**
 * Core router configuration
 * Default settings that can be overridden via initRouter()
 * @since 0.1.0
 */
export const routerConfig: RouterConfigType = {
  defaultLang: "en",
  supportedLangs: ["en"],
  routes: {} as Record<string, RouteType>,
  routeModules: undefined,
  views: {} as ViewModulesType,
  viewsCache: new Map<string, { default: any }>(),
  viewsExtension: "jsx",
};

/**
 * Constants for route parsing
 * @since 0.2.5
 */
const REGEX: RouterRegex = {
  LANG_CODE: /^\/([a-z]{2})\//,
  PARAM: /{([^}]+)}/g,
  PARAM_REPLACE: /{[^}]+}/g,
};

/**
 * Initialize router with custom configuration
 * @param config Configuration object
 * @param config.defaultLang Default language code
 * @param config.supportedLangs Array of supported languages
 * @param config.routes Routes configuration
 * @param config.routeModules Route modules from Vite's glob import
 * @param config.views View modules from Vite's glob import
 * @param config.viewsCache Views cache
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
export const initRouter = (config: Partial<RouterConfigType> = {}): void => {
  Object.assign(routerConfig, config);
};

/**
 * Get all routes
 * @param modules Route modules from Vite's glob import
 * @returns Object with all routes
 * @since 0.1.1
 */
export const getRoutes = (modules?: RouteModulesType | undefined): Record<string, RouteType> => {
  if (modules || routerConfig.routeModules) {
    return (() => {
      return Object.values(
        modules || routerConfig.routeModules || {}
      ).reduce<Record<string, RouteType>>((acc, module) => {
        const firstRoute = Object.values(module)[0] as unknown as Record<string, RouteType>;
        return { ...acc, ...firstRoute };
      }, {});
    })()
  }
  return routerConfig.routes;
};

/**
 * Get all views
 * @returns Object with all views
 * @since 0.2.0
 */
export const getViews = (): ViewModulesType | null => {
  if (!Object.keys(routerConfig.views).length) {
    showRouterError(
      "No views found",
      "Please check router config or your views folder and make sure it contains the correct " +
      "files."
    );
    return null;
  }
  return routerConfig.views;
};

/**
 * Get the current view
 * @returns A promise with the current view module, auth, props and params
 * @since 0.2.0
 */
export const getView = async (): Promise<{
  viewModule: { default: any };
  auth: boolean;
  props: Record<string, any> | null;
  params: Record<string, string> | null;
}> => {
  const DEFAULT_NULL_VIEW = {
    viewModule: { default: () => null },
    auth: false,
    props: null,
    params: null
  };

  const documentElement = document.documentElement;
  const documentLang = documentElement.lang;
  const currentPath = window.location.pathname
  const [, langCode, ...uriParts] = currentPath.split(REGEX.LANG_CODE);
  const uri = uriParts.join("/");

  try {
    // If the language is not supported, redirect to the default language
    if (!langCode || !routerConfig.supportedLangs.includes(langCode)) {
      window.location.href = `/${routerConfig.defaultLang}/${uri || currentPath.replace(/^\//, "")}`;
      throw new Error("Language not supported");
    }

    // If the document language is not the current language, change the language
    if (documentLang !== langCode) {
      documentElement.lang = langCode;
    }

    const route = findRoute(uri, langCode);

    // If no route found, redirect to the 404 page
    if (!route && !currentPath.endsWith(`/${langCode}/404`)) {
      window.location.href = `/${langCode}/404`;
      throw new Error("No route found");
    }

    const [_, { view, auth, props, params }] = route;
    const viewPath = `./views/${view}.${routerConfig.viewsExtension}`;

    // Check cache first
    if (routerConfig.viewsCache.has(viewPath)) {
      const viewModule = routerConfig.viewsCache.get(viewPath) as { default: any };
      return { viewModule, auth: auth || false, props: props || null, params: params || null };
    }

    // If no view found, redirect to the 404 page
    if (!routerConfig.views[viewPath]) {
      if (!currentPath.endsWith(`/${langCode}/404`)) {
        window.location.href = `/${langCode}/404`;
        throw new Error("No view found");
      }
      throw new Error("No 404 view found", {
        cause: `Be sure to create an \"errors/404.${routerConfig.viewsExtension}\" file in your views folder.`
      });
    }

    const viewModule = await routerConfig.views[viewPath]();

    // Cache the view module
    routerConfig.viewsCache.set(viewPath, viewModule);

    return { viewModule, auth: auth || false, props: props || null, params: params || null };
  } catch (e) {
    if (e instanceof Error && e.cause) {
      showRouterError(e.message, e.cause as string);
    }
    return DEFAULT_NULL_VIEW;
  }
}

/**
 * Recursively finds a route by matching the URI to translations in the route map
 * @param uri The URI path to match against route translations
 * @param lang The language code to use for matching (e.g., "en" or "fr")
 * @param routesList Optional route map to search through. Defaults to global routes if not provided
 * @param parentPath Optional dot-notation path of parent routes. Used internally for recursion
 * @returns A tuple containing [fullRoutePath, routeObject] if found, undefined otherwise
 * @since 0.1.0
 */
export const findRoute = (
  uri: string,
  lang: string = routerConfig.defaultLang,
  routesList?: Record<string, RouteType>,
  parentPath: string = ""
): [string, RouteType] => {
  if (!routesList) routesList = getRoutes();
  if (uri === "/") uri = "";
  const params = {};

  for (const [key, route] of Object.entries(routesList)) {
    const fullPath = parentPath ? `${parentPath}.${key}` : key;
    const routePath = route.paths[lang];

    // Handle dynamic path segments
    if (routePath.toString().includes("{")) {
      // Extract parameter names from the route path
      const paramNames = [...routePath.matchAll(REGEX.PARAM)].map(
        (match) => match[1]
      );
      const pathPattern = routePath.replace(REGEX.PARAM, "([^/]+)");
      const regex = new RegExp(`^${pathPattern}$`);
      const matches = uri.match(regex);

      if (matches) {
        // Store captured values with their parameter names
        paramNames.forEach((name, index) => {
          params[name] = matches[index + 1];
        });
        return [fullPath, { ...route, params }];
      }
    } else if (routePath === uri) {
      return [fullPath, { ...route, params }];
    }

    // Check for child routes recursively
    if (route.children) {
      const childUri = `${route.paths[lang]}/`;
      if (
        uri.startsWith(childUri) ||
        (routePath.includes("{") &&
          new RegExp(`^${routePath.replace(REGEX.PARAM_REPLACE, "[^/]+")}/`).test(uri))
      ) {
        const nextParentPath = parentPath ? `${parentPath}.${key}` : key;

        // Extract params from current level if it's a dynamic route
        if (routePath.includes("{")) {
          const paramNames = [...routePath.matchAll(/{([^}]+)}/g)].map(
            (match) => match[1]
          );
          const pathPattern = routePath.replace(REGEX.PARAM_REPLACE, "([^/]+)");
          const matches = uri.match(new RegExp(`^${pathPattern}/`));
          if (matches) {
            paramNames.forEach((name, index) => {
              params[name] = matches[index + 1];
            });
          }
        }

        const childRoute = findRoute(
          uri.replace(
            new RegExp(`^${routePath.replace(/{[^}]+}/g, "[^/]+")}/`),
            ""
          ),
          lang,
          route.children,
          nextParentPath
        );

        if (childRoute) {
          // Merge params from child route with current params
          return [childRoute[0], childRoute[1]];
        }
      }
    }
  }

  return [
    uri, {
      view: "errors/404",
      paths: {},
      auth: false,
      props: {},
      params: {},
    },
  ];
};

/**
 * Translates a route URI from one language to another
 * @param uri The current URI path
 * @param fromLang The language code of the current URI
 * @param toLang The target language code to translate the URI to
 * @returns The translated URI path in the new language, or the original URI if no translation is found
 * @since 0.1.0
 */
export const findLocaleRoute = (
  uri: string,
  fromLang: string = "en",
  toLang: string = routerConfig.defaultLang,
  additionalParams?: Record<string, string>
): string => {
  // Find the current route based on the URI and current language
  const currentRoute = findRoute(uri, fromLang);
  if (!currentRoute) return `/${toLang}/${uri}`;

  const [routePath, routeData] = currentRoute;
  const params = { ...routeData.params, ...additionalParams };

  // Split the route path to handle nested routes
  const routeParts = routePath.split(".");
  let routesList = getRoutes();
  let toPath = "";

  // Build the new path by traversing the route tree
  for (let i = 0; i < routeParts.length; i++) {
    const part = routeParts[i];
    const currentPart = routesList[part];

    if (currentPart) {
      toPath += (i > 0 ? "/" : "") + currentPart.paths[toLang];
      routesList = currentPart.children || {};
    }
  }

  // Replace params in the path
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      toPath = toPath.replace(`{${key}}`, value);
    }
  }

  return `/${toLang}/${toPath}`;
};

/**
 * Alias for findLocaleRoute
 * @since 0.2.6
 */
export const r = findLocaleRoute;

/**
 * Get the route object for the target language
 * @param toLang The target language code to use for the route (e.g., "en" or "fr")
 * @returns An object containing the route functions for the target language
 * @since 0.1.0
 */
export const getRoute = (
  toLang: string = routerConfig.defaultLang
): RouteHelpersType => {
  return {
    r: (uri: string, params?: Record<string, string>) => r(uri, "en", toLang, params),
  };
};

/**
 * Show a router error
 * @param title The title of the error
 * @param message The message of the error
 * @since 0.2.0
 */
const showRouterError = (title: string = "An error occurred", message?: string) => {
  console.error(title);
  window.document.body.innerHTML =
  "<div style=\"" +
  "background-color: #522; border-radius: 12px;" +
  "color: #D44; font-family: monospace; text-align: center;" +
  "max-width: 400px;" +
  "padding: 20px; margin: 32px auto;" +
  "\">" +
  "<h1>" + title + "</h1>" +
  (message ? "<p>" + message + "</p>" : "") +
  "</div>";
};
