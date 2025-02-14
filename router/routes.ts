import type { RouteType, RouteModulesType } from "./types";
import { routerConfig, REGEX } from "./config";
import { getLangAndUri } from "./utils";

/**
 * Get all routes
 * @param modules Route modules from Vite's glob import
 * @returns Object with all routes
 * @since 0.1.1
 */
export const getRoutes = (
  modules?: RouteModulesType | undefined
): Record<string, RouteType> => {
  if (modules || routerConfig.routeModules) {
    return (() => {
      return Object.values(modules || routerConfig.routeModules || {}).reduce<
        Record<string, RouteType>
      >((acc, module) => {
        const firstRoute = Object.values(module)[0] as unknown as Record<
          string,
          RouteType
        >;
        return { ...acc, ...firstRoute };
      }, {});
    })();
  }
  return routerConfig.routes;
};

/**
 * Recursively finds a route by matching the URI to translations in the route map
 * @param uri The URI path to match against route translations
 * @param lang The language code to use for matching (e.g., "en" or "fr")
 * @param routesList Optional route map to search through. Defaults to global routes if not provided
 * @param parentPath Optional dot-notation path of parent routes. Used internally for recursion
 * @returns A tuple containing [fullRoutePath, routeObject] if found, undefined otherwise
 * @since 0.1.0
 */
export const getRoute = (
  uri: string,
  lang: string = routerConfig.currentLang || routerConfig.defaultLang,
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
          new RegExp(
            `^${routePath.replace(REGEX.PARAM_REPLACE, "[^/]+")}/`
          ).test(uri))
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

        const childRoute = getRoute(
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
    uri,
    {
      view: "errors/404",
      paths: {},
      auth: false,
      props: {},
      params: {},
    },
  ];
};

/**
 * Find the localized route path from a specific language view name
 * @param uri The target view name
 * @param toLang The target language
 * @param fromLang The specific language to translate view name from
 * @param additionalParams Optional additional parameters to pass to the new route
 * @returns The localized route path in the target language, or the original view name if no translation is found
 * @since 0.1.0
 */
export const getLocalizedRoute = (
  uri: string,
  toLang: string = routerConfig.currentLang || routerConfig.defaultLang,
  fromLang: string = "en",
  additionalParams?: Record<string, string>
): string => {
  // Find the current route based on the URI and current language
  const currentRoute = getRoute(uri, fromLang);
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
