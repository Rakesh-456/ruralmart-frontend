// ==========================================================================
// RuralMart - Shared Navigation
// Renders the header into <div id="site-header"></div> based on the
// logged-in user stored in localStorage (see api.js: saveUser/getUser).
// ==========================================================================

function logout() {
  removeToken();
  removeUser();
  goTo("login.html");
}

function initialsOf(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0] ? parts[0][0] : "";
  const second = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + second).toUpperCase();
}

function navLinksFor(role) {
  if (role === "ADMIN") {
    return [
      { key: "dashboard", label: "Dashboard", href: "admin/admin-dashboard.html" },
      { key: "products", label: "Products", href: "admin/products.html" },
      { key: "shop", label: "My Shop", href: "admin/shop.html" },
    ];
  }
  if (role === "CUSTOMER") {
    return [{ key: "home", label: "Shop", href: "customer/customer-home.html" }];
  }
  // Guest - no protected links, since every /api/products/** call requires
  // a JWT on this backend. Home just points at the public homepage.
  return [{ key: "home", label: "Home", href: "index.html" }];
}

function profileHref(role) {
    return "profile.html";
}

// activeKey highlights the current nav link.
// showSearch shows the quick product search box (customer only).
function renderNav(activeKey, showSearch) {
  const mount = document.getElementById("site-header");
  if (!mount) return;

  const user = getUser();
  const role = user ? user.role : null;
  const links = navLinksFor(role);

  const linksHtml = links
    .map(
      (l) =>
        `<a class="nav-link${l.key === activeKey ? " active" : ""}" href="${resolvePath(l.href)}">${l.label}</a>`
    )
    .join("");

  const searchHtml =
    showSearch && role === "CUSTOMER"
      ? `<div class="nav-search">
           <input type="text" id="navSearchInput" placeholder="Search products...">
         </div>`
      : "";

  const rightHtml = user
    ? `
      <div class="profile-menu">
        <button class="profile-trigger" id="profileTrigger" type="button">
          <span class="profile-avatar">${initialsOf(user.fullName)}</span>
          <span class="profile-text">
            <span class="profile-name">${escapeHtml(user.fullName)}</span>
            <span class="profile-role">${role ? role.toLowerCase() : ""}</span>
          </span>
        </button>
        <div class="profile-dropdown" id="profileDropdown">
          <a href="${resolvePath(profileHref(role))}">My Profile</a>
          <a href="${resolvePath(profileHref(role))}#password">Change Password</a>
          <div class="divider"></div>
          <button type="button" class="danger-item" onclick="logout()">Logout</button>
        </div>
      </div>`
    : `
      <a class="btn btn-ghost btn-sm" href="${resolvePath("login.html")}">Login</a>
      <a class="btn btn-primary btn-sm" href="${resolvePath("register.html")}">Register</a>`;

  mount.innerHTML = `
    <div class="nav-inner">
      <a class="brand" href="${resolvePath(user ? homePathForRole(role) : "index.html")}">
        <span class="brand-mark">🌾</span> RuralMart
      </a>
      <nav class="nav-links">${linksHtml}</nav>
      ${searchHtml}
      <div class="nav-right">${rightHtml}</div>
    </div>
  `;

  const trigger = document.getElementById("profileTrigger");
  const dropdown = document.getElementById("profileDropdown");
  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("open");
    });
    document.addEventListener("click", () => dropdown.classList.remove("open"));
  }

  const searchInput = document.getElementById("navSearchInput");
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && searchInput.value.trim()) {
        goTo(`customer/customer-home.html?search=${encodeURIComponent(searchInput.value.trim())}`);
      }
    });
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}