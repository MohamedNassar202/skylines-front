// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}
const productsData = document.getElementById("productsData");
const categoryTitle = document.getElementById("categoryTitle");
const searchInput = document.getElementById("searchInput");
const pagination = document.getElementById("pagination");

const params = new URLSearchParams(window.location.search);

const categoryName = params.get("name");
const categoryId = params.get("id");

let allProducts = [];
let currentKeyword = "";
// ========================
// GET CATEGORY PRODUCTS
// ========================

async function getCategoryProducts(page = 1, keyword = "") {
  currentKeyword = keyword;
  try {
    showPageLoader();
    productsData.innerHTML = `
      <div class="text-center">
        <div class="spinner-border text-warning"></div>
      </div>
    `;
    if (!categoryId) {
      productsData.innerHTML = `
    <h3 class="text-center text-danger">Invalid Category</h3>
  `;
      return;
    }
    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/categories/${categoryId}/products?page=${page}&limit=8&keyword=${keyword}`,
    );

    const data = await res.json();
    if (!data || !data.products) {
      productsData.innerHTML = `
    <h3 class="text-center text-warning">No data available</h3>
  `;
      return;
    }

    allProducts = data.products;

    categoryTitle.innerHTML = categoryName || "Category Products";

    displayProducts(allProducts);

    createPagination(data.totalPages, page);
  } catch (error) {
    console.log(error);
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
    const isExist = isInCart(product._id); // from cart.js
    const finalPrice = product.priceAfterDiscount || product.price;

    cartona += `
      <div class="col-lg-3 col-md-4 mb-4">

        <div class="product-card" onclick="goToDetails('${product._id}')">

          <img
            src="${product.imageCover}"
            class="img-fluid"
            loading="lazy"
            alt="${product.title}"
          />

          <div class="p-3">

            <h5 class="text-white">
              ${product.title}
            </h5>

            <p class="text-warning fw-bold">
              ${finalPrice} EGP
            </p>

            <button
              type="button"
              onclick="toggleCart(event,'${product._id}', this)"
              class="btn ${isExist ? "btn-danger" : "btn-warning"} w-100"
              ${product.stock <= 0 ? "disabled" : ""}
            >
              ${
                product.stock <= 0
                  ? `
                Out Of Stock
                <i class="fa-solid fa-ban"></i>
              `
                  : isExist
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
// PRODUCT DETAILS
// ========================

function goToDetails(id) {
  window.location.href = `product-details.html?id=${id}`;
}

// ========================
// SEARCH
// ========================
let timer;
searchInput.addEventListener("input", function () {
  clearTimeout(timer);
  timer = setTimeout(() => {
    getCategoryProducts(1, this.value);
  }, 400);
});

// ========================
// PAGINATION
// ========================

function createPagination(totalPages, currentPage) {
  let pages = "";

  for (let i = 1; i <= totalPages; i++) {
    pages += `
      <button
         ${i === currentPage ? "disabled" : `onclick = "getCategoryProducts(${i}, '${currentKeyword}')"`}
        class="btn ${i === currentPage ? "btn-warning" : "btn-outline-warning"}"
      >
        ${i}
      </button>
    `;
  }

  pagination.innerHTML = pages;
}

// ========================
// INIT
// ========================

getCategoryProducts();
