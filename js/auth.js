// =============================
// REGISTER
// =============================

const registerForm = document.getElementById("registerForm");

if (registerForm) {

    registerForm.addEventListener("submit", registerUser);

}

async function registerUser(event) {

    if (!registerForm) return;

    event.preventDefault();

    const request = {

        fullName: document.getElementById("fullName").value,

        email: document.getElementById("email").value,

        phoneNumber: document.getElementById("phoneNumber").value,

        password: document.getElementById("password").value

    };

    try {

        await apiPost(
            "/api/auth/register",
            request,
            false
        );

        alert("Registration Successful!");

        window.location.href = "../html/login.html";

    }
    catch (error) {

        document.getElementById("message").innerText =
            error.message;

    }

}



// =============================
// LOGIN
// =============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", loginUser);

}

async function loginUser(event) {

    if (!loginForm) return;

    event.preventDefault();

    const request = {

        email: document.getElementById("email").value,

        password: document.getElementById("password").value

    };

    try {

        // =============================
        // 1. Login
        // =============================

        const response = await apiPost(
            "/api/auth/login",
            request,
            false
        );

        // Save JWT
        saveToken(response.token);


        // =============================
        // 2. Get Logged-in User
        // =============================

        const user = await apiGet("/api/users/profile");


        console.log("Logged-in user:", user);
        console.log("Role:", user.role);


        // =============================
        // 3. Redirect Based On Role
        // =============================

        if (user.role === "ADMIN") {

            alert("Login Successful!");

            window.location.href =
                "../html/admin-dashboard.html";

        }
       else if (user.role === "CUSTOMER") {

            alert("Login Successful!");

            window.location.href =
                "../html/customer/customer-home.html";
        }
        else {

            throw new Error(
                "Unknown user role."
            );

        }

    }
    catch (error) {

        console.error("Login Error:", error);

        // Remove token if something failed
        removeToken();

        document.getElementById("message").innerText =
            error.message;

    }
}