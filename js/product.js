// ==========================================================================
// RuralMart - Admin Product Management
//
// GET /api/products/my-shop returns ALL of this shop's products, unpaginated
// (there's no paginated version scoped to "my shop" on the backend — only
// the global /api/products/page, which isn't shop-scoped). So filtering,
// sorting, and pagination here are all done client-side over that full list.
// This is the honest option given what the backend actually exposes; if a
// paginated /api/products/my-shop/page endpoint gets added later, this can
// switch to server-side paging the same way customer.js does.
// ==========================================================================

let allMyProducts = [];
let filteredProducts = [];
let pendingDeleteId = null;
let adminPage = 0;
let adminPageSize = 10;

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth("ADMIN")) return;

  // Products list page
  if (document.getElementById("productTable")) {
    renderNav("products");
    loadMyProducts();

    document.getElementById("searchInput").addEventListener("input", () => applyFilters(true));
    document.getElementById("categoryFilter").addEventListener("change", () => applyFilters(true));
    document.getElementById("statusFilter").addEventListener("change", () => applyFilters(true));
    document.getElementById("sortSelect").addEventListener("change", () => applyFilters(false));
    document.getElementById("pageSizeSelect").addEventListener("change", (e) => {
      adminPageSize = parseInt(e.target.value, 10);
      applyFilters(true);
    });

    document.getElementById("prevPageBtn").addEventListener("click", () => goToAdminPage(adminPage - 1));
    document.getElementById("nextPageBtn").addEventListener("click", () => goToAdminPage(adminPage + 1));

    document.getElementById("confirmDeleteBtn").addEventListener("click", confirmDelete);
    document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
  }

  // Add product page
  const addForm = document.getElementById("addProductForm");
  if (addForm) {
    renderNav("products");
    populateCategorySelect(document.getElementById("category"));
    addForm.addEventListener("submit", addProduct);
  }

  // Edit product page
  const editForm = document.getElementById("editProductForm");
  if (editForm) {
    renderNav("products");
    populateCategorySelect(document.getElementById("category"));
    loadProductForEdit();
    editForm.addEventListener("submit", updateProduct);
  }
});

function populateCategorySelect(select) {
  if (!select) return;
  select.innerHTML =
    `<option value="">Select category</option>` +
    CATEGORIES.map((c) => `<option value="${c.value}">${c.label}</option>`).join("");
}

// ==========================================================================
// List / filters / sort / pagination
// ==========================================================================

async function loadMyProducts() {
  const table = document.getElementById("productTable");
  table.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:40px;">Loading products...</td></tr>`;

  try {
    allMyProducts = await apiGet("/api/products/my-shop");

    const catSelect = document.getElementById("categoryFilter");
    populateCategorySelect(catSelect);
    catSelect.insertAdjacentHTML("afterbegin", `<option value="">All categories</option>`);

    applyFilters(true);
  } catch (error) {
    table.innerHTML = `<tr><td colspan="6" style="padding:30px;">
      <div class="empty-state" style="padding:20px;">
        <p>${escapeHtml(error.message)}</p>
        <p class="form-hint">If you haven't created a shop yet, set one up from your <a href="${resolvePath("admin/create-shop.html")}">shop setup page</a> first.</p>
      </div></td></tr>`;
    document.getElementById("paginationBar").style.display = "none";
  }
}

function applyFilters(resetPage) {
  const keyword = document.getElementById("searchInput").value.trim().toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const status = document.getElementById("statusFilter").value;
  const sort = document.getElementById("sortSelect").value;

  filteredProducts = allMyProducts.filter((p) => {
    const matchesKeyword = !keyword || p.name.toLowerCase().includes(keyword) || p.brand.toLowerCase().includes(keyword);
    const matchesCategory = !category || p.category === category;
    const matchesStatus = !status || p.status === status;
    return matchesKeyword && matchesCategory && matchesStatus;
  });

  if (sort === "name-asc") filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === "price-asc") filteredProducts.sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") filteredProducts.sort((a, b) => b.price - a.price);
  else if (sort === "stock-asc") filteredProducts.sort((a, b) => a.stock - b.stock);

  if (resetPage) adminPage = 0;

  const maxPage = Math.max(Math.ceil(filteredProducts.length / adminPageSize) - 1, 0);
  if (adminPage > maxPage) adminPage = maxPage;

  renderPage();
}

function goToAdminPage(page) {
  const maxPage = Math.max(Math.ceil(filteredProducts.length / adminPageSize) - 1, 0);
  if (page < 0 || page > maxPage) return;
  adminPage = page;
  renderPage();
}

function renderPage() {
  const start = adminPage * adminPageSize;
  const pageItems = filteredProducts.slice(start, start + adminPageSize);
  renderProductTable(pageItems);

  const totalPages = Math.max(Math.ceil(filteredProducts.length / adminPageSize), 1);
  document.getElementById("pageIndicator").textContent = `Page ${adminPage + 1} of ${totalPages} · ${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"}`;
  document.getElementById("prevPageBtn").disabled = adminPage <= 0;
  document.getElementById("nextPageBtn").disabled = adminPage >= totalPages - 1;
  document.getElementById("paginationBar").style.display = "flex";
}

function statusBadgeClass(status) {
  if (status === "ACTIVE") return "badge-active";
  if (status === "OUT_OF_STOCK") return "badge-out";
  if (status === "DISCONTINUED") return "badge-discontinued";
  return "badge-inactive";
}

function renderProductTable(products) {
  const table = document.getElementById("productTable");

  if (!products || products.length === 0) {
    table.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="icon">📦</div>
        <h3>No products found</h3>
        <p>Try adjusting your search or filters, or add a new product.</p>
      </div></td></tr>`;
    return;
  }

  table.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td data-label="Product">
        <div class="product-name-cell">
          <img class="product-thumb" src="${escapeAttr(p.imageUrl)}" onerror="this.src='https://placehold.co/80/f0eee6/6b7060?text=%20'">
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="form-hint">${escapeHtml(p.brand)} · ${escapeHtml(p.unit)}</div>
          </div>
        </div>
      </td>
      <td data-label="Category">${p.category.replace("_", " ")}</td>
      <td data-label="Price">₹${p.price}</td>
      <td data-label="Stock">${p.stock}</td>
      <td data-label="Status"><span class="badge ${statusBadgeClass(p.status)}">${p.status.replace("_", " ")}</span></td>
      <td data-label="Actions">
        <div class="row-actions">
          <button class="btn btn-outline btn-sm" onclick="editProduct(${p.id})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="openDeleteModal(${p.id})">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function editProduct(id) {
  goTo(`admin/edit-product.html?id=${id}`);
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById("deleteModalBackdrop").classList.add("open");
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById("deleteModalBackdrop").classList.remove("open");
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById("confirmDeleteBtn");
  btn.disabled = true;
  btn.textContent = "Deleting...";

  try {
    await apiDelete(`/api/products/${pendingDeleteId}`);
    closeDeleteModal();
    loadMyProducts();
    if (typeof showToast === "function") showToast("Product deleted successfully", "success");
  } catch (error) {
    if (typeof showToast === "function") showToast(error.message, "error");
    else alert(error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "Delete product";
  }
}

// ==========================================================================
// Add product
// ==========================================================================

async function addProduct(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("addProductAlert", null);

  const product = readProductForm();

  setButtonLoading("addProductSubmit", true, "Adding...");
  const result = await apiRequestSafe("/api/products", "POST", product);
  setButtonLoading("addProductSubmit", false, "Add product");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("addProductAlert", result.error.message, "error");
    }
    return;
  }

  if (typeof queueToast === "function") queueToast("Product added successfully", "success");
  goTo("admin/products.html");
}

// ==========================================================================
// Edit product
// ==========================================================================

async function loadProductForEdit() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) {
    goTo("admin/products.html");
    return;
  }

  try {
    const product = await apiGet(`/api/products/${id}`);
    document.getElementById("name").value = product.name;
    document.getElementById("description").value = product.description;
    document.getElementById("category").value = product.category;
    document.getElementById("price").value = product.price;
    document.getElementById("stock").value = product.stock;
    document.getElementById("brand").value = product.brand;
    document.getElementById("unit").value = product.unit;
    document.getElementById("imageUrl").value = product.imageUrl;
    document.getElementById("editProductTitle").textContent = `Edit “${product.name}”`;
  } catch (error) {
    setAlert("editProductAlert", error.message, "error");
  }
}

async function updateProduct(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("editProductAlert", null);

  const id = new URLSearchParams(window.location.search).get("id");
  const product = readProductForm();

  setButtonLoading("editProductSubmit", true, "Saving...");
  const result = await apiRequestSafe(`/api/products/${id}`, "PUT", product);
  setButtonLoading("editProductSubmit", false, "Save changes");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("editProductAlert", result.error.message, "error");
    }
    return;
  }

  if (typeof queueToast === "function") queueToast("Product updated successfully", "success");
  goTo("admin/products.html");
}

function readProductForm() {
  return {
    name: document.getElementById("name").value.trim(),
    description: document.getElementById("description").value.trim(),
    category: document.getElementById("category").value,
    price: parseFloat(document.getElementById("price").value),
    stock: parseInt(document.getElementById("stock").value, 10),
    brand: document.getElementById("brand").value.trim(),
    unit: document.getElementById("unit").value.trim(),
    imageUrl: document.getElementById("imageUrl").value.trim(),
  };
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

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}