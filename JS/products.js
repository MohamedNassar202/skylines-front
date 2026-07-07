// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}

const productsData = document.getElementById("productsData");
const pagination = document.getElementById("pagination");
const searchInput = document.getElementById("searchInput");

// ========================
// CHECK IF IN CART
// ========================
function isInCart(id) {
  return window.cart.some((item) => item.id === id);
}

// ========================
// GET ALL PRODUCTS
// ========================
async function getAllProducts(page = 1, keyword = "") {
  try {
    showPageLoader();
    productsData.innerHTML = `
      <div class="text-center">
        <div class="spinner-border text-warning"></div>
      </div>
    `;

    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/products?page=${page}&limit=8&keyword=${keyword}`,
    );

    const data = await res.json();
    if (!data || !data.products) {
      productsData.innerHTML = `
    <h3 class="text-center text-warning">
      No Data Found
    </h3>
  `;
      return;
    }

    displayProducts(data.products);
    createPagination(data.totalPages, page);
  } catch (error) {
    console.log(error);
    productsData.innerHTML = `
  <h3 class="text-center text-danger">
    Failed to load products
  </h3>
`;
  } finally {
    hidePageLoader();
  }
}

// ========================
// DISPLAY PRODUCTS
// ========================
function displayProducts(products) {
  if (!products.length) {
    productsData.innerHTML = `
      <div class="text-center text-warning">
  <i class="fa-solid fa-box-open fs-1 mb-3"></i>
  <h3>No Products Found</h3>
</div>
    `;
    return;
  }

  let cartona = "";

  products.forEach((product) => {
    const inCart = isInCart(product._id);
    const finalPrice = product.priceAfterDiscount || product.price;

    cartona += `
      <div class="col-lg-3 col-md-4 mb-4">

        <div class="product-card" onclick="goToDetails('${product._id}')">

          <img
          loading="lazy"
            src="${product.imageCover}"
            class="img-fluid"
            alt="${product.title}"
          />

          <div class="p-2">

            <h5 class="text-white">${product.title}</h5>

            <p class="text-warning fw-bold">
              ${finalPrice} EGP
            </p>

            <button
              type="button"
              onclick="toggleCart(event,'${product._id}', this)"
              class="btn ${inCart ? "btn-danger" : "btn-warning"} w-100"
              ${product.stock <= 0 ? "disabled" : ""}
            >
              ${
                product.stock <= 0
                  ? `
                Out Of Stock
                <i class="fa-solid fa-ban"></i>
              `
                  : inCart
                    ? `Delete From Cart <i class="fa-solid fa-trash"></i>`
                    : `Add To Cart <i class="fa-solid fa-cart-shopping"></i>`
              }
            </button>

          </div>

        </div>

      </div>
    `;
  });

  productsData.innerHTML = cartona;
}

// ========================
// GO TO DETAILS
// ========================
function goToDetails(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// ========================
// PAGINATION
// ========================
function createPagination(totalPages, currentPage) {
  let pages = "";

  for (let i = 1; i <= totalPages; i++) {
    pages += `
      <button
        onclick="getAllProducts(${i})"
        class="btn ${i === currentPage ? "btn-warning" : "btn-outline-warning"}"
      >
        ${i}
      </button>
    `;
  }

  pagination.innerHTML = pages;
}

// ========================
// SEARCH
// ========================
let timer;
searchInput.addEventListener("input", function () {
  clearTimeout(timer);
  timer = setTimeout(() => {
    getAllProducts(1, this.value);
  }, 400);
});

// ========================
// TOGGLE CART (IMPORTANT FIX)
// ========================
function toggleCart(event, id, button) {
  event.stopPropagation();

  const exists = window.cart.some((item) => item.id === id);

  if (exists) {
    window.cart = window.cart.filter((item) => item.id !== id);
  } else {
    window.cart.push({ id, quantity: 1 });
  }

  localStorage.setItem("cart", JSON.stringify(window.cart));
  updateCartCount();

  if (button) {
    button.classList.toggle("btn-warning", exists);
    button.classList.toggle("btn-danger", !exists);

    button.innerHTML = exists
      ? `Add To Cart <i class="fa-solid fa-cart-shopping"></i>`
      : `Delete From Cart <i class="fa-solid fa-trash"></i>`;
  }

  Swal.fire({
    toast: true,
    position: "top",
    icon: exists ? "warning" : "success",
    title: exists ? "Removed From Cart" : "Added To Cart",
    timer: 1200,
    showConfirmButton: false,
  });
}

// ========================
// CART COUNT
// ========================
function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;

  const total = window.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.innerHTML = total;
}

// ========================
updateCartCount();
getAllProducts();
