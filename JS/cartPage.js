// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}
const cartFooter = document.getElementById("cartFooter");
const cartItems = document.getElementById("cartItems");
const totalPriceEl = document.getElementById("totalPrice");

// cache products
let productCache = {};

// ========================
// GO TO DETAILS
// ========================
function goToDetails(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// ========================
// GET PRICE HELPER
// ========================
function getPrice(product) {
  return product.priceAfterDiscount > 0
    ? product.priceAfterDiscount
    : product.price;
}

// ========================
// CALCULATE ITEM TOTAL
// ========================
function calcItemTotal(product, quantity) {
  return getPrice(product) * quantity;
}

// ========================
// LOAD CART
// ========================
async function loadCart() {
  showPageLoader();
  try {
    cartItems.innerHTML = `
    <div class="text-center">
      <div class="spinner-border text-warning"></div>
    </div>
  `;

    if (!window.cart.length) {
      document.body.style.overflow = "hidden";
      cartFooter.style.display = "none";
      cartItems.innerHTML = `
      <div class="text-center py-5">
        <i class="fa-solid fa-cart-shopping fs-1 text-warning"></i>
        <h3 class="mt-3">Your Cart Is Empty</h3>
        <a href="products.html" class="btn btn-warning mt-3">
          Go Shopping
        </a>
      </div>
    `;
      totalPriceEl.innerHTML = "";
      hidePageLoader();

      return;
    }
    document.body.style.overflow = "auto";
    cartFooter.style.display = "block";
    let cartona = "";
    let total = 0;

    for (const item of window.cart) {
      let product = productCache[item.id];

      if (!product) {
        const res = await fetch(
          `https://skylines-xi.vercel.app/api/v1/products/${item.id}`,
        );
        const data = await res.json();
        product = data.product;
        productCache[item.id] = product;
      }

      if (!product) continue;

      const itemTotal = calcItemTotal(product, item.quantity);
      total += itemTotal;

      cartona += `
      <div class="col-lg-4 col-md-6">

        <div class="card bg-dark text-white h-100">

          <!-- IMAGE -->
          <img
            src="${product.imageCover}"
            class="card-img-top"
            loading="lazy"
            style="height:280px;object-fit:cover;cursor:pointer;"
            onclick="goToDetails('${product._id}')"
            onerror="this.style.display='none'"
          />

          <div class="card-body">

            <!-- TITLE -->
            <h5 style="cursor:pointer"
                onclick="goToDetails('${product._id}')">
              ${product.title}
            </h5>

            <p class="text-warning fw-bold">
              ${getPrice(product)} EGP
            </p>

            <!-- QTY -->
            <div class="d-flex align-items-center gap-3 mb-3"
                 onclick="event.stopPropagation()">

              <button class="btn btn-outline-warning"
                      onclick="changeQuantity('${item.id}', -1)">
                -
              </button>

              <span id="qty-${item.id}" class="fw-bold fs-5">
                ${item.quantity}
              </span>

              <button class="btn btn-outline-warning"
                      onclick="changeQuantity('${item.id}', 1)">
                +
              </button>

            </div>

            <!-- ITEM TOTAL (IMPORTANT FIX) -->
            <p class="fw-bold" id="item-total-${item.id}">
              Total: ${itemTotal} EGP
            </p>

            <!-- REMOVE -->
            <button
              class="btn btn-danger w-100"
              onclick="removeItem(event,'${item.id}')"
            >
              Remove Item
              <i class="fa-solid fa-trash"></i>
            </button>

          </div>
        </div>
      </div>
    `;
    }

    cartItems.innerHTML = cartona;

    updateTotalUI(total);
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Failed To Load Cart",
      text: "Something went wrong",
    });
  } finally {
    hidePageLoader();
  }
}

// ========================
// CHANGE QTY (REAL TIME FIX)
// ========================
function changeQuantity(id, change) {
  const item = window.cart.find((i) => i.id === id);
  if (!item) return;
  const product = productCache[id];
  if (!product) return;
  if (change > 0 && item.quantity >= product.stock) {
    Swal.fire({
      icon: "warning",
      title: "Max stock reached",
    });
    return;
  }
  item.quantity += change;

  if (item.quantity <= 0) {
    window.cart = window.cart.filter((i) => i.id !== id);
    delete productCache[id];
    localStorage.setItem("cart", JSON.stringify(window.cart));
    updateCartCount();
    loadCart();
    return;
  }

  // update qty UI
  document.getElementById(`qty-${id}`).innerText = item.quantity;

  // update ITEM TOTAL UI (FIX IMPORTANT)
  if (product) {
    const newItemTotal = calcItemTotal(product, item.quantity);

    const itemTotalEl = document.getElementById(`item-total-${id}`);
    if (itemTotalEl) {
      itemTotalEl.innerHTML = `Total: ${newItemTotal} EGP`;
    }
  }

  localStorage.setItem("cart", JSON.stringify(window.cart));

  updateCartCount();
  updateTotalUIFast();
}

// ========================
// FAST TOTAL (NO FETCH)
// ========================
function updateTotalUIFast() {
  let total = 0;

  window.cart.forEach((item) => {
    const product = productCache[item.id];
    if (!product) return;

    total += calcItemTotal(product, item.quantity);
  });

  updateTotalUI(total);
}

// ========================
// UPDATE TOTAL UI
// ========================
function updateTotalUI(total) {
  totalPriceEl.innerHTML = `
    Total: <span class="text-warning fw-bold">${total} EGP</span>
  `;
}

// ========================
// REMOVE ITEM
// ========================
function removeItem(event, id) {
  event.stopPropagation();

  window.cart = window.cart.filter((i) => i.id !== id);

  delete productCache[id];

  localStorage.setItem("cart", JSON.stringify(window.cart));

  updateCartCount();
  loadCart();

  Swal.fire({
    toast: true,
    position: "top",
    icon: "warning",
    title: "Item Removed",
    timer: 1200,
    showConfirmButton: false,
  });
}

// ========================
// INIT
// ========================
updateCartCount();
loadCart();

// ========================
// CHECKOUT
// ========================
async function checkout() {
  try {
    if (!window.cart.length) {
      Swal.fire({
        icon: "warning",
        title: "Cart is empty",
      });
      return;
    }

    const items = window.cart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }));

    const res = await fetch("https://skylines-xi.vercel.app/api/v1/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ items }),
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
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(data.whatsappMessage)}`,
        "_blank",
      );
      window.cart = [];
      localStorage.setItem("cart", JSON.stringify([]));

      updateCartCount();
      loadCart();
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
      title: "Checkout Failed",
      text: error.message,
    });
  }
}
