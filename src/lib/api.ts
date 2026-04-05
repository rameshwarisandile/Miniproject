const configuredBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "");

export const apiUrl = (path: string) => {
  const normalized = path.startsWith("/") ? path : `/${path}`;

  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${normalized}`;
  }

  const isSameBackendOrigin =
    typeof window !== "undefined" &&
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "8120";

  if (isSameBackendOrigin) {
    return normalized;
  }

  return `http://localhost:8120${normalized}`;
};

export const parseJsonResponse = async (response: Response, fallbackMessage: string) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const bodyText = await response.text();
  const trimmed = bodyText.trim();
  const responseTarget = response.url || "unknown-url";
  const statusInfo = `${response.status} ${response.statusText || ""}`.trim();

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      `Server returned HTML instead of JSON from ${responseTarget} (${statusInfo}). Check whether the backend server is running on port 8120 and whether this endpoint exists.`,
    );
  }

  throw new Error(trimmed || fallbackMessage);
};
