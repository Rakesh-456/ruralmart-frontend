// ==========================================================================
// RuralMart - Forgot Password
// ==========================================================================

let resetEmail = "";

document.addEventListener("DOMContentLoaded", () => {
  // Already logged in? No reason to be here.
  if (isLoggedIn()) {
    goTo(homePathForRole(getRole()));
    return;
  }

  const requestForm = document.getElementById("requestOtpForm");
  if (requestForm) requestForm.addEventListener("submit", requestOtp);

  const resetForm = document.getElementById("resetForm");
  if (resetForm) resetForm.addEventListener("submit", resetPassword);

  const resendBtn = document.getElementById("resendOtpBtn");
  if (resendBtn) resendBtn.addEventListener("click", resendOtp);

  const changeEmailBtn = document.getElementById("changeEmailBtn");
  if (changeEmailBtn) changeEmailBtn.addEventListener("click", backToEmailStep);
});

// ==========================================================================
// Step 1: request the reset OTP
// ==========================================================================

async function requestOtp(event) {
  event.preventDefault();

  const form = event.target;
  clearFieldErrors(form);
  setAlert("requestAlert", null);

  const email = document.getElementById("email").value.trim();

  setButtonLoading("requestOtpSubmit", true, "Sending...");
  const result = await apiRequestSafe("/api/auth/forgot-password/send-otp", "POST", { email }, false);
  setButtonLoading("requestOtpSubmit", false, "Send reset code");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("requestAlert", result.error.message, "error");
    }
    return;
  }

  resetEmail = email;
  enterResetStep(email);
}

async function resendOtp() {
  const btn = document.getElementById("resendOtpBtn");
  btn.disabled = true;
  btn.textContent = "Sending...";

  const result = await apiRequestSafe("/api/auth/forgot-password/send-otp", "POST", { email: resetEmail }, false);

  btn.disabled = false;
  btn.textContent = "Resend";

  if (!result.ok) {
    setAlert("resetAlert", result.error ? result.error.message : "Couldn't resend the code.", "error");
    return;
  }

  setAlert("resetAlert", "A new code has been sent. The previous one no longer works.", "success");
}

function enterResetStep(email) {
  document.getElementById("emailStep").style.display = "none";
  document.getElementById("resetStep").style.display = "block";
  document.getElementById("otpEmailDisplay").textContent = email;
  document.getElementById("stepSubtitle").textContent = "Enter the code and choose a new password.";
  document.getElementById("otp").focus();
}

function backToEmailStep() {
  document.getElementById("resetStep").style.display = "none";
  document.getElementById("emailStep").style.display = "block";
  document.getElementById("stepSubtitle").textContent = "Enter your registered email to get a reset code.";
  setAlert("resetAlert", null);
  document.getElementById("resetForm").reset();
}

// ==========================================================================
// Step 2: verify OTP + set new password
// ==========================================================================

async function resetPassword(event) {
  event.preventDefault();

  const form = event.target;
  clearFieldErrors(form);
  setAlert("resetAlert", null);

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    setAlert("resetAlert", "New password and confirmation don't match.", "error");
    return;
  }

  const request = {
    email: resetEmail,
    otp: document.getElementById("otp").value.trim(),
    newPassword,
    confirmPassword,
  };

  setButtonLoading("resetSubmit", true, "Resetting...");
  const result = await apiRequestSafe("/api/auth/forgot-password/reset", "POST", request, false);
  setButtonLoading("resetSubmit", false, "Reset password");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      // OTP errors (not found / expired / invalid) come back as a plain
      // message, not a field map, so they land here.
      setAlert("resetAlert", result.error.message, "error");
    }
    return;
  }

  setAlert("resetAlert", "Password reset. Redirecting to login...", "success");
  // Deliberately no token is saved here - no JWT is issued by this flow.
  // The user logs in normally afterwards through the existing login page.
  setTimeout(() => goTo("login.html"), 900);
}

// ==========================================================================
// Small UI helpers
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