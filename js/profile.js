// ==========================================================================
// RuralMart - Profile
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  renderNav(null);
  loadProfile();

  const profileForm = document.getElementById("profileForm");
  if (profileForm) profileForm.addEventListener("submit", updateProfile);

  const passwordForm = document.getElementById("passwordForm");
  if (passwordForm) passwordForm.addEventListener("submit", changePassword);

  if (window.location.hash === "#password") {
    const target = document.getElementById("passwordCard");
    if (target) target.scrollIntoView({ behavior: "smooth" });
  }
});

async function loadProfile() {
  try {
    const user = await apiGet("/api/users/profile");
    saveUser(user); // keep localStorage in sync in case it changed elsewhere

    document.getElementById("profileAvatarInitials").textContent = initialsOf(user.fullName);
    document.getElementById("profileHeadingName").textContent = user.fullName;
    document.getElementById("profileHeadingRole").textContent = user.role;

    document.getElementById("fullName").value = user.fullName || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phoneNumber").value = user.phoneNumber || "";
  } catch (error) {
    setAlert("profileAlert", error.message, "error");
  }
}

async function updateProfile(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("profileAlert", null);

  const request = {
    fullName: document.getElementById("fullName").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
  };

  setButtonLoading("profileSubmit", true, "Saving...");
  const result = await apiRequestSafe("/api/users/profile", "PUT", request);
  setButtonLoading("profileSubmit", false, "Save changes");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("profileAlert", result.error.message, "error");
    }
    return;
  }

  saveUser(result.data);
  document.getElementById("profileHeadingName").textContent = result.data.fullName;
  document.getElementById("profileAvatarInitials").textContent = initialsOf(result.data.fullName);
  setAlert("profileAlert", "Profile updated.", "success");
}

async function changePassword(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("passwordAlert", null);

  const newPassword = document.getElementById("newPassword").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  if (newPassword !== confirmPassword) {
    setAlert("passwordAlert", "New password and confirmation don't match.", "error");
    return;
  }

  const request = {
    currentPassword: document.getElementById("currentPassword").value,
    newPassword,
    confirmPassword,
  };

  setButtonLoading("passwordSubmit", true, "Updating...");
  const result = await apiRequestSafe("/api/users/change-password", "PUT", request);
  setButtonLoading("passwordSubmit", false, "Update password");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("passwordAlert", result.error.message, "error");
    }
    return;
  }

  setAlert("passwordAlert", "Password changed successfully.", "success");
  form.reset();
}

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