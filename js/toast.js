// ==========================================================================
// RuralMart - Toast notifications
// Usage: showToast("Product added successfully", "success")
// types: "success" | "error" | "warning" | "info" (default: "info")
// ==========================================================================

const TOAST_ICONS = {
  success: "✓",
  error: "✕",
  warning: "!",
  info: "i",
};

function getToastStack() {
  let stack = document.getElementById("toastStack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toastStack";
    stack.className = "toast-stack";
    stack.setAttribute("aria-live", "polite");
    stack.setAttribute("role", "status");
    document.body.appendChild(stack);
  }
  return stack;
}

function showToast(message, type = "info", durationMs = 3800) {
  const stack = getToastStack();

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
    <span>${escapeToastText(message)}</span>
    <button type="button" class="toast-close" aria-label="Dismiss">✕</button>
  `;

  stack.appendChild(toast);

  const remove = () => {
    toast.classList.add("toast-leaving");
    setTimeout(() => toast.remove(), 180);
  };

  toast.querySelector(".toast-close").addEventListener("click", remove);
  const timer = setTimeout(remove, durationMs);
  toast.addEventListener("mouseenter", () => clearTimeout(timer));
}

function escapeToastText(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ==========================================================================
// Queued toast - for messages that should appear AFTER a redirect
// (e.g. "Product added" shown once back on the products list page).
// ==========================================================================

function queueToast(message, type = "info") {
  try {
    sessionStorage.setItem("pendingToast", JSON.stringify({ message, type }));
  } catch (e) {
    // sessionStorage unavailable - fall back to nothing, not worth crashing over.
  }
}

(function flushQueuedToast() {
  try {
    const raw = sessionStorage.getItem("pendingToast");
    if (!raw) return;
    sessionStorage.removeItem("pendingToast");
    const { message, type } = JSON.parse(raw);
    // toast.js loads near the end of <body>, so document.body already exists.
    showToast(message, type);
  } catch (e) {
    // Malformed/missing - nothing to show.
  }
})();