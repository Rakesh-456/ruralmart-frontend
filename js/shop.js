// ==========================================
// RuralMart - Shop Module
// ==========================================


document.addEventListener("DOMContentLoaded", () => {

    // Create Shop Page
    const createShopForm =
        document.getElementById("createShopForm");

    if (createShopForm) {

        createShopForm.addEventListener(
            "submit",
            createShop
        );

    }


    // My Shop Page
    const shopForm =
        document.getElementById("shopForm");

    if (shopForm) {

        loadMyShop();

        shopForm.addEventListener(
            "submit",
            updateMyShop
        );

    }

});


// ==========================================
// Create Shop
// ==========================================

async function createShop(event) {

    event.preventDefault();


    const shop = {

        shopName:
            document.getElementById("shopName")
                .value
                .trim(),

        phoneNumber:
            document.getElementById("phoneNumber")
                .value
                .trim(),

        address:
            document.getElementById("address")
                .value
                .trim(),

        description:
            document.getElementById("description")
                .value
                .trim()

    };


    try {

        await apiPost(
            "/api/shops",
            shop
        );


        document.getElementById("message")
            .textContent =
            "Shop created successfully.";


        alert("Shop created successfully.");


        window.location.href =
            "shop.html";

    }

    catch (error) {

        console.error(error);

        document.getElementById("message")
            .textContent =
            error.message;

    }

}


// ==========================================
// Load My Shop
// ==========================================

async function loadMyShop() {

    try {

        const shop =
            await apiGet("/api/shops/my-shop");


        document.getElementById("shopId").textContent =
            shop.id || "-";


        document.getElementById("shopName").value =
            shop.shopName || "";


        document.getElementById("phoneNumber").value =
            shop.phoneNumber || "";


        document.getElementById("address").value =
            shop.address || "";


        document.getElementById("description").value =
            shop.description || "";


        document.getElementById("createdAt").textContent =
            shop.createdAt || "-";


        document.getElementById("updatedAt").textContent =
            shop.updatedAt || "-";

    }

    catch (error) {

        console.error(error);

        document.getElementById("message")
            .textContent =
            error.message;

    }

}


// ==========================================
// Update My Shop
// ==========================================

async function updateMyShop(event) {

    event.preventDefault();


    const shop = {

        shopName:
            document.getElementById("shopName")
                .value
                .trim(),

        phoneNumber:
            document.getElementById("phoneNumber")
                .value
                .trim(),

        address:
            document.getElementById("address")
                .value
                .trim(),

        description:
            document.getElementById("description")
                .value
                .trim()

    };


    try {

        const updatedShop =
            await apiPut(
                "/api/shops/my-shop",
                shop
            );


        document.getElementById("message")
            .textContent =
            "Shop updated successfully.";


        document.getElementById("shopId").textContent =
            updatedShop.id || "-";


        document.getElementById("createdAt").textContent =
            updatedShop.createdAt || "-";


        document.getElementById("updatedAt").textContent =
            updatedShop.updatedAt || "-";


        alert("Shop updated successfully.");

    }

    catch (error) {

        console.error(error);

        document.getElementById("message")
            .textContent =
            error.message;

    }

}