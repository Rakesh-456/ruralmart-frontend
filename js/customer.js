// ==========================================================================
// RuralMart - Shop / Browse Products
//
// Browsing (no search/category active) uses the backend's real pagination:
// GET /api/products/page?page=&size= — numbered pagination UI below is
// driven entirely by this response (totalPages / totalElements), not
// client-side slicing.
//
// Search and category-filter use their own (unpaginated) endpoints, since
// that's what the backend provides for them - pagination UI is hidden for
// those views since there's nothing paginated to page through.
//
// Sorting is client-side on whatever set is currently loaded - the backend
// has no `sort` parameter on any product endpoint, so this is the honest
// limit of what's possible without a backend change.
// ==========================================================================

let currentPage = 0;
let pageSize = 12;
let totalPages = 1;
let totalElements = 0;
let currentSort = "";
let activeCategory = null;

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth()) return;

  renderNav("home", true);
  renderCategoryPills();

  const heroInput = document.getElementById("heroSearchInput");
  const heroBtn = document.getElementById("heroSearchBtn");
  if (heroBtn) heroBtn.addEventListener("click", () => runSearch(heroInput.value.trim()));
  if (heroInput) {
    heroInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") runSearch(heroInput.value.trim());
    });
  }

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    currentSort = e.target.value;
    renderCurrentPage();
  });

  const params = new URLSearchParams(window.location.search);
  const initialSearch = params.get("search");
  const initialCategory = params.get("category");

  if (initialSearch) {
    if (heroInput) heroInput.value = initialSearch;
    runSearch(initialSearch);
  } else if (initialCategory) {
    activateCategoryPill(initialCategory);
    loadCategory(initialCategory);
  } else {
    loadBrowsePage(0);
  }

  document.getElementById("modalClose").addEventListener("click", closeProductModal);
  document.getElementById("productModalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "productModalBackdrop") closeProductModal();
  });
});

function renderCategoryPills() {
  const row = document.getElementById("categoryRow");
  row.innerHTML = CATEGORIES.map(
    (c) => `<button type="button" class="category-pill" data-cat="${c.value}"><span class="dot"></span>${c.label}</button>`
  ).join("");

  row.querySelectorAll(".category-pill").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      if (activeCategory === cat) {
        activeCategory = null;
        row.querySelectorAll(".category-pill").forEach((b) => b.classList.remove("active"));
        loadBrowsePage(0);
      } else {
        activeCategory = cat;
        row.querySelectorAll(".category-pill").forEach((b) => b.classList.toggle("active", b === btn));
        loadCategory(cat);
      }
    });
  });
}

function activateCategoryPill(cat) {
  activeCategory = cat;
  // Pills render slightly after this runs on first load, so wait a tick.
  setTimeout(() => {
    document.querySelectorAll(".category-pill").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  }, 0);
}

function runSearch(keyword) {
  activeCategory = null;
  document.querySelectorAll(".category-pill").forEach((b) => b.classList.remove("active"));
  if (!keyword) {
    loadBrowsePage(0);
    return;
  }
  loadSearch(keyword);
}

// ==========================================================================
// Data loading
// ==========================================================================

async function loadBrowsePage(page) {
  currentPage = page;
  setPaginationVisible(true);

  const container = document.getElementById("productContainer");
  container.innerHTML = skeletonGrid();

  try {
    const data = await apiGet(`/api/products/page?page=${page}&size=${pageSize}`);
    window.__pageProducts = data.content || [];
    totalPages = data.totalPages || 1;
    totalElements = data.totalElements != null ? data.totalElements : window.__pageProducts.length;
    renderPaginationControls();
    renderCurrentPage();
  } catch (error) {
    renderError(error.message);
  }
}

async function loadSearch(keyword) {
  setPaginationVisible(false);

  const container = document.getElementById("productContainer");
  container.innerHTML = skeletonGrid();

  try {
    const products = await apiGet(`/api/products/search?keyword=${encodeURIComponent(keyword)}`);
    window.__pageProducts = products;
    renderCurrentPage();
  } catch (error) {
    renderError(error.message);
  }
}

async function loadCategory(category) {
  setPaginationVisible(false);

  const container = document.getElementById("productContainer");
  container.innerHTML = skeletonGrid();

  try {
    const products = await apiGet(`/api/products/category/${category}`);
    window.__pageProducts = products;
    renderCurrentPage();
  } catch (error) {
    renderError(error.message);
  }
}

function changePage(page) {
  if (page < 0 || page >= totalPages || page === currentPage) return;
  loadBrowsePage(page).then(() => {
    document.getElementById("productSection").scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function setPaginationVisible(visible) {
  document.getElementById("paginationBar").style.display = visible ? "block" : "none";
}

// ==========================================================================
// Numbered pagination UI
// Shows: Previous [1] [2] [3] ... [n] Next, with an ellipsis when there
// are more pages than fit, and a "Showing X-Y of Z products" summary.
// ==========================================================================

function renderPaginationControls() {
  const bar = document.getElementById("paginationBar");

  const start = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalElements);

  const pageNumbers = buildPageNumberList(currentPage, totalPages);

  const buttonsHtml = pageNumbers
    .map((p) =>
      p === "..."
        ? `<span class="page-btn ellipsis">…</span>`
        : `<button type="button" class="page-btn${p === currentPage ? " active" : ""}" onclick="changePage(${p})">${p + 1}</button>`
    )
    .join("");

  bar.innerHTML = `
    <div class="pagination-numbered">
      <button type="button" class="page-btn" ${currentPage <= 0 ? "disabled" : ""} onclick="changePage(${currentPage - 1})">‹ Previous</button>
      ${buttonsHtml}
      <button type="button" class="page-btn" ${currentPage >= totalPages - 1 ? "disabled" : ""} onclick="changePage(${currentPage + 1})">Next ›</button>
    </div>
    <div class="pagination-summary">Showing ${start}–${end} of ${totalElements} products</div>
  `;
}

// Returns an array like [0,1,2,"...",9] (0-indexed page numbers, plus "..."
// placeholders) - always shows first, last, and a window around current.
function buildPageNumberList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i);
  }

  const pages = new Set([0, total - 1, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);

  const result = [];
  let prev = null;
  for (const p of sorted) {
    if (prev !== null && p - prev > 1) result.push("...");
    result.push(p);
    prev = p;
  }
  return result;
}

// ==========================================================================
// Sorting (client-side, applied to the currently loaded set)
// ==========================================================================

function sortProducts(products) {
  const list = [...products];
  if (currentSort === "name-asc") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (currentSort === "price-asc") list.sort((a, b) => a.price - b.price);
  else if (currentSort === "price-desc") list.sort((a, b) => b.price - a.price);
  return list;
}

function renderCurrentPage() {
  renderProductCards(sortProducts(window.__pageProducts || []));
}

// ==========================================================================
// Rendering
// ==========================================================================

function skeletonGrid() {
  return `<div class="product-grid">${Array(8)
    .fill('<div class="skeleton" style="height:280px;border-radius:18px;"></div>')
    .join("")}</div>`;
}

function renderError(message) {
  document.getElementById("productContainer").innerHTML = `
    <div class="empty-state">
      <div class="icon">⚠️</div>
      <h3>Couldn't load products</h3>
      <p>${escapeHtml(message)}</p>
      <button class="btn btn-outline" onclick="loadBrowsePage(0)">Try again</button>
    </div>`;
}

function stockFlag(product) {
  if (product.status === "OUT_OF_STOCK" || product.stock === 0) return { cls: "out", label: "Out of stock" };
  if (product.stock <= 5) return { cls: "low", label: "Low stock" };
  return { cls: "", label: "In stock" };
}

function renderProductCards(products) {
  const container = document.getElementById("productContainer");

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try a different search term or category.</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="product-grid">${products.map(productCardHtml).join("")}</div>`;

  window.__productCache = {};
  products.forEach((p) => (window.__productCache[p.id] = p));
}

function productCardHtml(product) {
  const flag = stockFlag(product);
  const disabled = flag.cls === "out";
  return `
    <div class="product-card">
      <div class="product-media">
        <span class="product-stock-flag ${flag.cls}">${flag.label}</span>
        <img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}"
             onerror="this.src='https://placehold.co/400x340/f0f5ee/6b756c?text=RuralMart'">
      </div>
      <div class="product-body">
        <div class="product-category">${product.category.replace("_", " ")}</div>
        <h3 class="product-name">${escapeHtml(product.name)}</h3>
        <div class="product-brand-unit">${escapeHtml(product.brand)} · ${escapeHtml(product.unit)}</div>
        <div class="product-price-row">
          <span class="product-price">₹${product.price}</span>
          <span class="text-muted" style="font-size:.78rem;">${product.stock} left</span>
        </div>
        <div class="product-actions">
          <button class="btn btn-outline btn-sm" onclick="openProductModal(${product.id})">View</button>
          <button class="btn btn-primary btn-sm" ${disabled ? "disabled" : ""} title="Cart is coming soon" onclick="addToCart(${product.id})">Add to Cart</button>
        </div>
      </div>
    </div>`;
}

function addToCart() {
  // Cart functionality requires a backend API that does not currently exist
  // (POST /api/cart/items, GET /api/cart, etc). Keeping this as a clear
  // "coming soon" notice instead of faking a working cart.
  if (typeof showToast === "function") {
    showToast("Cart is coming soon — this needs a Cart API that doesn't exist yet.", "info");
  } else {
    alert("Cart is coming soon — this needs a Cart API on the backend that doesn't exist yet.");
  }
}

function openProductModal(id) {
  const product = window.__productCache ? window.__productCache[id] : null;
  if (!product) return;

  const flag = stockFlag(product);
  document.getElementById("modalBody").innerHTML = `
    <img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}"
         style="width:100%;aspect-ratio:1/0.7;object-fit:cover;border-radius:12px;margin-bottom:16px;"
         onerror="this.src='https://placehold.co/500x350/f0f5ee/6b756c?text=RuralMart'">
    <span class="badge ${flag.cls === 'out' ? 'badge-out' : 'badge-active'}">${flag.label}</span>
    <h2 style="margin-top:10px;">${escapeHtml(product.name)}</h2>
    <p>${escapeHtml(product.description)}</p>
    <div class="flex justify-between" style="margin:14px 0;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);">
      <div><div class="form-hint">Category</div><strong>${product.category.replace("_", " ")}</strong></div>
      <div><div class="form-hint">Brand</div><strong>${escapeHtml(product.brand)}</strong></div>
      <div><div class="form-hint">Unit</div><strong>${escapeHtml(product.unit)}</strong></div>
      <div><div class="form-hint">Stock</div><strong>${product.stock}</strong></div>
    </div>
    <div class="flex justify-between items-center">
      <span class="product-price" style="font-size:1.5rem;">₹${product.price}</span>
      <button class="btn btn-primary" title="Cart is coming soon" onclick="addToCart()">Add to Cart</button>
    </div>
    <p class="form-hint" style="margin-top:10px;">Sold by ${escapeHtml(product.shop ? product.shop.shopName : "RuralMart")}</p>
  `;
  document.getElementById("productModalBackdrop").classList.add("open");
}

function closeProductModal() {
  document.getElementById("productModalBackdrop").classList.remove("open");
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}