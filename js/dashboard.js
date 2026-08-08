document.addEventListener("DOMContentLoaded", () => {

    loadDashboard();
    checkShop();

});


async function loadDashboard() {

    try {

        console.log("Loading dashboard...");

        const data = await apiGet("/api/products/dashboard");

        console.log("Dashboard data:", data);

        document.getElementById("totalProducts").textContent =
            data.totalProducts;

        document.getElementById("activeProducts").textContent =
            data.activeProducts;

        document.getElementById("inactiveProducts").textContent =
            data.inactiveProducts;

        document.getElementById("outOfStockProducts").textContent =
            data.outOfStockProducts;

    }
    catch (error) {

        console.error("Dashboard Error:", error);

        alert("Unable to load dashboard.");

    }
}


async function checkShop() {

    const shopButton =
        document.getElementById("shopButton");

    if (!shopButton) {
        return;
    }

    try {

        const shop =
            await apiGet("/api/shops/my-shop");

        console.log("Shop loaded:", shop);

        shopButton.textContent = "🏪 My Shop";

        shopButton.onclick = () => {
            window.location.href = "shop.html";
        };

    }
    catch (error) {

        console.error("Shop check failed:", error);

        shopButton.textContent = "🏪 Create Shop";

        shopButton.onclick = () => {
            window.location.href = "create-shop.html";
        };

    }

}