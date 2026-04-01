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

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
    throw new Error(
      "Server returned HTML instead of JSON. Check whether the backend server is running on port 8120.",
    );
  }

  throw new Error(trimmed || fallbackMessage);
};
