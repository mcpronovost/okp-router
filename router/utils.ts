/**
 * Show a router error
 * @param title The title of the error
 * @param message The message of the error
 * @since 0.2.0
 */
export const showRouterError = (
  title: string = "An error occurred",
  message?: string
) => {
  console.error(title);
  window.document.body.innerHTML =
    '<div style="' +
    "background-color: #522; border-radius: 12px;" +
    "color: #D44; font-family: monospace; text-align: center;" +
    "max-width: 400px;" +
    "padding: 20px; margin: 32px auto;" +
    '">' +
    "<h1>" +
    title +
    "</h1>" +
    (message ? "<p>" + message + "</p>" : "") +
    "</div>";
};
