// ==========================================================================
// RuralMart - API Client
//
// IMPORTANT: the backend's CorsConfig only allows requests from
// http://localhost:5500 and http://127.0.0.1:5500. Serve this frontend
// from that origin (e.g. VS Code "Live Server" on port 5500) or every
// request below will be blocked by the browser.
// ==========================================================================

const API_BASE_URL = "http://localhost:8080";

// Mirrors backend enums (Category, ProductStatus) - keep in sync if the
// backend enum values change.
const CATEGORIES = [
  { value: "GROCERY", label: "Grocery" },
  { value: "DAIRY", label: "Dairy" },
  { value: "VEGETABLES", label: "Vegetables" },
  { value: "FRUITS", label: "Fruits" },
  { value: "SNACKS", label: "Snacks" },
  { value: "BEVERAGES", label: "Beverages" },
  { value: "PERSONAL_CARE", label: "Personal Care" },
  { value: "HOUSEHOLD", label: "Household" },
];

const PRODUCT_STATUSES = ["ACTIVE", "OUT_OF_STOCK", "INACTIVE", "DISCONTINUED"];

// ======================================
// Token storage
// ======================================

function saveToken(token) {
  localStorage.setItem("token", token);
}

function getToken() {
  return localStorage.getItem("token");
}

function removeToken() {
  localStorage.removeItem("token");
}

// ======================================
// Logged-in user storage
// (populated from GET /api/users/profile right after login)
// ======================================

function saveUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

function getUser() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function removeUser() {
  localStorage.removeItem("user");
}

function isLoggedIn() {
  return !!getToken();
}

function getRole() {
  const user = getUser();
  return user ? user.role : null;
}

function homePathForRole(role) {
  if (role === "ADMIN") return "admin/admin-dashboard.html";
  return "customer/customer-home.html";
}

// Resolves a path relative to the html/ folder (e.g. "admin/shop.html",
// "login.html") into a correct relative link from the CURRENT page,
// since this frontend has no server-side routing.
function resolvePath(path) {
  const marker = "/html/";
  const idx = window.location.pathname.indexOf(marker);
  const afterHtml = idx >= 0 ? window.location.pathname.substring(idx + marker.length) : window.location.pathname;
  const parts = afterHtml.split("/").filter(Boolean);
  const depth = Math.max(parts.length - 1, 0); // subfolders beneath html/
  const prefix = "../".repeat(depth);
  return prefix + path.replace(/^\//, "");
}

function goTo(path) {
  window.location.href = resolvePath(path);
}

// Call at the top of any page that requires login.
// If requiredRole is passed and doesn't match, sends the user to their
// own home instead of the page they tried to load.
function requireAuth(requiredRole) {
  if (!isLoggedIn()) {
    goTo("login.html");
    return false;
  }
  if (requiredRole) {
    const role = getRole();
    if (role && role !== requiredRole) {
      goTo(homePathForRole(role));
      return false;
    }
  }
  return true;
}

// ======================================
// Headers
// ======================================

function getHeaders(includeAuth = true) {
  const headers = { "Content-Type": "application/json" };
  if (includeAuth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ======================================
// Friendly error messages
// The backend doesn't always return a JSON "message" field (some errors
// fall through to Spring's default handler), so we fill in sensible
// fallbacks based on status code.
// ======================================

function friendlyError(status, data) {
  if (data && data.message) return data.message;
  if (data && data.error && data.error !== "Internal Server Error") return data.error;

  if (status === 401 || status === 403) return "You're not authorized to do that. Please log in again.";
  if (status === 404) return "We couldn't find what you're looking for.";
  if (status === 400) return "Please check the form and try again.";
  if (status === 500) return "Something went wrong on our end. Please try again.";
  return `Request failed (HTTP ${status})`;
}

// ======================================
// Generic API request
// ======================================

async function apiRequest(endpoint, method = "GET", body = null, includeAuth = true) {
  const options = {
    method,
    headers: getHeaders(includeAuth),
  };

  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  } catch (networkError) {
    throw new Error(
      "Can't reach the server. Is the backend running, and is this page served from http://localhost:5500?"
    );
  }

  const contentType = response.headers.get("content-type") || "";
  let data = {};

  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }
  } else {
    // Some endpoints (delete product, change password) return plain text.
    try {
      data = { message: await response.text() };
    } catch (e) {
      data = {};
    }
  }

  if (response.status === 401 || response.status === 403) {
    // Token missing/expired/invalid - force re-login.
    removeToken();
    removeUser();
  }

  if (!response.ok) {
    // 400s from @Valid DTOs come back as a flat {field: message} map
    // rather than {message: "..."}. Detect and surface that shape so
    // forms can highlight the exact fields.
    const looksLikeFieldMap =
      response.status === 400 &&
      data &&
      typeof data === "object" &&
      !data.message &&
      !data.error &&
      Object.keys(data).length > 0;

    const err = new Error(friendlyError(response.status, data));
    if (looksLikeFieldMap) err.fieldErrors = data;
    throw err;
  }

  return data;
}

// ======================================
// Convenience methods
// ======================================

function apiGet(endpoint) {
  return apiRequest(endpoint, "GET");
}

function apiPost(endpoint, body, includeAuth = true) {
  return apiRequest(endpoint, "POST", body, includeAuth);
}

function apiPut(endpoint, body) {
  return apiRequest(endpoint, "PUT", body);
}

function apiDelete(endpoint) {
  return apiRequest(endpoint, "DELETE");
}

// ======================================
// Non-throwing variant, for forms that need to show per-field
// validation errors (the backend returns a {field: message} map
// on 400 responses from @Valid DTOs, not a single "message" string).
// ======================================

async function apiRequestSafe(endpoint, method = "GET", body = null, includeAuth = true) {
  try {
    const data = await apiRequest(endpoint, method, body, includeAuth);
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error, data: error.fieldErrors || null };
  }
}

// Applies a {field: message} validation map to matching input elements
// (expects an element with id === field, and a sibling <div class="field-error-text" data-for="field">).
function applyFieldErrors(errors) {
  Object.keys(errors).forEach((field) => {
    const input = document.getElementById(field);
    const errorEl = document.querySelector(`[data-for="${field}"]`);
    if (input) input.classList.add("field-error");
    if (errorEl) {
      errorEl.textContent = errors[field];
      errorEl.classList.add("show");
    }
  });
}

function clearFieldErrors(formEl) {
  formEl.querySelectorAll(".field-error").forEach((el) => el.classList.remove("field-error"));
  formEl.querySelectorAll(".field-error-text").forEach((el) => {
    el.textContent = "";
    el.classList.remove("show");
  });
}