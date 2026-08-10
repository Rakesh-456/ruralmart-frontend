// ==========================================================================
// RuralMart - Customer Home
//
// Browsing (no search/category active) uses the backend's real pagination:
// GET /api/products/page?page=&size=
//
// Search and category-filter use their own (unpaginated) endpoints, since
// that's what the backend provides for them.
//
// Sorting is done client-side on whatever page of results is currently
// loaded — the backend does not implement a sort parameter yet
// (GET /api/products/page has no `sort`), so this is the honest limit
// of what's possible without a backend change.
// ==========================================================================

let currentMode = "browse"; // "browse" | "search" | "category"
let currentQuery = "";      // keyword or category value, depending on mode
let currentPage = 0;
let pageSize = 12;
let totalPages = 1;
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
  document.getElementById("prevPageBtn").addEventListener("click", () => changePage(currentPage - 1));
  document.getElementById("nextPageBtn").addEventListener("click", () => changePage(currentPage + 1));

  const params = new URLSearchParams(window.location.search);
  const initialSearch = params.get("search");
  if (initialSearch) {
    if (heroInput) heroInput.value = initialSearch;
    runSearch(initialSearch);
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
  currentMode = "browse";
  currentPage = page;
  setPaginationVisible(true);

  const container = document.getElementById("productContainer");
  container.innerHTML = skeletonGrid();

  try {
    const data = await apiGet(`/api/products/page?page=${page}&size=${pageSize}`);
    window.__pageProducts = data.content || [];
    totalPages = data.totalPages || 1;
    updatePaginationUI();
    renderCurrentPage();
  } catch (error) {
    renderError(error.message);
  }
}

async function loadSearch(keyword) {
  currentMode = "search";
  currentQuery = keyword;
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
  currentMode = "category";
  currentQuery = category;
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
  if (page < 0 || page >= totalPages) return;
  loadBrowsePage(page);
}

function setPaginationVisible(visible) {
  document.getElementById("paginationBar").style.display = visible ? "flex" : "none";
}

function updatePaginationUI() {
  document.getElementById("pageIndicator").textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById("prevPageBtn").disabled = currentPage <= 0;
  document.getElementById("nextPageBtn").disabled = currentPage >= totalPages - 1;
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
             onerror="this.src='https://placehold.co/400x340/f0eee6/6b7060?text=RuralMart'">
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
  alert("Cart is coming soon — this needs a Cart API on the backend that doesn't exist yet.");
}

function openProductModal(id) {
  const product = window.__productCache ? window.__productCache[id] : null;
  if (!product) return;

  const flag = stockFlag(product);
  document.getElementById("modalBody").innerHTML = `
    <img src="${escapeAttr(product.imageUrl)}" alt="${escapeAttr(product.name)}"
         style="width:100%;aspect-ratio:1/0.7;object-fit:cover;border-radius:12px;margin-bottom:16px;"
         onerror="this.src='https://placehold.co/500x350/f0eee6/6b7060?text=RuralMart'">
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