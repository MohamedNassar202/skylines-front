// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}

// ========================
// AUTH
// ========================

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "admin-login.html";
}
// token expired
function handleUnauthorized(res) {
  if (res.status === 401) {
    localStorage.removeItem("token");

    Swal.fire({
      icon: "warning",
      title: "Session Expired",
      text: "Please login again",
    }).then(() => {
      window.location.href = "admin-login.html";
    });

    return true;
  }

  return false;
}

// ========================
// LOGOUT
// ========================

function logout() {
  localStorage.removeItem("token");

  Swal.fire({
    icon: "success",
    title: "Logged Out",
    timer: 1000,
    showConfirmButton: false,
  });

  setTimeout(() => {
    window.location.href = "admin-login.html";
  }, 1000);
}

// ========================
// NAV
// ========================
document.querySelectorAll(".sidebar .nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    if (window.innerWidth < 992) {
      document.querySelector(".sidebar").classList.remove("active");
      document.querySelector(".sidebar-overlay").classList.remove("active");
    }
  });
});
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const menuBtn = document.querySelector(".mobile-menu-btn");

  sidebar.classList.toggle("active");
  overlay.classList.toggle("active");

  if (sidebar.classList.contains("active")) {
    menuBtn.style.display = "none";
  } else {
    menuBtn.style.display = "block";
  }
}

function showSection(section, el) {
  document.getElementById("productsSection").style.display =
    section === "products" ? "block" : "none";

  document.getElementById("categoriesSection").style.display =
    section === "categories" ? "block" : "none";
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  el.classList.add("active");

  localStorage.setItem("activeSection", section);

  // يقفل السايدبار في الموبايل بعد الاختيار
  document.querySelector(".sidebar").classList.remove("active");
  document.querySelector(".sidebar-overlay")?.classList.remove("active");
  document.querySelector(".mobile-menu-btn").style.display = "block";
}
// ========================
// STATE
// ========================

let currentPage = 1;
let limit = 6;
let keyword = "";
let editingId = null;

// ========================
// LOAD PRODUCTS
// ========================

async function loadProducts(page = 1, keyword = "") {
  try {
    showPageLoader();
    currentPage = page;

    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/products?page=${page}&limit=${limit}&keyword=${keyword}`,
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to load products");
    }

    if (!Array.isArray(data.products)) {
      throw new Error("Invalid products data");
    }
    hidePageLoader();

    let html = "";

    if (!data.products.length) {
      html = `
        <div class="col-12 text-center text-white py-5">
          <h3>No Products Found</h3>
        </div>
      `;
    }

    data.products.forEach((p) => {
      html += `
    <div class="col-lg-4 col-md-6 mb-4">

      <div class="card card-dark h-100 shadow-sm">

        <!-- Cover -->
        <img
          src="${p.imageCover}"
          class="card-img-top"
          style="height:250px;object-fit:cover"
        >

        <div class="card-body">

          <h5 class="text-white">
            ${p.title}
          </h5>

          <p class="">
            ${p.description || "No Description"}
          </p>

          <div class="mb-2">

            <span class="badge bg-warning text-dark">
              Stock: ${p.stock}
            </span>

            <span class="badge bg-info">
              ${p.category?.name || "No Category"}
            </span>

          </div>

          <div class="mb-3">

            <h5 class="text-warning mb-0 fs-5">
              ${p.priceAfterDiscount} EGP
            </h5>

            ${
              p.priceAfterDiscount
                ? `
                <small class="text-decoration-line-through fs-5 text-secondary">
                  ${p.price} EGP
                </small>
              `
                : ""
            }

          </div>

          <!-- Gallery -->
          <div class="d-flex gap-2 flex-wrap mb-3">

            ${(p.images || [])
              .slice(0, 7)
              .map(
                (img) => `
                <img
                  src="${img}"
                >
              `,
              )
              .join("")}

          </div>

          <div class="card-actions">

            <button
              class="btn btn-warning w-100"
              onclick="openEdit('${p._id}')"
            >
              <i class="fa-solid fa-pen me-1"></i>
              Edit
            </button>

            <button
              class="btn btn-danger w-100"
              onclick="deleteProduct('${p._id}')"
            >
              <i class="fa-solid fa-trash me-1"></i>
              Delete
            </button>

          </div>

        </div>

      </div>

    </div> 
      `;
    });

    document.getElementById("productsData").innerHTML = html;

    renderPagination(data.totalPages);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  } finally {
    hidePageLoader();
  }
}

// ========================
// SEARCH
// ========================

function searchProducts() {
  keyword = document.getElementById("searchInput").value.trim();

  loadProducts(1, keyword);
}

// ========================
// PAGINATION
// ========================

function renderPagination(totalPages) {
  let html = "";

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button
        class="btn ${
          i === currentPage ? "btn-warning" : "btn-outline-warning"
        } mx-1 mb-2"
        
        ${
          i === currentPage
            ? "disabled"
            : `onclick="loadProducts(${i}, '${keyword}')"`
        }
      >
        ${i}
      </button>
    `;
  }

  document.getElementById("pagination").innerHTML = html;
}

// ========================
// DELETE PRODUCT
// ========================

async function deleteProduct(id) {
  try {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Product?",
      text: "This action cannot be undone",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirm.isConfirmed) return;

    const res = await fetch(`https://skylines-xi.vercel.app/api/v1/products/${id}`, {
      method: "DELETE",
      headers: {
        token: token,
      },
    });

    const data = await res.json();
    if (handleUnauthorized(res)) return;

    if (!res.ok) {
      throw new Error(data.message || "Delete failed");
    }

    Swal.fire({
      icon: "success",
      title: "Product Deleted",
      timer: 1200,
      showConfirmButton: false,
    });

    loadProducts(currentPage, keyword);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: err.message,
    });
  }
}

// ========================
// OPEN EDIT
// ========================
function resetEditModal() {
  document.getElementById("title").value = "";
  document.getElementById("price").value = "";
  document.getElementById("priceAfterDiscount").value = "";
  document.getElementById("stock").value = "";
  document.getElementById("description").value = "";

  document.getElementById("imageCover").value = "";
  document.getElementById("images").value = "";

  document.getElementById("coverPreview").innerHTML = "";
  document.getElementById("previewImages").innerHTML = "";
  document.getElementById("category").value = "";
}

async function openEdit(id) {
  try {
    resetEditModal();
    editingId = id;

    const res = await fetch(`https://skylines-xi.vercel.app/api/v1/products/${id}`);
    const data = await res.json();

    handleUnauthorized(res);
    if (!res.ok) throw new Error(data.message);

    const p = data.product;

    // افتح المودال الأول
    const modalEl = document.getElementById("editModal");
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // استخدم setTimeout بدل events (أبسط وأثبت)
    setTimeout(() => {
      document.getElementById("title").value = p.title || "";
      document.getElementById("price").value = p.price ?? "";
      document.getElementById("priceAfterDiscount").value =
        p.priceAfterDiscount ?? "";
      document.getElementById("stock").value = p.stock ?? "";
      document.getElementById("description").value = p.description || "";
      document.getElementById("category").value =
        p.category?._id || p.category || "";
      validateField({
        inputId: "title",
        errorId: "editTitleError",
        validator: (value) => value.trim().length >= 4,
      });

      validateField({
        inputId: "price",
        errorId: "editPriceError",
        validator: (value) => Number(value) > 0,
      });

      validateField({
        inputId: "description",
        errorId: "editDescriptionError",
        validator: (value) => value.trim().length >= 10,
      });

      checkEditForm();
    }, 200);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  }
}
// ========================
// UPDATE PRODUCT
//=========================
async function updateProduct() {
  try {
    Swal.fire({
      title: "Updating...",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    const formData = new FormData();
    formData.append("title", document.getElementById("title").value);
    formData.append(
      "description",
      document.getElementById("description").value,
    );
    formData.append("category", document.getElementById("category").value);

    const stockVal = document.getElementById("stock").value;

    const priceVal = document.getElementById("price").value;
    const discountVal = document.getElementById("priceAfterDiscount").value;

    if (stockVal !== "") formData.append("stock", stockVal);
    if (priceVal !== "") formData.append("price", priceVal);
    if (discountVal !== "") formData.append("priceAfterDiscount", discountVal);

    // cover image
    const cover = document.getElementById("imageCover").files[0];
    if (cover) {
      formData.append("imageCover", cover);
    }

    // multiple images
    const images = document.getElementById("images").files;
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/products/${editingId}`,
      {
        method: "PUT",
        headers: {
          token: token,
        },
        body: formData,
      },
    );

    const data = await res.json();
    handleUnauthorized(res);

    if (!res.ok) {
      throw new Error(data.message || "Update Failed");
    }

    Swal.fire({
      icon: "success",
      title: "Product Updated",
      timer: 1200,
      showConfirmButton: false,
    });

    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    document.activeElement.blur();

    loadProducts(currentPage, keyword);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Update Failed",
      text: err.message,
    });
  }
}
function checkEditForm() {
  const title = document.getElementById("title").value.trim().length >= 4;

  const price = Number(document.getElementById("price").value) > 0;

  const description =
    document.getElementById("description").value.trim().length >= 10;
  const discount = validateEditDiscount();

  const category = document.getElementById("category").value !== "";

  document.getElementById("editProductBtn").disabled = !(
    title &&
    price &&
    description &&
    discount &&
    category
  );
}
async function loadCategoriesEdit() {
  const res = await fetch("https://skylines-xi.vercel.app/api/v1/categories");
  const data = await res.json();

  let options = "";

  data.categories.forEach((cat) => {
    options += `
      <option value="${cat._id}">
        ${cat.name}
      </option>
    `;
  });

  document.getElementById("category").innerHTML = options;
  document.getElementById("addCategory").innerHTML = options;
}

//! validation

function showError(inputId, errorId) {
  const input = document.getElementById(inputId);

  if (!input.classList.contains("is-valid")) {
    document.getElementById(errorId).classList.add("show");
  }
}
function hideAllErrors() {
  document.querySelectorAll(".error-text").forEach((error) => {
    error.classList.remove("show");
  });
}
function validateField({ inputId, errorId, validator }) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);

  const isValid = validator(input.value);

  input.classList.toggle("is-valid", isValid);
  input.classList.toggle("is-invalid", !isValid);

  error.classList.toggle("show", !isValid);

  return isValid;
}
function validateDiscount() {
  const price = Number(document.getElementById("addPrice").value);
  const discountInput = document.getElementById("addPriceAfterDiscount");
  const discount = Number(discountInput.value);

  // لو الحقل فاضي يبقى عادي (مش required)
  if (document.getElementById("addPriceAfterDiscount").value === "") {
    return true;
  }

  return discount >= 0 && discount < price;
}
function validateEditDiscount() {
  const price = Number(document.getElementById("price").value);

  const discountInput = document.getElementById("priceAfterDiscount");

  if (discountInput.value === "") return true;

  const discount = Number(discountInput.value);

  return discount >= 0 && discount < price;
}
// ! add product

function openAddProduct() {
  const modal = new bootstrap.Modal(document.getElementById("addProductModal"));

  modal.show();
}
const addProductModal = document.getElementById("addProductModal");

addProductModal.addEventListener("hidden.bs.modal", () => {
  resetAddProductForm();
});
function resetAddProductForm() {
  document.getElementById("addTitle").value = "";
  document.getElementById("addPrice").value = "";
  document.getElementById("addPriceAfterDiscount").value = "";
  document.getElementById("addStock").value = "";
  document.getElementById("addDescription").value = "";
  document.getElementById("addImageCover").value = "";
  document.getElementById("addImages").value = "";

  document.getElementById("addCoverPreview").innerHTML = "";
  document.getElementById("addPreviewImages").innerHTML = "";
  // إزالة الـ validation
  document.querySelectorAll("#addProductModal .form-control").forEach((el) => {
    el.classList.remove("is-valid", "is-invalid");
  });

  // إخفاء الرسائل
  document.querySelectorAll("#addProductModal .error-text").forEach((el) => {
    el.classList.remove("show");
  });

  // إخفاء أيقونات الصح
  document.querySelectorAll("#addProductModal .valid-icon").forEach((el) => {
    el.classList.remove("show");
  });
}
async function addProduct() {
  try {
    Swal.fire({
      title: "Adding Product...",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });
    if (
      !document.getElementById("addTitle").value ||
      !document.getElementById("addPrice").value ||
      !document.getElementById("addCategory").value
    ) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Data",
        text: "Title, Price and Category are required",
      });
    }
    const formData = new FormData();

    formData.append("title", document.getElementById("addTitle").value);
    formData.append("price", document.getElementById("addPrice").value);
    formData.append(
      "priceAfterDiscount",
      document.getElementById("addPriceAfterDiscount").value,
    );
    formData.append("stock", document.getElementById("addStock").value);
    formData.append(
      "description",
      document.getElementById("addDescription").value,
    );
    formData.append("category", document.getElementById("addCategory").value);

    // Cover Image
    const cover = document.getElementById("addImageCover").files[0];
    if (!cover) {
      return Swal.fire({
        icon: "warning",
        title: "Main Image is required",
      });
    }

    formData.append("imageCover", cover);

    // Gallery Images
    const images = document.getElementById("addImages").files;

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    const res = await fetch("https://skylines-xi.vercel.app/api/v1/products", {
      method: "POST",
      headers: {
        token: token,
      },
      body: formData,
    });

    const data = await res.json();
    

    handleUnauthorized(res);

    if (!res.ok) {
      throw new Error(data.message || "Failed");
    }

    Swal.fire({
      icon: "success",
      title: "Product Added",
      timer: 1200,
      showConfirmButton: false,
    });

    bootstrap.Modal.getInstance(
      document.getElementById("addProductModal"),
    ).hide();
    // Reset Form

    resetAddProductForm();

    loadProducts(currentPage, keyword);
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Add Failed",
      text: err.message,
    });
  }
}
function checkForm() {
  const title = document.getElementById("addTitle").value.trim().length >= 4;

  const price = Number(document.getElementById("addPrice").value) > 0;

  const description =
    document.getElementById("addDescription").value.trim().length >= 10;

  const cover = document.getElementById("addImageCover").files.length > 0;

  const category = document.getElementById("addCategory").value !== "";
  const discount = validateDiscount();

  document.getElementById("addProductBtn").disabled = !(
    title &&
    price &&
    description &&
    cover &&
    category &&
    discount
  );
}
// ========================
// INIT
// ========================

loadProducts();
loadCategoriesEdit();
window.addEventListener("DOMContentLoaded", () => {
  const savedSection = localStorage.getItem("activeSection") || "products";

  if (savedSection === "products") {
    showSection("products", document.querySelectorAll(".nav-link")[0]);
    loadProducts();
  } else {
    showSection("categories", document.querySelectorAll(".nav-link")[1]);
    loadCategories();
  }
});

// start category crud
//! load categories
async function loadCategories() {
  try {
    showPageLoader();
    const res = await fetch("https://skylines-xi.vercel.app/api/v1/categories");
    const data = await res.json();
    hidePageLoader();
    if (!res.ok) throw new Error(data.message);

    let html = "";

    if (!data.categories.length) {
      document.getElementById("categoriesData").innerHTML = `
        <div class="col-12 text-center text-white py-5">
          <h3>No Categories Found</h3>
        </div>
      `;
      return;
    }

    data.categories.forEach((cat) => {
      html += `
  <div class="col-lg-4 col-md-6">
    <div class="card card-dark p-3 text-white h-100">

      <!-- الصورة -->
      <img
        src="${cat.image || "images/placeholder.png"}"
        style="height:180px;object-fit:cover;border-radius:10px"
        class="mb-3"
      />

      <!-- الاسم -->
      <h5 class="mb-3 text-center">${cat.name}</h5>

      <!-- الأزرار -->
      <div class="d-flex gap-2 mt-auto">

        <button class="btn btn-warning w-50"
          onclick="openEditCategory('${cat._id}', '${cat.name.replace(/'/g, "\\'")}')">
          Edit
        </button>

        <button class="btn btn-danger w-50"
          onclick="deleteCategory('${cat._id}')">
          Delete
        </button>

      </div>

    </div>
  </div>
`;
    });

    document.getElementById("categoriesData").innerHTML = html;
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  } finally {
    hidePageLoader();
  }
}
function openAddCategory() {
  const modal = new bootstrap.Modal(
    document.getElementById("addCategoryModal"),
  );
  modal.show();
}
async function addCategory() {
  try {
    const name = document.getElementById("categoryName").value.trim();
    const image = document.getElementById("categoryImage").files[0];

    // validation
    if (!name) {
      Swal.fire({
        icon: "warning",
        title: "Category name is required",
      });
      return;
    }

    if (!image) {
      Swal.fire({
        icon: "warning",
        title: "Category image is required",
      });
      return;
    }

    // loading
    Swal.fire({
      title: "Adding Category...",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);

    const res = await fetch("https://skylines-xi.vercel.app/api/v1/categories", {
      method: "POST",
      headers: {
        token: token,
      },
      body: formData,
    });

    const data = await res.json();

    handleUnauthorized(res);

    if (!res.ok) {
      throw new Error(data.message || "Failed to add category");
    }

    Swal.fire({
      icon: "success",
      title: "Category Added",
      timer: 1200,
      showConfirmButton: false,
    });

    // close modal
    bootstrap.Modal.getInstance(
      document.getElementById("addCategoryModal"),
    ).hide();

    // reset
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryImage").value = "";

    // reload
    loadCategories();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  }
}
async function deleteCategory(id) {
  try {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "Delete Category?",
      text: "This action cannot be undone",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc3545",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch(`https://skylines-xi.vercel.app/api/v1/categories/${id}`, {
      method: "DELETE",
      headers: {
        token: token,
      },
    });

    const data = await res.json();

    if (handleUnauthorized(res)) return;

    if (!res.ok) {
      throw new Error(data.message || "Delete failed");
    }

    Swal.fire({
      icon: "success",
      title: "Category Deleted",
      timer: 1200,
      showConfirmButton: false,
    });

    loadCategories(); // reload categories
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Delete Failed",
      text: err.message,
    });
  }
}
let currentCategoryId = null;
function openEditCategory(id, name) {
  currentCategoryId = id;

  document.getElementById("editCategoryName").value = name;

  const modal = new bootstrap.Modal(
    document.getElementById("editCategoryModal"),
  );

  modal.show();
}
async function updateCategory() {
  try {
    const name = document.getElementById("editCategoryName").value.trim();
    const image = document.getElementById("editCategoryImage").files[0];

    if (!name) {
      return Swal.fire({
        icon: "warning",
        title: "Name is required",
      });
    }

    const formData = new FormData();
    formData.append("name", name);

    if (image) {
      formData.append("image", image);
    }

    Swal.fire({
      title: "Updating...",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await fetch(
      `https://skylines-xi.vercel.app/api/v1/categories/${currentCategoryId}`,
      {
        method: "PUT",
        headers: {
          token: token,
        },
        body: formData,
      },
    );

    const data = await res.json();

    handleUnauthorized(res);

    if (!res.ok) {
      throw new Error(data.message || "Update failed");
    }

    Swal.fire({
      icon: "success",
      title: "Category Updated",
      timer: 1200,
      showConfirmButton: false,
    });

    bootstrap.Modal.getInstance(
      document.getElementById("editCategoryModal"),
    ).hide();

    loadCategories();
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: err.message,
    });
  }
}

async function loadDashboard() {
  try {
    showPageLoader();

    const res = await fetch("https://skylines-xi.vercel.app/api/v1/dashboard/stats", {
      headers: {
        token: token,
      },
    });

    const data = await res.json();

    if (handleUnauthorized(res)) return;

    if (!res.ok) {
      throw new Error(data.message || "Dashboard failed");
    }

    document.getElementById("totalProducts").innerText =
      data.totalProducts || 0;
    document.getElementById("totalCategories").innerText =
      data.totalCategories || 0;
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Dashboard Error",
      text: err.message,
    });
  } finally {
    hidePageLoader();
  }
}
loadDashboard();
loadCategories();
