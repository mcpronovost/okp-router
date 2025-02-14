import type { RouteHelpersType } from "./types";
import { routerConfig } from "./config";
import { getLocalizedRoute } from "./routes";

/**
 * Alias for getLocalizedRoute
 * @since 0.2.6
 */
export const r = getLocalizedRoute;

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
  };
};
