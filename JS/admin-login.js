const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

let isLoading = false;

// ========================
// LOGIN
// ========================

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (isLoading) return; // يمنع الدابل كليك

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    Swal.fire({
      icon: "warning",
      title: "Missing Data",
      text: "Please fill all fields",
    });
    return;
  }

  try {
    isLoading = true;

    const res = await fetch("https://skylines-xi.vercel.app/api/v1/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    let data;

    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("Token not received");
    }

    localStorage.setItem("token", data.token);

    Swal.fire({
      icon: "success",
      title: "Welcome Admin",
      text: "Login successful",
      timer: 1500,
      showConfirmButton: false,
    });

    setTimeout(() => {
      window.location.href = "admin-index.html";
    }, 1600);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Login Failed",
      text: error.message || "Something went wrong",
    });
  } finally {
    isLoading = false;
  }
});
