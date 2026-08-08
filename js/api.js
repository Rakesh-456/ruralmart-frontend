const API_BASE_URL = "http://localhost:8080";

// ======================================
// Token Functions
// ======================================

function saveToken(token) {
    localStorage.setItem("token", token);
}

function getToken() {
    return localStorage.getItem("token");
}

function removeToken() {
    localStorage.removeItem("token");
}

// ======================================
// Headers
// ======================================

function getHeaders(includeAuth = true) {

    const headers = {
        "Content-Type": "application/json"
    };

    if (includeAuth) {

        const token = getToken();

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }

    return headers;
}

// ======================================
// Generic API Request
// ======================================

async function apiRequest(
    endpoint,
    method = "GET",
    body = null,
    includeAuth = true
) {

    const options = {
        method: method,
        headers: getHeaders(includeAuth)
    };

    if (body !== null) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        options
    );

    let data = {};

    try {
        data = await response.json();
    }
    catch (e) {
        // Ignore if response has no JSON body
    }

    if (!response.ok) {

        throw new Error(
            data.message ||
            data.error ||
            `HTTP ${response.status}`
        );

    }

    return data;
}

// ======================================
// Convenience Methods
// ======================================

function apiGet(endpoint) {
    return apiRequest(endpoint, "GET");
}

function apiPost(endpoint, body, includeAuth = true) {
    return apiRequest(endpoint, "POST", body, includeAuth);
}

function apiPut(endpoint, body) {
    return apiRequest(endpoint, "PUT", body);
}

function apiDelete(endpoint) {
    return apiRequest(endpoint, "DELETE");
}