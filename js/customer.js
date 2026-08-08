// ==========================================
// RuralMart - Customer
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadCustomerProducts();

});


// ==========================================
// Load Products
// ==========================================

async function loadCustomerProducts() {

    try {

        const products =
            await apiGet("/api/products");

        displayCustomerProducts(products);

    }
    catch (error) {

        console.error(error);

        document.getElementById("productContainer").innerHTML =
            `<p>Unable to load products.</p>`;

    }

}


// ==========================================
// Search Products
// ==========================================

async function searchCustomerProducts() {

    const keyword =
        document.getElementById("searchKeyword")
            .value
            .trim();

    if (keyword === "") {

        loadCustomerProducts();

        return;

    }

    try {

        const products =
            await apiGet(
                `/api/products/search?keyword=${encodeURIComponent(keyword)}`
            );

        displayCustomerProducts(products);

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ==========================================
// Category
// ==========================================

async function loadCategory(category) {

    try {

        const products =
            await apiGet(
                `/api/products/category/${category}`
            );

        displayCustomerProducts(products);

    }
    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ==========================================
// Display Products
// ==========================================

function displayCustomerProducts(products) {

    const container =
        document.getElementById("productContainer");

    container.innerHTML = "";


    if (!products || products.length === 0) {

        container.innerHTML =
            "<p>No products found.</p>";

        return;

    }


    products.forEach(product => {

        container.innerHTML += `

            <div class="product-card">

                <img
                    src="${product.imageUrl}"
                    alt="${product.name}"
                    width="150">

                <h3>
                    ${product.name}
                </h3>

                <p>
                    ${product.description}
                </p>

                <p>
                    Category: ${product.category}
                </p>

                <p>
                    Brand: ${product.brand}
                </p>

                <p>
                    ₹${product.price}
                </p>

                <p>
                    Stock: ${product.stock}
                </p>

                <button
                    onclick="addToCart(${product.id})">

                    Add to Cart

                </button>

            </div>

        `;

    });

}


// ==========================================
// Cart - Temporary Foundation
// ==========================================

function addToCart(productId) {

    alert(
        "Cart functionality will be implemented next."
    );

}