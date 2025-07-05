// frontend/js/auth.js

// ============ AUTHENTICATION SYSTEM ============

// ============ USER LOGIN ============

// NOTE: For local development, use 'localhost' for both frontend and backend to avoid CORS/network issues.
// If you use 127.0.0.1 for frontend, use 127.0.0.1 for backend as well.

async function loginUser(role) {
  console.log("Login function triggered for:", role);
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    console.log("Fetch response object:", response);

    let data = {};
    try {
      data = await response.json();
    } catch (jsonErr) {
      // If response is not JSON
      data = { msg: 'Server error. Try again.' };
    }

    if (response.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("role", role);
      localStorage.removeItem("logoutReason");

      if (role === "student") {
        window.location.href = "student/Student_dashboard.html";
      } else {
        window.location.href = "warden/Warden_dashboard.html";
      }
    } else {
      alert(data.msg || "Login failed.");
    }
  } catch (err) {
    console.error("Login error:", err.message);
    alert("Network error: Could not reach backend. Make sure the backend is running and accessible at http://localhost:5000.\nError: " + err.message);
  }
}
