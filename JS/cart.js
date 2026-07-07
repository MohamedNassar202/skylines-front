window.cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(window.cart));
}

function updateCartCount() {
  const cartCount = document.getElementById("cartCount");
  if (!cartCount) return;

  const total = window.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.innerHTML = total;
}

function isInCart(id) {
  return (window.cart || []).some(item => item.id === id);
}

function toggleCart(event, id, button) {
  if (event) event.stopPropagation();

  const exists = isInCart(id);

  if (exists) {
    // REMOVE
    window.cart = window.cart.filter(item => item.id !== id);
  } else {
    // ADD
    window.cart.push({ id, quantity: 1 });
  }

  saveCart();
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

function initCart() {
  updateCartCount();
  
}

initCart();