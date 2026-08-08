if (!isLoggedIn()) {

    window.location.href = "login.html";

}

let currentPage = 0;
const pageSize = 5;

async function loadPage(page) {

    try {

        const response = await apiGet(
            `/api/products/page?page=${page}&size=${pageSize}`
        );

        displayProducts(response.content);

        currentPage = page;

        document.getElementById("pageNumber").textContent =
            currentPage + 1;

        document.getElementById("previousBtn").disabled =
            response.first;

        document.getElementById("nextBtn").disabled =
            response.last;

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// RuralMart - Product Module
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    // Products Page
    if (document.getElementById("productTable")) {
        loadPage(0);
    }

    // Add Product Page
    const addProductForm = document.getElementById("addProductForm");

    if (addProductForm) {
        addProductForm.addEventListener("submit", addProduct);
    }

    // Edit Product Page
    const editProductForm = document.getElementById("editProductForm");

    if (editProductForm) {

        loadProductDetails();

        editProductForm.addEventListener("submit", updateProduct);

    }

});


// ==========================================
// Load My Products
// ==========================================

async function loadProducts() {

    try {

        const products = await apiGet("/api/products/my-shop");

        displayProducts(products);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

function nextPage() {

    loadPage(currentPage + 1);

}

function previousPage() {

    if (currentPage > 0) {

        loadPage(currentPage - 1);

    }

}



// ==========================================
// Search Products
// ==========================================

async function searchProducts() {

    const keyword =
        document.getElementById("searchKeyword").value.trim();

    if (keyword === "") {

        loadProducts();

        return;

    }

    try {

        const products =
            await apiGet(`/api/products/search?keyword=${encodeURIComponent(keyword)}`);

        displayProducts(products);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

function clearSearch() {

    document.getElementById("searchKeyword").value = "";

    loadProducts();

}


// ==========================================
// Add Product
// ==========================================

async function addProduct(event) {

    event.preventDefault();

    const product = {

        name: document.getElementById("name").value.trim(),

        description: document.getElementById("description").value.trim(),

        category: document.getElementById("category").value,

        price: parseFloat(document.getElementById("price").value),

        stock: parseInt(document.getElementById("stock").value),

        brand: document.getElementById("brand").value.trim(),

        unit: document.getElementById("unit").value.trim(),

        imageUrl: document.getElementById("imageUrl").value.trim()

    };

    try {

        await apiPost("/api/products", product);

        alert("Product Added Successfully");

        window.location.href = "products.html";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ==========================================
// Delete Product
// ==========================================

async function deleteProduct(id) {

    const confirmDelete = confirm(
        "Are you sure you want to delete this product?"
    );

    if (!confirmDelete) {
        return;
    }

    try {

        await apiDelete(`/api/products/${id}`);

        alert("Product Deleted Successfully");

        loadProducts();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ==========================================
// Edit Product
// ==========================================

function editProduct(id) {

    window.location.href = `edit-product.html?id=${id}`;

}

// ==========================================
// Load Product Details
// ==========================================

async function loadProductDetails() {

    const params = new URLSearchParams(window.location.search);

    const id = params.get("id");

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

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Update Product
// ==========================================

async function updateProduct(event) {

    event.preventDefault();

    const id = new URLSearchParams(window.location.search).get("id");

    const product = {

        name: document.getElementById("name").value.trim(),

        description: document.getElementById("description").value.trim(),

        category: document.getElementById("category").value,

        price: parseFloat(document.getElementById("price").value),

        stock: parseInt(document.getElementById("stock").value),

        brand: document.getElementById("brand").value.trim(),

        unit: document.getElementById("unit").value.trim(),

        imageUrl: document.getElementById("imageUrl").value.trim()

    };

    try {

        await apiPut(`/api/products/${id}`, product);

        alert("Product Updated Successfully");

        window.location.href = "products.html";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ==========================================
// Display Products
// ==========================================

function displayProducts(products) {

    const table = document.getElementById("productTable");

    if (!table) return;

    table.innerHTML = "";

    if (products.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    No Products Found
                </td>
            </tr>
        `;

        return;

    }

    products.forEach(product => {

    table.innerHTML += `
        <tr>

            <td>${product.name}</td>

            <td>${product.category}</td>

            <td>₹${product.price}</td>

            <td>${product.stock}</td>

            <td>${product.status}</td>

            <td>
                <button onclick="editProduct(${product.id})">
                    Edit
                </button>
            </td>

            <td>
                <button onclick="deleteProduct(${product.id})">
                    Delete
                </button>
            </td>

        </tr>
    `;

});

}