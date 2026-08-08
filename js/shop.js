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

// ==========================================================================
// RuralMart - Shop Management
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  if (!requireAuth("ADMIN")) return;

  renderNav("shop");

  const createForm = document.getElementById("createShopForm");
  if (createForm) createForm.addEventListener("submit", createShop);

  const shopForm = document.getElementById("shopForm");
  if (shopForm) {
    loadMyShop();
    shopForm.addEventListener("submit", updateMyShop);
  }
});

async function createShop(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("createShopAlert", null);

  const shop = readShopForm();

  setButtonLoading("createShopSubmit", true, "Creating shop...");
  const result = await apiRequestSafe("/api/shops", "POST", shop);
  setButtonLoading("createShopSubmit", false, "Create shop");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("createShopAlert", result.error.message, "error");
    }
    return;
  }

  goTo("admin/shop.html");
}

async function loadMyShop() {
  try {
    const shop = await apiGet("/api/shops/my-shop");
    document.getElementById("shopNameHeading").textContent = shop.shopName;
    document.getElementById("shopName").value = shop.shopName || "";
    document.getElementById("phoneNumber").value = shop.phoneNumber || "";
    document.getElementById("address").value = shop.address || "";
    document.getElementById("description").value = shop.description || "";
    document.getElementById("createdAt").textContent = formatDate(shop.createdAt);
    document.getElementById("updatedAt").textContent = formatDate(shop.updatedAt);
    document.getElementById("shopContent").style.display = "block";
    document.getElementById("noShopState").style.display = "none";
  } catch (error) {
    document.getElementById("shopContent").style.display = "none";
    document.getElementById("noShopState").style.display = "block";
  }
}

async function updateMyShop(event) {
  event.preventDefault();
  const form = event.target;
  clearFieldErrors(form);
  setAlert("shopAlert", null);

  const shop = readShopForm();

  setButtonLoading("shopSubmit", true, "Saving...");
  const result = await apiRequestSafe("/api/shops/my-shop", "PUT", shop);
  setButtonLoading("shopSubmit", false, "Save changes");

  if (!result.ok) {
    if (result.data) {
      applyFieldErrors(result.data);
    } else {
      setAlert("shopAlert", result.error.message, "error");
    }
    return;
  }

  document.getElementById("shopNameHeading").textContent = result.data.shopName;
  document.getElementById("updatedAt").textContent = formatDate(result.data.updatedAt);
  setAlert("shopAlert", "Shop details updated.", "success");
}

function readShopForm() {
  return {
    shopName: document.getElementById("shopName").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    address: document.getElementById("address").value.trim(),
    description: document.getElementById("description").value.trim(),
  };
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
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