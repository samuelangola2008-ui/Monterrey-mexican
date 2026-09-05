/* ==========================================================================
   MONTERREY MEXICAN — el menú ahora vive directo en el HTML (index.html).
   Cada carta tiene su propio <div class="menu-panel" id="menu-xxx"> con su
   <img> real y sus <div class="menu-item"> con data-name / data-price.
   Para cambiar nombres, precios o fotos: edita el HTML, no este archivo.
   ========================================================================== */
const WHATSAPP_NUMBER = "573104697079"; // +57 310 469 7079
const DELIVERY_FEE = 5000; // 🚚 valor fijo de domicilio — ajústalo aquí si cambia

let selectedPayment = null;

/* ==========================================================================
   ESTADO DEL CARRITO
   ========================================================================== */
let cart = []; // { key, name, price, qty }

const fmt = (n) => "$" + n.toLocaleString("es-CO");

function slugKey(name, price) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + price;
}

/* ==========================================================================
   MENU: pestañas + agregar al carrito + lightbox de las fotos reales
   Todo se conecta por delegación de eventos sobre el HTML ya existente.
   ========================================================================== */
function initMenu() {
  // Pestañas <a href="#menu-xxx" class="menu-tab" data-target="menu-xxx">
  document.querySelectorAll(".menu-tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = tab.dataset.target;
      activateTab(targetId);
      history.replaceState(null, "", "#" + targetId);
    });
  });

  // Botones "+" -> leen data-name / data-price directo del HTML
  document.querySelectorAll(".add-btn").forEach((btn) => {
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);
    const key = slugKey(name, price);
    btn.addEventListener("click", (e) => {
      addToCart(key, name, price);
      pulseButton(e.currentTarget);
    });
  });

  // Foto real de cada carta -> abre en grande (lightbox)
  document.querySelectorAll(".panel-photo .photo-zoom").forEach((btn) => {
    const img = btn.querySelector("img");
    btn.addEventListener("click", () => openLightbox(img.src, img.alt));
  });
}

function activateTab(targetId) {
  document.querySelectorAll(".menu-tab").forEach((t) => t.classList.toggle("active", t.dataset.target === targetId));
  document.querySelectorAll(".menu-panel").forEach((p) => p.classList.toggle("active", p.id === targetId));
}

function pulseButton(btn) {
  btn.style.transform = "scale(1.3)";
  setTimeout(() => (btn.style.transform = ""), 150);
}

/* ==========================================================================
   CARRITO
   ========================================================================== */
function addToCart(key, name, price) {
  const existing = cart.find((c) => c.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ key, name, price, qty: 1 });
  }
  renderCart();
  showToast(`${name} agregado al carrito`);
}

function changeQty(key, delta) {
  const line = cart.find((c) => c.key === key);
  if (!line) return;
  line.qty += delta;
  if (line.qty <= 0) cart = cart.filter((c) => c.key !== key);
  renderCart();
}

function removeLine(key) {
  cart = cart.filter((c) => c.key !== key);
  renderCart();
}

function cartSubtotal() {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}
function cartTotal() {
  return cart.length ? cartSubtotal() + DELIVERY_FEE : 0;
}

function renderCart() {
  const itemsEl = document.getElementById("cartItems");
  const subtotalEl = document.getElementById("cartSubtotal");
  const deliveryEl = document.getElementById("cartDelivery");
  const totalEl = document.getElementById("cartTotal");
  const countEl = document.getElementById("cartCount");

  countEl.textContent = cart.reduce((n, c) => n + c.qty, 0);

  if (cart.length === 0) {
    itemsEl.innerHTML = `<p class="cart-empty">Tu carrito está vacío.<br>Agrega algo delicioso del menú 🌮</p>`;
  } else {
    itemsEl.innerHTML = "";
    cart.forEach((line) => {
      const row = document.createElement("div");
      row.className = "cart-row";
      row.innerHTML = `
        <div class="cart-row-info">
          <div class="cart-row-name">${line.name}</div>
          <div class="cart-row-price">${fmt(line.price)} c/u</div>
          <div class="qty-ctrl">
            <button aria-label="Restar">&minus;</button>
            <span>${line.qty}</span>
            <button aria-label="Sumar">+</button>
            <span class="remove-btn">Quitar</span>
          </div>
        </div>
        <strong>${fmt(line.price * line.qty)}</strong>
      `;
      row.querySelectorAll(".qty-ctrl button")[0].addEventListener("click", () => changeQty(line.key, -1));
      row.querySelectorAll(".qty-ctrl button")[1].addEventListener("click", () => changeQty(line.key, 1));
      row.querySelector(".remove-btn").addEventListener("click", () => removeLine(line.key));
      itemsEl.appendChild(row);
    });
  }

  subtotalEl.textContent = fmt(cartSubtotal());
  deliveryEl.textContent = cart.length ? fmt(DELIVERY_FEE) : fmt(0);
  totalEl.textContent = fmt(cartTotal());
}

/* ==========================================================================
   UI: DRAWER, MODAL, LIGHTBOX, NAV
   ========================================================================== */
function openCart() {
  document.getElementById("cartDrawer").classList.add("open");
  document.getElementById("cartOverlay").classList.add("open");
}
function closeCart() {
  document.getElementById("cartDrawer").classList.remove("open");
  document.getElementById("cartOverlay").classList.remove("open");
}

function openCheckout() {
  if (cart.length === 0) {
    showToast("Agrega algo al carrito primero");
    return;
  }
  document.getElementById("checkoutOverlay").classList.add("open");
}
function closeCheckout() {
  document.getElementById("checkoutOverlay").classList.remove("open");
}

function openLightbox(src, alt) {
  const lb = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  img.src = src;
  img.alt = alt;
  lb.classList.add("open");
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ==========================================================================
   WHATSAPP
   ========================================================================== */
function buildWhatsappMessage(data) {
  const lines = [];
  lines.push("🌮 NUEVO PEDIDO");
  lines.push("");
  lines.push(`👤 Cliente: ${data.name}`);
  lines.push(`📞 Teléfono: ${data.phone}`);
  lines.push("");
  lines.push(`📍 Dirección: ${data.address}`);
  lines.push(`🏘️ Barrio: ${data.neighborhood}`);
  
  if (data.ref) lines.push(`🧭 Indicaciones: ${data.ref}`);
  lines.push("");
  lines.push("🛒 PEDIDO:");
  cart.forEach((line) => {
    lines.push(`🌮 ${line.name} x${line.qty} — ${fmt(line.price * line.qty)}`);
  });
  lines.push("");
  lines.push(`💰 Subtotal: ${fmt(cartSubtotal())}`);
  lines.push(`🚚 Domicilio: ${fmt(DELIVERY_FEE)}`);
  lines.push(`💵 TOTAL: ${fmt(cartTotal())}`);
  lines.push("");
  lines.push(`💳 Método de pago: ${data.payment}`);
  if (data.note) {
    lines.push("");
    lines.push("📝 Nota:");
    lines.push(data.note);
  }
  lines.push("");
  lines.push("¡Gracias!");
  return lines.join("\n");
}

function sendOrderToWhatsapp() {
  const data = {
    name: document.getElementById("custName").value.trim(),
    phone: document.getElementById("custPhone").value.trim(),
    address: document.getElementById("custAddress").value.trim(),
    neighborhood: document.getElementById("custNeighborhood").value.trim(),
    city: document.getElementById("custCity").value.trim(),
    ref: document.getElementById("custRef").value.trim(),
    note: document.getElementById("custNote").value.trim(),
    payment: selectedPayment,
  };

  if (!data.name || !data.phone || !data.address || !data.neighborhood || !data.city) {
    showToast("Completa nombre, teléfono, dirección, barrio y ciudad");
    return;
  }
  if (!data.payment) {
    showToast("Elige un método de pago");
    return;
  }

  const msg = buildWhatsappMessage(data);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
  closeCheckout();
}

function plainWhatsappLink(prefill) {
  const text = prefill || "Hola, quisiera hacer un pedido en Monterrey Mexican 🌮";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initMenu();
  renderCart();

  // Si la URL llega con una etiqueta de menú (ej. #menu-tacos), abre ese menú directo
  const hashId = window.location.hash.replace("#", "");
  if (hashId && document.getElementById(hashId)?.classList.contains("menu-panel")) {
    activateTab(hashId);
  }

  document.getElementById("heroWhatsapp").href = plainWhatsappLink();
  document.getElementById("contactWhatsapp").href = plainWhatsappLink();
  document.getElementById("floatWhatsapp").href = plainWhatsappLink();

  document.getElementById("cartToggle").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);

  document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
  document.getElementById("checkoutClose").addEventListener("click", closeCheckout);
  document.getElementById("sendWhatsapp").addEventListener("click", sendOrderToWhatsapp);

  document.querySelectorAll(".pay-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".pay-chip").forEach((c) => c.classList.remove("selected"));
      chip.classList.add("selected");
      selectedPayment = chip.dataset.value;
    });
  });

  document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });

  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle.addEventListener("click", () => mainNav.classList.toggle("open"));
  mainNav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => mainNav.classList.remove("open")));

  document.getElementById("year").textContent = new Date().getFullYear();

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeCheckout();
      closeCart();
    }
  });
});