import type { RouteHelpersType } from "./types";
import { routerConfig } from "./config";
import { getLocalizedRoute, switchRouteLanguage } from "./routes";

/**
 * Alias for getLocalizedRoute
 * @since 0.2.6
 */
export const r = getLocalizedRoute;

/**
 * Alias for switchRouteLanguage
 * @since 0.4.1
 */
export const switchLang = switchRouteLanguage;

/**
 * Get the router
 * @param toLang The target language code to use for the router
 * @param fromLang The language code to use as the base language for the router
 * @returns An object containing the router functions
 * @since 0.1.0
 */
export const getRouter = (
  toLang: string = routerConfig.currentLang || routerConfig.defaultLang || "en",
  fromLang: string = "en"
): RouteHelpersType => {
  return {
    r: (uri: string, params?: Record<string, string>) =>
      r(uri, toLang, fromLang, params),
    switchLang: (
      toLang: string = routerConfig.currentLang ||
        routerConfig.defaultLang ||
        "en",
      additionalParams?: Record<string, string>
    ) => switchLang(toLang, additionalParams),
  };
};
