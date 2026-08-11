// ==========================================================================
// RuralMart - Homepage
// Every /api/products/** endpoint requires a JWT on this backend, so a
// logged-out visitor genuinely cannot be shown real product data here.
// Rather than fake it, guests see a login/register prompt in that section.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  renderNav("home");
  renderCategoryTiles();

  const exploreBtn = document.getElementById("exploreCategoriesBtn");
  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document.getElementById("categorySection").scrollIntoView({ behavior: "smooth" });
    });
  }

  const shopNowBtn = document.getElementById("shopNowBtn");
  if (shopNowBtn) {
    shopNowBtn.addEventListener("click", () => {
      if (isLoggedIn() && getRole() === "CUSTOMER") {
        goTo("customer/customer-home.html");
      } else if (isLoggedIn()) {
        goTo(homePathForRole(getRole()));
      } else {
        goTo("register.html");
      }
    });
  }

  if (isLoggedIn() && getRole() === "CUSTOMER") {
    loadFeaturedProducts();
  } else {
    renderGuestProductPrompt();
  }
});

function renderCategoryTiles() {
  const row = document.getElementById("categoryShowcase");
  if (!row) return;

  row.innerHTML = CATEGORIES.map(
    (c) => `
    <div class="category-tile" data-cat="${c.value}">
      <div class="icon-wrap">${categoryIcon(c.value)}</div>
      <div class="label">${c.label}</div>
    </div>`
  ).join("");

  row.querySelectorAll(".category-tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const cat = tile.dataset.cat;
      if (isLoggedIn() && getRole() === "CUSTOMER") {
        goTo(`customer/customer-home.html?category=${cat}`);
      } else {
        goTo("login.html");
      }
    });
  });
}

function categoryIcon(value) {
  const icons = {
    GROCERY: "🛒",
    DAIRY: "🥛",
    VEGETABLES: "🥦",
    FRUITS: "🍎",
    SNACKS: "🍪",
    BEVERAGES: "🧃",
    PERSONAL_CARE: "🧴",
    HOUSEHOLD: "🧹",
  };
  return icons[value] || "🌾";
}

async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  container.innerHTML = skeletonGrid(4);

  try {
    const data = await apiGet("/api/products/page?page=0&size=8");
    const products = data.content || [];

    if (products.length === 0) {
      container.innerHTML = `<div class="empty-state"><div class="icon">🌾</div><h3>No products yet</h3><p>Check back soon as local shops add their stock.</p></div>`;
      return;
    }

    container.innerHTML = `<div class="product-grid">${products.map(homeProductCard).join("")}</div>`;
  } catch (error) {
    container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Couldn't load products</h3><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function homeProductCard(product) {
  const outOfStock = product.status === "OUT_OF_STOCK" || product.stock === 0;
  return `
    <div class="product-card">
      <div class="product-media">
        <span class="product-stock-flag ${outOfStock ? "out" : ""}">${outOfStock ? "Out of stock" : "In stock"}</span>
        <img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}"
             onerror="this.src='https://placehold.co/400x340/f0f5ee/6b756c?text=RuralMart'">
      </div>
      <div class="product-body">
        <div class="product-category">${product.category.replace("_", " ")}</div>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="product-brand-unit">${escapeHtml(product.brand)} · ${escapeHtml(product.unit)}</div>
        <div class="product-price-row">
          <span class="product-price">₹${product.price}</span>
        </div>
        <div class="product-actions">
          <a class="btn btn-primary btn-sm w-full" href="customer/customer-home.html">View Product</a>
        </div>
      </div>
    </div>`;
}

function renderGuestProductPrompt() {
  const container = document.getElementById("featuredProducts");
  container.innerHTML = `
    <div class="guest-prompt">
      <div class="icon">🔒</div>
      <h3>Log in to see what's in stock</h3>
      <p>Product listings are shown to registered shoppers so we can connect you with the right local shop.</p>
      <div class="actions">
        <a class="btn btn-primary" href="login.html">Log in</a>
        <a class="btn btn-outline" href="register.html">Create an account</a>
      </div>
    </div>`;
}

function skeletonGrid(n) {
  return `<div class="product-grid">${Array(n).fill('<div class="skeleton" style="height:280px;border-radius:18px;"></div>').join("")}</div>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}