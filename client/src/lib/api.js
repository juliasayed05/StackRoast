const API_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const TOKEN_KEY = "stackroast_token";

async function request(path, options = {}) {
  const token = window.localStorage.getItem(TOKEN_KEY);

  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  // Detect FormData for image uploads
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  // Set JSON Content-Type only for normal JSON requests
  if (options.body !== undefined && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body:
        options.body === undefined
          ? undefined
          : isFormData
            ? options.body
            : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(
      "Unable to reach the StackRoast API. Check that the server is running.",
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      payload.message ||
        payload.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return payload;
}

export const api = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: "POST",
      body,
    }),

  put: (path, body) =>
    request(path, {
      method: "PUT",
      body,
    }),

  patch: (path, body = {}) =>
    request(path, {
      method: "PATCH",
      body,
    }),

  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),
};

export const TOKEN_KEY_NAME = TOKEN_KEY;
