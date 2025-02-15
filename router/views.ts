import type { ViewModulesType } from "./types";
import { routerConfig, REGEX } from "./config";
import { getRoute } from "./routes";
import { getLangAndUri, showRouterError } from "./utils";

/**
 * Get all views
 * @returns Object with all views
 * @since 0.2.0
 */
export const getViews = (): ViewModulesType | null => {
  if (!routerConfig.views || !Object.keys(routerConfig.views).length) {
    showRouterError(
      "No views found",
      "Please check router config or your views folder " +
        "and make sure it contains the correct files."
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
    params: null,
  };

  if (!routerConfig.supportedLangs) {
    showRouterError("No supported languages found", "Please check your router config.");
    return DEFAULT_NULL_VIEW;
  }

  if (!routerConfig.views) {
    showRouterError("No views found", "Please check your router config.");
    return DEFAULT_NULL_VIEW;
  }

  if (!routerConfig.viewsExtensions) {
    showRouterError("No views extensions found", "Please check your router config.");
    return DEFAULT_NULL_VIEW;
  }

  if (!routerConfig.viewsCache) {
    routerConfig.viewsCache = new Map();
  }

  const documentElement = document.documentElement;
  const documentLang = documentElement.lang;
  const currentPath = window.location.pathname;
  const { langCode, uri } = getLangAndUri(currentPath);

  try {
    // If the language is not supported, redirect to the default language
    if (!langCode || !routerConfig.supportedLangs.includes(langCode)) {
      window.location.href = `/${routerConfig.defaultLang}/${
        uri || currentPath.replace(/^\//, "")
      }`;
      throw new Error("Language not supported");
    }

    // If the document language is not the current language, change the language
    if (documentLang !== langCode) {
      documentElement.lang = langCode;
    }

    // If the current language is not the language code, change the current language
    if (langCode !== routerConfig.currentLang) {
      routerConfig.currentLang = langCode;
    }

    const route = getRoute(uri, langCode);

    // If no route found, redirect to the 404 page
    if (!route && !currentPath.endsWith(`/${langCode}/404`)) {
      window.location.href = `/${langCode}/404`;
      throw new Error("No route found");
    }

    const [_, { view, auth, props, params }] = route;

    // Get the view path with the correct extension
    let viewPath = "";
    for (const ext of routerConfig.viewsExtensions) {
      const potentialPath = `${routerConfig.viewsPath}/${view}.${ext}`;
      if (routerConfig.views[potentialPath]) {
        viewPath = potentialPath;
        break;
      }
    }

    // Check cache first
    if (routerConfig.viewsCache.has(viewPath)) {
      const viewModule = routerConfig.viewsCache.get(viewPath) as {
        default: any;
      };
      return {
        viewModule,
        auth: auth || false,
        props: props || null,
        params: params || null,
      };
    }

    // If no view found, redirect to the 404 page
    if (!routerConfig.views[viewPath]) {
      if (!currentPath.endsWith(`/${langCode}/404`)) {
        // window.location.href = `/${langCode}/404`;
        throw new Error("No view found");
      }
      throw new Error("No 404 view found", {
        cause: `Be sure to create an \"errors/404\" file in your views folder.`,
      });
    }

    const viewModule = await routerConfig.views[viewPath]();

    // Cache the view module
    routerConfig.viewsCache.set(viewPath, viewModule);

    return {
      viewModule,
      auth: auth || false,
      props: props || null,
      params: params || null,
    };
  } catch (e) {
    if (e instanceof Error && e.cause) {
      showRouterError(e.message, e.cause as string);
    } else {
      showRouterError("An error occurred", e as string);
    }
    return DEFAULT_NULL_VIEW;
  }
};
