// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}
const params = new URLSearchParams(window.location.search);

const productId = params.get("id");

const container = document.getElementById("productDetails");

// ========================
// GET PRODUCT DETAILS
// ========================

async function getProductDetails() {
  try {
    showPageLoader();

    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/products/${productId}`,
    );
    if (!productId) {
      container.innerHTML = `
    <div class="text-center text-warning">
      <i class="fa-solid fa-triangle-exclamation fs-1 mb-3"></i>
      <h3>Invalid Product</h3>
    </div>
  `;
      throw new Error("Missing Product ID");
    }
    const data = await res.json();
    if (!data.product) {
      container.innerHTML = `
    <div class="text-center text-warning">
      <i class="fa-solid fa-triangle-exclamation fs-1 mb-3"></i>
      <h3>Product Not Found</h3>
    </div>
  `;
      return;
    }

    displayProduct(data.product);
  } catch (error) {
    container.innerHTML = `
      <div class="text-center text-danger">
        <i class="fa-solid fa-circle-xmark fs-1 mb-3"></i>
        <h3>Something Went Wrong</h3>
      </div>
    `;
  } finally {
    hidePageLoader();
  }
}

// ========================
// DISPLAY PRODUCT
// ========================

function displayProduct(product) {
  const isExist = isInCart(product._id);

  let thumbnails = "";

  // optional images

  if (product.images?.length) {
    product.images.forEach((img) => {
      thumbnails += `
        <img
          src="${img}"
          loading="lazy"
          class="small-image rounded"
          onclick="changeMainImage(event,'${img}')"
          onerror="this.style.display='none'"
        />
      `;
    });
  }
  const showButton = product.description.length > 180;
  container.innerHTML = `
  
    <div class="row g-5 align-items-center">

      <!-- images -->

      <div class="col-lg-5">

        <div class="product-images">

          <!-- main image -->

          <div
            class="main-image-container"
            onmousemove="zoomImage(event)"
            onmouseleave="resetZoom()"
          >

            <img
              id="mainImage"
              src="${product.imageCover}"
              loading="lazy"
              class="w-100 main-image rounded-4"
              ondblclick="mobileZoom()"
              onerror="this.style.display='none'"

            />

          </div>

          <!-- thumbnails -->

          <div class="d-flex gap-3 flex-wrap mt-3">

            <img
              src="${product.imageCover}"
              loading="lazy"
              class="small-image rounded active-image"
              onclick="changeMainImage(event,'${product.imageCover}')"
                onerror="this.style.display='none'"

            />

            ${thumbnails}

          </div>

        </div>

      </div>

      <!-- content -->

      <div class="col-lg-7">

        <span class="badge bg-warning text-dark mb-3 px-3 py-2">

          ${product.category.name || "Unknown Category"}

        </span>

        <h1 class="product-title">

          ${product.title}

        </h1>

        <!-- price -->

        <div class="price-wrapper mb-4">

          ${
            product.priceAfterDiscount > 0
              ? `
                <div class="d-flex align-items-center gap-3 flex-wrap">

                  <h3 class="product-price mb-0">
                    ${product.priceAfterDiscount} EGP
                  </h3>

                  <span class="old-price">
                    ${product.price} EGP
                  </span>

                  <span class="discount-badge">
                    -${Math.round(
                      ((product.price - product.priceAfterDiscount) /
                        product.price) *
                        100,
                    )}%
                  </span>

                </div>
              `
              : `
                <h3 class="product-price">
                  ${product.price} EGP
                </h3>
              `
          }

        </div>

        <!-- description -->
        <div class="mb-4">
  <p id="productDescription" class="product-description fs-5 lh-lg">

    ${product.description}

  </p>

${
  showButton
    ? `
      <button
        id="readMoreBtn"
        class="btn btn-sm btn-outline-warning mt-2"
        onclick="toggleDescription()"
      >
        Read More
      </button>
    `
    : ""
}
</div>

       
        <!-- stock -->

        <div class="d-flex align-items-center gap-2 mb-4">

          <span class="stock-badge ${product.stock <= 5 ? "low-stock" : ""}">

            <i class="fa-solid fa-box"></i>

            ${
              product.stock > 0 ? `In Stock : ${product.stock}` : "Out Of Stock"
            }

          </span>

        </div>

        <!-- button -->

        <button
          onclick="toggleCart(event,'${product._id}', this)"
          class="btn ${
            isExist ? "btn-danger" : "btn-warning"
          } px-5 py-3 fw-bold"
          ${product.stock <= 0 ? "disabled" : ""}
        >
          ${
            product.stock <= 0
              ? `
                Out Of Stock
                <i class="fa-solid fa-ban"></i>
              `
              : isExist
                ? `
                Delete From Cart
                <i class="fa-solid fa-trash"></i>
              `
                : `
                Add To Cart
                <i class="fa-solid fa-cart-shopping"></i>
              `
          }

        </button>

      </div>

    </div>
  
  `;

  updateCartCount();
}

// ========================
// IMAGE ZOOM
// ========================

function zoomImage(event) {
  const image = document.getElementById("mainImage");
  if (!image) return;

  const rect = image.getBoundingClientRect();

  const x = event.clientX - rect.left;

  const y = event.clientY - rect.top;

  const xPercent = (x / rect.width) * 100;

  const yPercent = (y / rect.height) * 100;

  image.style.transform = "scale(2.5)";

  image.style.transformOrigin = `${xPercent}% ${yPercent}%`;
}
let zoomed = false;

function mobileZoom() {
  if (window.innerWidth > 768) return;

  const image = document.getElementById("mainImage");
  if (!image) return;

  zoomed = !zoomed;

  image.style.transform = zoomed ? "scale(2)" : "scale(1)";
  image.style.transformOrigin = "center";
}

function resetZoom() {
  const image = document.getElementById("mainImage");
  if (!image) return;

  image.style.transform = "scale(1)";

  image.style.transformOrigin = "center";
}

// ========================
// CHANGE IMAGE
// ========================

function changeMainImage(event, src) {
  document.getElementById("mainImage").src = src;

  document.querySelectorAll(".small-image").forEach((img) => {
    img.classList.remove("active-image");
  });

  event.target.classList.add("active-image");
}

// ========================
// TOGGLE CART
// ========================

function toggleCart(event, id, button) {
  event.stopPropagation();

  const exists = window.cart.some((item) => item.id === id);

  if (exists) {
    window.cart = window.cart.filter((item) => item.id !== id);
  } else {
    window.cart.push({
      id,
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(window.cart));

  updateCartCount();

  if (button) {
    button.classList.toggle("btn-warning", exists);

    button.classList.toggle("btn-danger", !exists);

    button.innerHTML = exists
      ? `
        Add To Cart
        <i class="fa-solid fa-cart-shopping"></i>
      `
      : `
        Delete From Cart
        <i class="fa-solid fa-trash"></i>
      `;
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
// UPDATE CART COUNT
// ========================

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");

  if (!cartCount) return;

  const total = window.cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCount.innerHTML = total;
}

// ========================
// CHECK IF IN CART
// ========================

function isInCart(id) {
  return window.cart.some((item) => item.id === id);
}
function toggleDescription() {
  const desc = document.getElementById("productDescription");
  const btn = document.getElementById("readMoreBtn");

  desc.classList.toggle("expanded");

  btn.textContent = desc.classList.contains("expanded")
    ? "Read Less"
    : "Read More";
}
// ========================
// INIT
// ========================

updateCartCount();

getProductDetails();
