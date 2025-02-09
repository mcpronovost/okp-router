/// <reference types="vite/client" />

import type {
  RouterConfigType,
  RouteType,
  RouteModulesType,
  ViewModulesType,
  RouteHelpersType,
} from "./types";

/**
 * Router version
 * @type {string}
 */
export const version: string = "0.2.0";

/**
 * Configure router settings
 * @type {Object}
 */
export const routerConfig = {
  defaultLang: "en",
  supportedLangs: ["en"],
  routes: {} as Record<string, RouteType>,
  routeModules: undefined,
  views: {} as ViewModulesType,
};

/**
 * Initialize router with custom configuration
 * @param {Object} config - Configuration object
 * @param {string} config.defaultLang - Default language code
 * @param {Record<string, RouteType>} config.routes - Routes configuration
 */
export const initRouter = (config: Partial<RouterConfigType> = {}): void => {
  Object.assign(routerConfig, config);
};

/**
 * Get all routes
 * @param {RouteModuleType} modules - All routes modules
 * @returns {Record<string, RouteType>} - All routes
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

export const getView = async (): Promise<{ viewModule: any, props: any, params: any }> => {
  const nullView = { viewModule: {default: () => null}, props: null, params: null }
  const documentLang = document.documentElement.lang;
  const currentPath = window.location.pathname
  const [, langCode, ...uriParts] = currentPath.split(/^\/([a-z]{2})\//);
  const uri = uriParts.join("/");

  try {
    // If the language is not supported, redirect to the default language
    if (!langCode || !routerConfig.supportedLangs.includes(langCode)) {
      window.location.href = `/${routerConfig.defaultLang}/${uri || currentPath.replace(/^\//, "")}`;
      throw new Error("Language not supported");
    }

    // If the document language is not the current language, change the language
    if (documentLang !== langCode) {
      document.documentElement.lang = langCode;
    }

    const route = findRoute(uri, langCode);

    // If no route found, redirect to the 404 page
    if (!route && !currentPath.endsWith(`/${langCode}/404`)) {
      window.location.href = `/${langCode}/404`;
      throw new Error("No route found");
    }

    const [_, { view, auth, props, params }] = route;
    const viewPath = `./views/${view}.jsx`;

    // If no view found, redirect to the 404 page
    if (!routerConfig.views[viewPath]) {
      if (!currentPath.endsWith(`/${langCode}/404`)) {
        window.location.href = `/${langCode}/404`;
        throw new Error("No view found");
      }
      throw new Error("No 404 view found", {
        cause: "Be sure to create an \"errors/404.jsx\" file in your views folder."
      });
    }

    const viewModule = await routerConfig.views[viewPath]();

    return { viewModule, props, params };
  } catch (e) {
    if (e instanceof Error && e.cause) {
      showRouterError(e.message, e.cause as string);
    }
    return nullView;
  }
}

/**
 * Recursively finds a route by matching the URI to translations in the route map
 * @param uri - The URI path to match against route translations
 * @param lang - The language code to use for matching (e.g., "en" or "fr")
 * @param routesList - Optional route map to search through. Defaults to global routes if not provided
 * @param parentPath - Optional dot-notation path of parent routes. Used internally for recursion
 * @returns A tuple containing [fullRoutePath, routeObject] if found, undefined otherwise
 */
export const findRoute = (
  uri: string,
  lang: string,
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
    if (routePath.includes("{")) {
      // Extract parameter names from the route path
      const paramNames = [...routePath.matchAll(/{([^}]+)}/g)].map(
        (match) => match[1]
      );
      const pathPattern = routePath.replace(/{[^}]+}/g, "([^/]+)");
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
          new RegExp(`^${routePath.replace(/{[^}]+}/g, "[^/]+")}/`).test(uri))
      ) {
        const nextParentPath = parentPath ? `${parentPath}.${key}` : key;

        // Extract params from current level if it's a dynamic route
        if (routePath.includes("{")) {
          const paramNames = [...routePath.matchAll(/{([^}]+)}/g)].map(
            (match) => match[1]
          );
          const pathPattern = routePath.replace(/{[^}]+}/g, "([^/]+)");
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
 * @param uri - The current URI path
 * @param fromLang - The language code of the current URI
 * @param toLang - The target language code to translate the URI to
 * @returns The translated URI path in the new language, or the original URI if no translation is found
 */
export const findLocaleRoute = (
  uri: string,
  fromLang: string,
  toLang: string,
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
 * Get the route object for the target language
 * @param toLang - The target language code to use for the route (e.g., "en" or "fr")
 * @returns An object containing the route functions for the target language
 */
export const getRoute = (
  toLang: string = routerConfig.defaultLang
): RouteHelpersType => {
  return {
    r: (uri: string, params?: Record<string, string>) =>
      findLocaleRoute(uri, "en", toLang, params),
  };
};

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
