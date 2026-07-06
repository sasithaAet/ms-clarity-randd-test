// ==========================================================
// Kessler & Finch demo store — shared logic across all pages
// Cart + login state persist via localStorage so they survive
// real page navigations (needed for multi-page entry/exit
// tracking in Clarity / GA4).
// ==========================================================

const PRODUCTS = [
  { id: 1, name: "Yirgacheffe Washed", tag: "Ethiopia · Light", price: 19.5, emoji: "☕", bg: "#e7d3b6" },
  { id: 2, name: "Huila Reserve", tag: "Colombia · Medium", price: 18.0, emoji: "🫘", bg: "#d9c4a3" },
  { id: 3, name: "Mandheling Dark", tag: "Sumatra · Dark", price: 17.5, emoji: "☕", bg: "#c7ad8a" },
  { id: 4, name: "Geisha Lot 04", tag: "Panama · Light", price: 32.0, emoji: "🌸", bg: "#ecdcc4" },
  { id: 5, name: "Chemex Filters (100)", tag: "Brew Gear", price: 9.0, emoji: "📄", bg: "#f0e8d8" },
  { id: 6, name: "Hario V60 Dripper", tag: "Brew Gear", price: 24.0, emoji: "🏺", bg: "#e2d1b8" },
  { id: 7, name: "Bonavita Kettle", tag: "Brew Gear", price: 68.0, emoji: "🫖", bg: "#d6c2a1" },
  { id: 8, name: "House Decaf Blend", tag: "Blend · Medium", price: 16.0, emoji: "☕", bg: "#ddc9ab" },
];

const CART_KEY = "kf_cart";
const LOGIN_KEY = "kf_logged_in_email";
const DEMO_PASSWORD = "abc123";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------- Storage helpers ----------------
function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; }
  catch { return {}; }
}
function setCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}
function getLoggedInEmail(){
  return localStorage.getItem(LOGIN_KEY);
}
function setLoggedInEmail(email){
  localStorage.setItem(LOGIN_KEY, email);
}

// ---------------- Cart logic ----------------
function addToCart(id){
  const cart = getCart();
  cart[id] = (cart[id] || 0) + 1;
  setCart(cart);
  renderCart();
}
function changeQty(id, delta){
  const cart = getCart();
  cart[id] = (cart[id] || 0) + delta;
  if (cart[id] <= 0) delete cart[id];
  setCart(cart);
  renderCart();
}
function removeFromCart(id){
  const cart = getCart();
  delete cart[id];
  setCart(cart);
  renderCart();
}
function cartCount(){
  return Object.values(getCart()).reduce((a,b)=>a+b, 0);
}
function cartTotal(){
  const cart = getCart();
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === Number(id));
    return sum + (p ? p.price * qty : 0);
  }, 0);
}

// ---------------- Product grid rendering ----------------
function renderProductGrid(containerId, ids){
  const grid = document.getElementById(containerId);
  if (!grid) return;
  const list = ids ? PRODUCTS.filter(p => ids.includes(p.id)) : PRODUCTS;
  grid.innerHTML = list.map(p => `
    <div class="card">
      <div class="card-img" style="background:${p.bg}">${p.emoji}</div>
      <div class="card-body">
        <div class="card-tag">${p.tag}</div>
        <div class="card-title">${p.name}</div>
        <div class="card-desc">Small-batch, roasted to order, shipped in resealable 12oz bags.</div>
        <div class="card-foot">
          <div class="card-price">$${p.price.toFixed(2)}</div>
          <button class="add-btn" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </div>
  `).join('');

  grid.addEventListener('click', e => {
    const btn = e.target.closest('.add-btn');
    if (!btn) return;
    const id = Number(btn.dataset.id);
    addToCart(id);
    showToast(`Added "${PRODUCTS.find(p=>p.id===id).name}" to cart`);
  });
}

// ---------------- Cart drawer rendering ----------------
function renderCart(){
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const drawerItems = document.getElementById('drawerItems');
  if (!cartCountEl) return;

  cartCountEl.textContent = cartCount();
  cartTotalEl.textContent = `$${cartTotal().toFixed(2)}`;
  if (checkoutBtn) checkoutBtn.disabled = cartCount() === 0;

  const cart = getCart();
  const entries = Object.entries(cart);
  if (entries.length === 0){
    drawerItems.innerHTML = `<div class="drawer-empty">Your cart is empty.<br>Go add something delicious.</div>`;
    return;
  }
  drawerItems.innerHTML = entries.map(([id, qty]) => {
    const p = PRODUCTS.find(p => p.id === Number(id));
    if (!p) return '';
    return `
      <div class="drawer-item">
        <div class="drawer-item-icon" style="background:${p.bg}">${p.emoji}</div>
        <div class="drawer-item-info">
          <h4>${p.name}</h4>
          <div class="price">$${p.price.toFixed(2)} each</div>
          <div class="qty-controls">
            <button data-action="dec" data-id="${p.id}">−</button>
            <span>${qty}</span>
            <button data-action="inc" data-id="${p.id}">+</button>
          </div>
          <div class="remove-link" data-action="remove" data-id="${p.id}">Remove</div>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- Toast ----------------
let toastTimer;
function showToast(msg){
  const toastEl = document.getElementById('toast');
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// ---------------- Header / login badge ----------------
function refreshLoginUI(){
  const loginTrigger = document.getElementById('loginTrigger');
  if (!loginTrigger) return;
  const email = getLoggedInEmail();
  if (email){
    loginTrigger.outerHTML = `<div class="logged-badge" id="loginTrigger">Logged in as ${email}</div>`;
  }
}

// ---------------- Init shared UI wiring ----------------
function initShared(){
  renderCart();
  refreshLoginUI();

  // Drawer open/close
  const overlay = document.getElementById('overlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartTrigger = document.getElementById('cartTrigger');
  const closeCart = document.getElementById('closeCart');

  function openDrawer(){ overlay.classList.add('open'); cartDrawer.classList.add('open'); }
  function closeDrawer(){ overlay.classList.remove('open'); cartDrawer.classList.remove('open'); }

  if (cartTrigger) cartTrigger.addEventListener('click', openDrawer);
  if (closeCart) closeCart.addEventListener('click', closeDrawer);

  const loginModal = document.getElementById('loginModal');
  function openLoginModal(){ loginModal.classList.add('open'); }
  function closeLoginModal(){
    loginModal.classList.remove('open');
    const err = document.getElementById('loginError');
    if (err) err.classList.remove('show');
  }

  if (overlay){
    overlay.addEventListener('click', () => { closeDrawer(); closeLoginModal(); });
  }

  // Qty controls inside drawer
  const drawerItems = document.getElementById('drawerItems');
  if (drawerItems){
    drawerItems.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const id = Number(target.dataset.id);
      const action = target.dataset.action;
      if (action === 'inc') changeQty(id, 1);
      if (action === 'dec') changeQty(id, -1);
      if (action === 'remove') removeFromCart(id);
    });
  }

  // Checkout
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (checkoutBtn){
    checkoutBtn.addEventListener('click', () => {
      if (!getLoggedInEmail()){
        closeDrawer();
        openLoginModal();
        showToast("Please log in to checkout (demo)");
        return;
      }
      showToast(`Order placed — $${cartTotal().toFixed(2)} (demo only, nothing was charged)`);
      setCart({});
      renderCart();
      closeDrawer();
    });
  }

  // Login trigger / modal
  const loginTrigger = document.getElementById('loginTrigger');
  if (loginTrigger){
    loginTrigger.addEventListener('click', () => {
      if (getLoggedInEmail()) return;
      openLoginModal();
    });
  }
  const closeLoginBtn = document.getElementById('closeLogin');
  if (closeLoginBtn) closeLoginBtn.addEventListener('click', closeLoginModal);

  const submitLogin = document.getElementById('submitLogin');
  if (submitLogin){
    submitLogin.addEventListener('click', () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const loginError = document.getElementById('loginError');
      if (EMAIL_REGEX.test(email) && password === DEMO_PASSWORD){
        setLoggedInEmail(email);
        closeLoginModal();
        refreshLoginUI();
        showToast("Logged in successfully");
      } else {
        loginError.classList.add('show');
      }
    });
  }

  // Contact form (contact.html only)
  const contactForm = document.getElementById('contactForm');
  if (contactForm){
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('contactSuccess').classList.add('show');
      contactForm.reset();
      showToast("Message sent (demo only)");
    });
  }
}

document.addEventListener('DOMContentLoaded', initShared);
