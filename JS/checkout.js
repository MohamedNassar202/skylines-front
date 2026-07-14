const customerNameInput = document.getElementById("customerName");
const customerPhoneInput = document.getElementById("customerPhone");
const addressInput = document.getElementById("customerAddress");
const confirmBtn = document.getElementById("confirmCheckout");
const governorateInput = document.getElementById("governorate");
const cityInput = document.getElementById("city");
confirmBtn.classList.add("disabled");
confirmBtn.disabled = true;

function clearErrors() {
  document.querySelectorAll("small.text-danger").forEach((el) => {
    el.textContent = "";
  });
}

function setError(id, message) {
  //   console.log(id, message);
  const input = document.getElementById(id.replace("Error", ""));

  document.getElementById(id).textContent = message;
  if (message) {
    input.classList.remove("is-valid");
    input.classList.add("is-invalid");
  } else {
    input.classList.remove("is-invalid");

    if (input.value.trim() === "") {
      input.classList.remove("is-valid");
    } else {
      input.classList.add("is-valid");
    }
  }
}
function checkFormValid() {
  const customerName = customerNameInput.value.trim();
  const customerPhone = customerPhoneInput.value.trim();
  const address = addressInput.value.trim();

  const phoneRegex = /^01[0125][0-9]{8}$/;

  const validName = customerName.length >= 3 && customerName.length <= 50;

  const validPhone = phoneRegex.test(customerPhone);

  const validAddress = address.length >= 10;

  const validGovernorate = governorateInput.value !== "";

  const validCity = cityInput.value !== "";
  if (
    validName &&
    validPhone &&
    validAddress &&
    validGovernorate &&
    validCity
  ) {
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("disabled");
  } else {
    confirmBtn.disabled = true;
    confirmBtn.classList.add("disabled");
  }
}

// Name
customerNameInput.addEventListener("input", () => {
  const value = customerNameInput.value.trim();

  if (value.length === 0) {
    setError("customerNameError", "");
  } else if (value.length < 3) {
    setError("customerNameError", "Name must be at least 3 characters.");
  } else if (value.length > 50) {
    setError("customerNameError", "Name must be maximum 50 characters.");
  } else {
    setError("customerNameError", "");
  }

  checkFormValid();
});

// Phone
customerPhoneInput.addEventListener("input", (e) => {
  const phoneRegex = /^01[0125][0-9]{8}$/;
  e.target.value = e.target.value.replace(/\D/g, "");

  if (
    customerPhoneInput.value &&
    !phoneRegex.test(customerPhoneInput.value.trim())
  ) {
    setError(
      "customerPhoneError",
      "Please enter a valid Egyptian phone number.",
    );
  } else {
    setError("customerPhoneError", "");
  }

  checkFormValid();
});

// Address
addressInput.addEventListener("input", () => {
  const value = addressInput.value.trim();

  if (value.length === 0) {
    setError("customerAddressError", "");
  } else if (value.length < 10) {
    setError("customerAddressError", "Address must be at least 10 characters.");
  } else {
    setError("customerAddressError", "");
  }

  checkFormValid();
});

// Governorate
governorateInput.addEventListener("change", () => {
  setError("governorateError", "");
  checkFormValid();
});

// City
cityInput.addEventListener("change", () => {
  if (!cityInput.value) {
    cityInput.classList.remove("is-valid", "is-invalid");
    setError("cityError", "");
  } else {
    setError("cityError", "");
  }
  checkFormValid();
});
// customer information

if (governorateInput && cityInput) {
  governorateInput.innerHTML = `<option value="">Select Governorate</option>`;

  Object.keys(egyptCities).forEach((gov) => {
    governorateInput.innerHTML += `
    <option value="${gov}">${gov}</option>
  `;
  });

  governorateInput.addEventListener("change", () => {
    if (!governorateInput.value) {
      governorateInput.classList.remove("is-valid", "is-invalid");
      setError("governorateError", "");
      cityInput.innerHTML = `<option value="">Select City</option>`;
      cityInput.classList.remove("is-valid", "is-invalid");
      checkFormValid();
      return;
    }
    setError("cityError", "");
    cityInput.innerHTML = `<option value="">Select City</option>`;
    cityInput.classList.remove("is-valid", "is-invalid");

    egyptCities[governorateInput.value].forEach((c) => {
      cityInput.innerHTML += `
      <option value="${c}">${c}</option>
    `;
    });
    checkFormValid();
  });
  // تحميل مدن أول محافظة تلقائيًا
  //   governorateInput.dispatchEvent(new Event("change"));
}

confirmBtn.addEventListener("click", submitOrder);

async function submitOrder() {
  try {
    if (!window.cart.length) {
      Swal.fire({
        icon: "warning",
        title: "Cart is empty",
      });
      return;
    }
    const customerName = document.getElementById("customerName").value.trim();

    const customerPhone = document.getElementById("customerPhone").value.trim();

    const governorate = document.getElementById("governorate").value;

    const city = document.getElementById("city").value;

    const address = document.getElementById("customerAddress").value.trim();

    const notes = document.getElementById("customerNotes").value.trim();

    const items = window.cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));
    const orderData = {
      customerName,
      customerPhone,
      governorate,
      city,
      address,
      notes,
      items,
    };
    confirmBtn.disabled = true;
    confirmBtn.classList.add("disabled");

    confirmBtn.innerHTML = `
<span class="spinner-border spinner-border-sm"></span>
 Sending...
`;
    const res = await fetch("https://skylines-xi.vercel.app/api/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Checkout failed");
    }
    const result = await Swal.fire({
      icon: "success",
      title: "Order Created",
      text: `Total: ${data.totalPrice} EGP`,
      confirmButtonText: "Send WhatsApp",
      showCancelButton: true,
      cancelButtonText: "Cancel",
    });
    const phone = "201008626867";
    if (result.isConfirmed) {
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("checkoutModal"),
      );
      modal.hide();
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

      setTimeout(() => {
        window.open(
          `https://wa.me/${phone}?text=${encodeURIComponent(data.whatsappMessage)}`,
          "_blank",
        );
      }, 300);

      document.getElementById("customerName").value = "";
      document.getElementById("customerPhone").value = "";
      document.getElementById("customerAddress").value = "";
      document.getElementById("customerNotes").value = "";
      document.querySelectorAll(".form-control,.form-select").forEach((el) => {
        el.classList.remove("is-valid", "is-invalid");
      });

      clearErrors();
      checkFormValid();
      window.cart = [];
      localStorage.setItem("cart", JSON.stringify([]));

      updateCartCount();
      loadCart();
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      Swal.fire({
        icon: "info",
        title: "Order not sent",
        text: "Your cart is still available",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Order Failed",
      text: error.message,
    });
  } finally {
    confirmBtn.innerHTML = `Send Order <i class="fa-brands fa-whatsapp"></i>`;
    checkFormValid();
  }
}
