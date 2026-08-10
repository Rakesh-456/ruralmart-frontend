// ==========================================================================
// RuralMart - Auth (Register / Login)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // If already logged in, skip straight to the right home page.
  if (isLoggedIn() && (document.getElementById("loginForm") || document.getElementById("registerForm"))) {
    goTo(homePathForRole(getRole()));
    return;
  }

  const registerForm = document.getElementById("registerForm");
  if (registerForm) registerForm.addEventListener("submit", registerUser);

  const loginForm = document.getElementById("loginForm");
  if (loginForm) loginForm.addEventListener("submit", loginUser);
});

// ==========================================================================
// Register
// ==========================================================================

async function registerUser(event) {
  event.preventDefault();

  const form = event.target;
  clearFieldErrors(form);
  setAlert("registerAlert", null);

  const request = {
    fullName: document.getElementById("fullName").value.trim(),
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  setButtonLoading("registerSubmit", true, "Creating account...");

  const result = await apiRequestSafe("/api/auth/register", "POST", request, false);

  setButtonLoading("registerSubmit", false, "Create account");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("registerAlert", result.error.message, "error");
    }
    return;
  }

  setAlert("registerAlert", "Account created. Redirecting to login...", "success");
  setTimeout(() => goTo("login.html"), 900);
}

// ==========================================================================
// Login
// ==========================================================================

async function loginUser(event) {
  event.preventDefault();

  const form = event.target;
  clearFieldErrors(form);
  setAlert("loginAlert", null);

  const request = {
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
  };

  setButtonLoading("loginSubmit", true, "Signing in...");

  try {
    // 1. Log in and get the token.
    const loginResponse = await apiPost("/api/auth/login", request, false);
    saveToken(loginResponse.token);

    // 2. Fetch the logged-in user's profile (this is how we know the role,
    //    since /api/auth/login itself doesn't return one).
    const user = await apiGet("/api/users/profile");
    saveUser(user);

    // 3. Redirect based on role.
    goTo(homePathForRole(user.role));
  } catch (error) {
    removeToken();
    removeUser();
    setAlert("loginAlert", error.message, "error");
  } finally {
    setButtonLoading("loginSubmit", false, "Sign in");
  }
}

// ==========================================================================
// Small UI helpers shared by auth pages
// ==========================================================================

function setAlert(id, message, type) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.className = "alert";
    el.textContent = "";
    return;
  }
  el.className = `alert show alert-${type}`;
  el.textContent = message;
}

function setButtonLoading(id, loading, label) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = label;
}