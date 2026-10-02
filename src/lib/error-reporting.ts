export function reportApplicationError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  console.error("Application error", {
    message,
    route: typeof window === "undefined" ? undefined : window.location.pathname,
    ...context,
  });
}
