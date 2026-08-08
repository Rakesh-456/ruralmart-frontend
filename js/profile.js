// ==========================================
// RuralMart - Profile Module
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    loadProfile();

    const profileForm =
        document.getElementById("profileForm");

    const passwordForm =
        document.getElementById("passwordForm");


    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            updateProfile
        );

    }


    if (passwordForm) {

        passwordForm.addEventListener(
            "submit",
            changePassword
        );

    }

});


// ==========================================
// Load Profile
// ==========================================

async function loadProfile() {

    try {

        const user =
            await apiGet("/api/users/profile");


        document.getElementById("fullName").value =
            user.fullName || "";


        document.getElementById("email").value =
            user.email || "";


        document.getElementById("phoneNumber").value =
            user.phoneNumber || "";


        document.getElementById("role").value =
            user.role || "";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}


// ==========================================
// Update Profile
// ==========================================

async function updateProfile(event) {

    event.preventDefault();


    const fullName =
        document.getElementById("fullName")
            .value
            .trim();


    const phoneNumber =
        document.getElementById("phoneNumber")
            .value
            .trim();


    const request = {

        fullName: fullName,

        phoneNumber: phoneNumber

    };


    try {

        const updatedUser =
            await apiPut(
                "/api/users/profile",
                request
            );


        document.getElementById("message")
            .textContent =
            "Profile updated successfully.";


        document.getElementById("fullName").value =
            updatedUser.fullName;


        document.getElementById("phoneNumber").value =
            updatedUser.phoneNumber;


    }

    catch (error) {

        console.error(error);

        document.getElementById("message")
            .textContent =
            error.message;

    }

}


// ==========================================
// Change Password
// ==========================================

async function changePassword(event) {

    event.preventDefault();


    const currentPassword =
        document.getElementById("currentPassword")
            .value;


    const newPassword =
        document.getElementById("newPassword")
            .value;


    const confirmPassword =
        document.getElementById("confirmPassword")
            .value;


    if (newPassword !== confirmPassword) {

        document.getElementById("passwordMessage")
            .textContent =
            "New passwords do not match.";

        return;

    }


    const request = {

        currentPassword: currentPassword,

        newPassword: newPassword,

        confirmPassword: confirmPassword

    };


    try {

        await apiPut(
            "/api/users/change-password",
            request
        );


        document.getElementById("passwordMessage")
            .textContent =
            "Password changed successfully.";


        document.getElementById("passwordForm")
            .reset();

    }

    catch (error) {

        console.error(error);

        document.getElementById("passwordMessage")
            .textContent =
            error.message;

    }

}