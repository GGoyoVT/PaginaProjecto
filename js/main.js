/* ============================================================
   Cyber El Bosque — Interactividad
   ============================================================ */

const SITE_NAME = "Cyber El Bosque";
const WHATSAPP_NUMBER = "000000000";

/* ---------- Datos ---------- */

const SERVICES = [
  {
    icon: "🖥️",
    title: "PCs de Alto Rendimiento",
    desc: "Equipos gamer potentes para juegos, trabajo, estudio y navegación sin lag."
  },
  {
    icon: "⏱️",
    title: "Alquiler por Hora",
    desc: "Renta por hora, paquetes de tiempo o membresías con los mejores precios."
  },
  {
    icon: "🖨️",
    title: "Impresiones y Copias",
    desc: "Impresiones, copias, escaneos y envío de documentos a color o blanco y negro."
  },
  {
    icon: "🎮",
    title: "Torneos y Eventos",
    desc: "Competencias de videojuegos, noches de gaming y eventos especiales cada mes."
  }
];

const STORAGE_KEY = "ciberProducts";
const PRICES_STORAGE_KEY = "ciberPrices";
const TOURNAMENTS_STORAGE_KEY = "ciberTournaments";
const SESSION_KEY = "ciberAdminSession";

const DEFAULT_PRODUCTS = [
  { id: 9, name: "Pendrive 32GB", cat: "informatica", catLabel: "Informática", emoji: "💾", price: "₲40.000", desc: "Almacenamiento rápido y portátil para tus archivos." },
  { id: 10, name: "Auriculares", cat: "informatica", catLabel: "Informática", emoji: "🎧", price: "₲60.000", desc: "Sonido claro para juegos y llamadas." },
  { id: 11, name: "Mouse Gamer", cat: "informatica", catLabel: "Informática", emoji: "🖱️", price: "₲45.000", desc: "Preciso y cómodo, con botones programables." },
  { id: 12, name: "Cable USB", cat: "informatica", catLabel: "Informática", emoji: "🔌", price: "₲15.000", desc: "Cables USB y HDMI para conectar lo que necesites." }
];

function getProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* localStorage no disponible */ }
  return DEFAULT_PRODUCTS;
}

const DEFAULT_PRICES = [
  { id: 1, name: "1 Hora", amount: "₲15.000", unit: "/ hora", features: ["Acceso a PC gamer", "Wi-Fi incluido", "Sin reserva previa"], popular: false },
  { id: 2, name: "Paquete 2H", amount: "₲27.000", unit: "/ 2 horas", features: ["Ahorro del 10%", "Wi-Fi incluido", "Bebida de cortesía"], popular: false },
  { id: 3, name: "Paquete 5H", amount: "₲60.000", unit: "/ 5 horas", features: ["Ahorro del 20%", "Wi-Fi incluido", "30 min extra de cortesía", "Uso flexible"], popular: true },
  { id: 4, name: "Membresía Mensual", amount: "₲350.000", unit: "/ mes", features: ["Horas ilimitadas", "Prioridad en torneos", "10% en tienda", "Reserva de PC favorita"], popular: false }
];

function getPrices() {
  try {
    const raw = localStorage.getItem(PRICES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* localStorage no disponible */ }
  return DEFAULT_PRICES;
}

const TOURNAMENTS = [
  { id: 1, game: "FIFA 26", title: "Torneo FIFA Weekend", date: "Sáb 22 Ago · 3:00 PM", prize: "₲750.000 en premios", slots: "32 cupos", desc: "Eliminación directa. Inscripción en recepción." },
  { id: 2, game: "League of Legends", title: "Copa LoL 5v5", date: "Sáb 29 Ago · 4:00 PM", prize: "₲1.250.000 + skins", slots: "8 equipos", desc: "Torneo por equipos con el mejor ambiente del barrio." },
  { id: 3, game: "Free Fire", title: "Battle Royale Squad", date: "Dom 30 Ago · 6:00 PM", prize: "₲600.000 en premios", slots: "40 jugadores", desc: "Dúos y escuadras. Premios para el top 3." }
];

function getTournaments() {
  try {
    const raw = localStorage.getItem(TOURNAMENTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* localStorage no disponible */ }
  return TOURNAMENTS;
}

/* ---------- Renderizado ---------- */

function renderServices() {
  const grid = document.getElementById("servicesGrid");
  grid.innerHTML = SERVICES.map(s => `
    <article class="service-card">
      <div class="service-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.desc}</p>
    </article>
  `).join("");
}

function renderFilters(active = "informatica") {
  const bar = document.getElementById("productFilters");
  const products = getProducts();
  const cats = [...new Set(products.map(p => p.cat))];
  const buttons = cats.map(c => {
    const product = products.find(p => p.cat === c);
    const label = product ? product.catLabel : c;
    return `<button class="filter-btn${active === c ? " active" : ""}" data-cat="${c}">${label}</button>`;
  });
  bar.innerHTML = buttons.join("");
}

function productVisual(p) {
  return p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.emoji || "📦");
}

function productCard(p) {
  return `
    <article class="product-card" data-cat="${p.cat}">
      <div class="product-img${p.image ? " has-image" : ""}">${productVisual(p)}</div>
      <div class="product-body">
        <span class="product-cat">${p.catLabel}</span>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <span class="product-price">${p.price}</span>
        <div class="product-actions">
          <button class="btn btn-sm btn-details" data-action="details" data-id="${p.id}">Detalles</button>
          <button class="btn btn-sm btn-primary" data-action="reserve" data-id="${p.id}">Reservar</button>
        </div>
      </div>
    </article>
  `;
}

let currentFilter = "informatica";
let currentSearch = "";

function renderProducts(filter = currentFilter, search = currentSearch) {
  currentFilter = filter;
  currentSearch = search;
  const grid = document.getElementById("productsGrid");
  let products = getProducts();
  if (filter !== "todos") products = products.filter(p => p.cat === filter);
  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.desc || "").toLowerCase().includes(q) ||
      (p.catLabel || "").toLowerCase().includes(q)
    );
  }
  if (!products.length) {
    grid.innerHTML = `<p class="empty-msg">No se encontraron productos${search ? ` para "${search}"` : ""}.</p>`;
    return;
  }
  grid.innerHTML = products.map(productCard).join("");
}

function renderPrices() {
  const grid = document.getElementById("pricesGrid");
  const prices = getPrices();
  if (!prices.length) {
    grid.innerHTML = `<p class="empty-msg">Aún no hay planes cargados. Carga tus propios precios desde el panel.</p>`;
    return;
  }
  grid.innerHTML = prices.map(p => `
    <article class="price-card${p.popular ? " popular" : ""}">
      ${p.popular ? '<span class="badge">Más popular</span>' : ""}
      <h3>${p.name}</h3>
      <div class="amount">${p.amount}<span>${p.unit}</span></div>
      <ul>
        ${p.features.map(f => `<li>${f}</li>`).join("")}
      </ul>
      <button class="btn ${p.popular ? "btn-green" : "btn-outline"} btn-sm btn-block" data-action="reserve-pc">Elegir plan</button>
    </article>
  `).join("");
}

function renderTournaments() {
  const grid = document.getElementById("tournamentsGrid");
  const tournaments = getTournaments();
  if (!tournaments.length) {
    grid.innerHTML = `<p class="empty-msg">Aún no hay torneos cargados. Carga los tuyos desde el panel.</p>`;
    return;
  }
  grid.innerHTML = tournaments.map(t => `
    <article class="tournament-card">
      ${t.image ? `<div class="tournament-img has-image"><img src="${t.image}" alt="${t.title}"></div>` : ""}
      <span class="game-tag">${t.game}</span>
      <h3>${t.title}</h3>
      <p class="tournament-meta">
        <span>📅 ${t.date}</span>
        <span>👥 ${t.slots}</span>
      </p>
      <p class="tournament-prize">🏆 ${t.prize}</p>
      <p class="tournament-desc">${t.desc}</p>
      <button class="btn btn-sm btn-outline" data-action="inscribir-torneo" style="margin-top:14px">Inscribirme</button>
    </article>
  `).join("");
}

/* ---------- Modal de producto ---------- */

const modal = document.getElementById("productModal");
const modalBody = modal.querySelector(".modal-body");
const productModalFormHTML = (p) => `
  <form class="modal-form" id="modalForm" novalidate>
    <div class="modal-product-head">
      <div class="modal-product-img${p.image ? " has-image" : ""}">${productVisual(p)}</div>
      <div>
        <h3 id="modalTitle">${p.name}</h3>
        <span class="product-cat">${p.catLabel}</span>
        <div class="modal-price">${p.price}</div>
      </div>
    </div>
    <p class="product-desc-full">${p.desc}</p>
    <label for="mName">Tu nombre</label>
    <input type="text" id="mName" placeholder="Nombre" required>
    <label for="mNote">Nota o comentario</label>
    <input type="text" id="mNote" placeholder="¿Algo más que quieras pedir?">
    <div class="form-actions">
      <button type="button" class="btn btn-outline btn-sm" data-close>Cancelar</button>
      <button type="submit" class="btn btn-primary btn-sm">Confirmar ${p.name}</button>
    </div>
    <p class="modal-status" id="modalStatus"></p>
  </form>
`;

function openModal(html) {
  modalBody.innerHTML = html;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ---------- Formularios ---------- */

function setupContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value;
    const message = form.message.value.trim();

    if (!name || !email || !subject || !message) {
      status.textContent = "⚠️ Completa todos los campos.";
      status.className = "form-status err";
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = "⚠️ Ingresa un correo válido.";
      status.className = "form-status err";
      return;
    }
    status.textContent = `✅ ¡Gracias, ${name}! Tu mensaje fue enviado. Te contactaremos pronto.`;
    status.className = "form-status ok";
    form.reset();
  });
}

function setupModalForm() {
  modalBody.addEventListener("submit", (e) => {
    if (e.target.id !== "modalForm") return;
    e.preventDefault();
    const status = modalBody.querySelector("#modalStatus");
    const name = modalBody.querySelector("#mName").value.trim();
    if (!name) {
      status.textContent = "⚠️ Escribe tu nombre para confirmar.";
      status.className = "modal-status err";
      return;
    }
    status.textContent = `✅ ¡Listo, ${name}! Lo tenemos anotado. Te confirmamos por WhatsApp.`;
    status.className = "modal-status ok";
  });
}

/* ---------- Autenticación de administrador ---------- */

const ADMIN_USER = "admin";
const ADMIN_PASS = "2002";

function isLoggedIn() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function setupAuth() {
  const authModal = document.getElementById("authModal");
  const authBtn = document.getElementById("authBtn");
  const adminLink = document.getElementById("adminLink");
  const form = document.getElementById("authForm");
  const userInput = document.getElementById("authUser");
  const passInput = document.getElementById("authPass");
  const status = document.getElementById("authStatus");

  function updateAuthUI() {
    const logged = isLoggedIn();
    adminLink.classList.toggle("hidden", !logged);
    const footerLink = document.getElementById("adminFooterLink");
    if (footerLink) footerLink.classList.toggle("hidden", !logged);
    authBtn.textContent = logged ? "Salir" : "Ingresar";
  }

  function openAuth() {
    form.reset();
    status.textContent = "";
    status.className = "modal-status";
    authModal.classList.add("open");
    authModal.setAttribute("aria-hidden", "false");
  }

  authBtn.addEventListener("click", (e) => {
    e.preventDefault();
    if (isLoggedIn()) {
      if (!confirm("¿Quieres cerrar la sesión de administrador?")) return;
      sessionStorage.removeItem(SESSION_KEY);
      updateAuthUI();
      return;
    }
    openAuth();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const user = userInput.value.trim();
    const pass = passInput.value;
    if (!user || !pass) {
      status.textContent = "⚠️ Completa usuario y contraseña.";
      status.className = "modal-status err";
      return;
    }
    if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
      status.textContent = "⚠️ Usuario o contraseña incorrectos.";
      status.className = "modal-status err";
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    status.textContent = "✅ Sesión iniciada.";
    status.className = "modal-status ok";
    updateAuthUI();
    setTimeout(() => {
      authModal.classList.remove("open");
      authModal.setAttribute("aria-hidden", "true");
    }, 800);
  });

  authModal.querySelectorAll("[data-auth-close]").forEach(el => {
    el.addEventListener("click", () => {
      authModal.classList.remove("open");
      authModal.setAttribute("aria-hidden", "true");
    });
  });

  updateAuthUI();
}

/* ---------- Eventos globales ---------- */

function bindEvents() {
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("nav");

  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    navToggle.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", nav.classList.contains("open"));
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.getElementById("productFilters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    renderFilters(btn.dataset.cat);
    renderProducts(btn.dataset.cat, currentSearch);
  });

  const searchInput = document.getElementById("productSearch");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      renderProducts(currentFilter, searchInput.value.trim());
    });
  }

  document.addEventListener("click", (e) => {
    const detailsBtn = e.target.closest('[data-action="details"]');
    const reserveBtn = e.target.closest('[data-action="reserve"]');
    const reservePcBtn = e.target.closest('[data-action="reserve-pc"]');
    const inscribirBtn = e.target.closest('[data-action="inscribir-torneo"]');
    const closeBtn = e.target.closest("[data-close]");

    if (closeBtn) { closeModal(); return; }

    if (detailsBtn || reserveBtn) {
      const id = Number((detailsBtn || reserveBtn).dataset.id);
      const product = getProducts().find(p => p.id === id);
      if (!product) return;
      const isDetails = !!detailsBtn;
      const inner = isDetails ? `
        <div class="modal-product-head">
          <div class="modal-product-img${product.image ? " has-image" : ""}">${productVisual(product)}</div>
          <div>
            <h3 id="modalTitle">${product.name}</h3>
            <span class="product-cat">${product.catLabel}</span>
            <div class="modal-price">${product.price}</div>
          </div>
        </div>
        <p class="product-desc-full">${product.desc}</p>
        <div class="form-actions">
          <button type="button" class="btn btn-outline btn-sm" data-close>Cerrar</button>
          <button class="btn btn-primary btn-sm" data-action="reserve" data-id="${product.id}">Reservar</button>
        </div>
      ` : productModalFormHTML(product);
      openModal(inner);
    } else if (reservePcBtn) {
      openModal(`
        <h3 id="modalTitle">Reservar PC</h3>
        <p class="product-desc-full">Cuéntanos qué plan o paquete quieres y te lo dejamos listo. Te confirmamos por WhatsApp.</p>
        <form class="modal-form" id="modalForm" novalidate>
          <label for="mName">Tu nombre</label>
          <input type="text" id="mName" placeholder="Nombre" required>
          <label for="mNote">Plan / horario</label>
          <input type="text" id="mNote" placeholder="Ej. Paquete 5H, sábado 4pm">
          <div class="form-actions">
            <button type="button" class="btn btn-outline btn-sm" data-close>Cancelar</button>
            <button type="submit" class="btn btn-primary btn-sm">Confirmar reserva</button>
          </div>
          <p class="modal-status" id="modalStatus"></p>
        </form>
      `);
    } else if (inscribirBtn) {
      const card = inscribirBtn.closest(".tournament-card");
      const title = card.querySelector("h3").textContent;
      openModal(`
        <h3 id="modalTitle">Inscripción a "${title}"</h3>
        <p class="product-desc-full">¡Prepárate para competir! Escríbenos tus datos y te confirmamos tu cupo por WhatsApp.</p>
        <form class="modal-form" id="modalForm" novalidate>
          <label for="mName">Nombre / nick de jugador</label>
          <input type="text" id="mName" placeholder="Nick gamer" required>
          <label for="mNote">Equipo (si aplica)</label>
          <input type="text" id="mNote" placeholder="Nombre del equipo">
          <div class="form-actions">
            <button type="button" class="btn btn-outline btn-sm" data-close>Cancelar</button>
            <button type="submit" class="btn btn-green btn-sm">Inscribirme</button>
          </div>
          <p class="modal-status" id="modalStatus"></p>
        </form>
      `);
    }
  });
}

function setupScrollEffects() {
  const header = document.getElementById("header");
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > 30);
    let current = "";
    sections.forEach(sec => {
      const top = window.scrollY + 120;
      if (sec.offsetTop <= top && sec.offsetTop + sec.offsetHeight > top) {
        current = sec.id;
      }
    });
    navLinks.forEach(link => {
      link.classList.toggle("active", link.getAttribute("href") === `#${current}`);
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Init ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".logo-text, .map iframe, title").forEach(el => {
    if (el.textContent.includes("Cyber El Bosque")) return;
  });
  document.getElementById("year").textContent = new Date().getFullYear();
  document.title = `${SITE_NAME} — Cyber Café & Gaming`;
  renderServices();
  renderFilters();
  renderProducts();
  renderPrices();
  renderTournaments();
  setupContactForm();
  setupModalForm();
  setupAuth();
  setupScrollEffects();
  bindEvents();
});