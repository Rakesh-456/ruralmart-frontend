// ==========================================================================
// RuralMart - Admin Dashboard
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth("ADMIN")) return;

  renderNav("dashboard");
  loadDashboard();
  checkShop();
});

async function loadDashboard() {
  try {
    const data = await apiGet("/api/products/dashboard");
    document.getElementById("totalProducts").textContent = data.totalProducts;
    document.getElementById("activeProducts").textContent = data.activeProducts;
    document.getElementById("inactiveProducts").textContent = data.inactiveProducts;
    document.getElementById("outOfStockProducts").textContent = data.outOfStockProducts;
  } catch (error) {
    // Most likely cause: this admin hasn't created a shop yet, so there's
    // no product data to summarize. Show zeros instead of an error.
    ["totalProducts", "activeProducts", "inactiveProducts", "outOfStockProducts"].forEach((id) => {
      document.getElementById(id).textContent = "0";
    });
  }
}

async function checkShop() {
  const shopLink = document.getElementById("shopQuickLink");
  const shopLinkLabel = document.getElementById("shopQuickLinkLabel");
  if (!shopLink) return;

  try {
    const shop = await apiGet("/api/shops/my-shop");
    shopLinkLabel.textContent = `Manage “${shop.shopName}”`;
    shopLink.href = resolvePath("admin/shop.html");
  } catch (error) {
    shopLinkLabel.textContent = "Create your shop";
    shopLink.href = resolvePath("admin/create-shop.html");
  }
}