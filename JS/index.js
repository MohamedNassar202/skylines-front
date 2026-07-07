// !loading screen
function showPageLoader() {
  document.getElementById("pageLoader").classList.remove("hide");
}

function hidePageLoader() {
  document.getElementById("pageLoader").classList.add("hide");
}

// ========================
// NAVBAR
// ========================
// ! scroll spy
const sections = document.querySelectorAll("header, section, footer");
const navLinks = document.querySelectorAll(".nav-link");

window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 120;

    if (window.scrollY >= sectionTop) {
      current = section.getAttribute("id");
    }
  });
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
    current = "contacts";
  }

  navLinks.forEach((link) => {
    link.classList.toggle(
      "active",
      link.getAttribute("href") === `#${current}`,
    );
  });
});
//nav
$(".nav-link").click(function () {
  $(".navbar-collapse").collapse("hide");
});

$(".nav-link").click(function () {
  $(".nav-link").removeClass("active");
  $(this).addClass("active");
});

$(".navbar-collapse").on("show.bs.collapse", function () {
  $("i.open-close").removeClass("fa-align-justify").addClass("fa-x");

  for (let i = 0; i < 6; i++) {
    $(".navbar-nav li")
      .eq(i)
      .animate({ top: 0 }, (i + 5) * 100);
  }
});

$(".navbar-collapse").on("hide.bs.collapse", function () {
  $("i.open-close").removeClass("fa-x").addClass("fa-align-justify");
  $(".navbar-nav li").animate({ top: 300 }, 700);
});

function handleNavbarResize() {
  if ($(window).width() >= 992) {
    $(".navbar-nav .nav-item").css("top", 0);
  } else {
    $(".navbar-nav .nav-item").css("top", 300);
  }
}

handleNavbarResize();

$(window).resize(handleNavbarResize);

async function checkOut() {
  try {
    showPageLoader();

    if (!window.cart || window.cart.length === 0) {
      hidePageLoader();
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

    if (!res.ok) throw new Error(data.message);

    hidePageLoader();

    const result = await Swal.fire({
      icon: "success",
      title: "Order Created 🎉",
      html: `
        <h4>Total: ${data.totalPrice} EGP</h4>
        <p>Do you want to continue to WhatsApp?</p>
      `,
      showCancelButton: true,
      confirmButtonText: "Open WhatsApp",
      cancelButtonText: "Stay Here",
    });

    if (!result.isConfirmed) return;

    window.open(
      `https://wa.me/201008626867?text=${encodeURIComponent(
        data.whatsappMessage,
      )}`,
      "_blank",
    );

    window.cart = [];
    localStorage.removeItem("cart");
    updateCartCount();
    getAllProducts();
  } catch (error) {
    hidePageLoader();

    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: error.message || "Try again later",
    });
  }
}
// ========================
// HERO SWIPER
// ========================

new Swiper(".heroSwiper", {
  loop: true,
  speed: 1000,
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  effect: "fade",
});

// ========================
// CATEGORIES
// ========================

async function getCategories() {
  const response = await fetch("https://skylines-xi.vercel.app/api/v1/categories");
  const data = await response.json();

  let cartona = "";

  data.categories.forEach((category) => {
    cartona += `
      <div class="col-md-3 pb-3">
        <a href="category-products.html?id=${category._id}&name=${encodeURIComponent(category.name)}"
          class="text-decoration-none">

          <div class="category-card">
            <img loading="lazy" class="w-100" src="${category.image}" alt="${category.name}"
             />

            <div class="layer">
              <h3>${category.name}</h3>

              <a href="category-products.html?id=${category._id}"
                 class="d-flex align-items-center text-warning text-decoration-none fw-bold">
                View Products
                <i class="ps-2 fa-solid fa-arrow-right"></i>
              </a>
            </div>

          </div>
        </a>
      </div>
    `;
  });

  document.getElementById("categoriesData").innerHTML = cartona;
}

getCategories();

// ========================
// PRODUCTS
// ========================

async function getAllProducts() {
  try {
    showPageLoader();
    const res = await fetch(
      "https://skylines-xi.vercel.app/api/v1/products?page=1&limit=8",
    );

    const data = await res.json();

    let cartona = "";

    data.products.forEach((product) => {
      const isExist = isInCart(product._id); // from cart.js
      const finalPrice = product.priceAfterDiscount || product.price;

      cartona += `
        <div class="col-lg-3 col-md-4 mb-4">

          <div class="product-card" onclick="goToDetails('${product._id}')">

            <img

              src="${product.imageCover}"
              loading="lazy"
              class="img-fluid"
              alt="${product.title}"
              
            />

            <div class="p-2">

              <h5 class="text-white">${product.title}</h5>

              <p class="text-warning fw-bold">${finalPrice} EGP</p>

              <button
                onclick="toggleCart(event,'${product._id}', this)"
                class="btn ${isExist ? "btn-danger" : "btn-warning"} w-100"${product.stock <= 0 ? "disabled" : ""}
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

    document.getElementById("productsData").innerHTML = cartona;
  } catch (error) {
    console.log("Error:", error);
  } finally {
    hidePageLoader();
  }
}

// ========================
// DETAILS NAV
// ========================

function goToDetails(id) {
  window.location.href = `product-details.html?id=${id}`;
}

getAllProducts();

//! get location for analytics

