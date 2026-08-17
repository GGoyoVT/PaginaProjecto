/* ============================================================
   Cyber El Bosque — Panel de administración (productos, precios, torneos)
   ============================================================ */

const PRODUCTS_KEY = "ciberProducts";
const PRICES_KEY = "ciberPrices";
const TOURNAMENTS_KEY = "ciberTournaments";

const DEFAULT_PRODUCTS = [
  { id: 9, name: "Pendrive 32GB", cat: "informatica", catLabel: "Informática", emoji: "💾", price: "₲40.000", desc: "Almacenamiento rápido y portátil para tus archivos." },
  { id: 10, name: "Auriculares", cat: "informatica", catLabel: "Informática", emoji: "🎧", price: "₲60.000", desc: "Sonido claro para juegos y llamadas." },
  { id: 11, name: "Mouse Gamer", cat: "informatica", catLabel: "Informática", emoji: "🖱️", price: "₲45.000", desc: "Preciso y cómodo, con botones programables." },
  { id: 12, name: "Cable USB", cat: "informatica", catLabel: "Informática", emoji: "🔌", price: "₲15.000", desc: "Cables USB y HDMI para conectar lo que necesites." }
];

const DEFAULT_PRICES = [
  { id: 1, name: "1 Hora", amount: "₲15.000", unit: "/ hora", features: ["Acceso a PC gamer", "Wi-Fi incluido", "Sin reserva previa"], popular: false },
  { id: 2, name: "Paquete 2H", amount: "₲27.000", unit: "/ 2 horas", features: ["Ahorro del 10%", "Wi-Fi incluido", "Bebida de cortesía"], popular: false },
  { id: 3, name: "Paquete 5H", amount: "₲60.000", unit: "/ 5 horas", features: ["Ahorro del 20%", "Wi-Fi incluido", "30 min extra de cortesía", "Uso flexible"], popular: true },
  { id: 4, name: "Membresía Mensual", amount: "₲350.000", unit: "/ mes", features: ["Horas ilimitadas", "Prioridad en torneos", "10% en tienda", "Reserva de PC favorita"], popular: false }
];

const DEFAULT_TOURNAMENTS = [
  { id: 1, game: "FIFA 26", title: "Torneo FIFA Weekend", date: "Sáb 22 Ago · 3:00 PM", prize: "₲750.000 en premios", slots: "32 cupos", desc: "Eliminación directa. Inscripción en recepción." },
  { id: 2, game: "League of Legends", title: "Copa LoL 5v5", date: "Sáb 29 Ago · 4:00 PM", prize: "₲1.250.000 + skins", slots: "8 equipos", desc: "Torneo por equipos con el mejor ambiente del barrio." },
  { id: 3, game: "Free Fire", title: "Battle Royale Squad", date: "Dom 30 Ago · 6:00 PM", prize: "₲600.000 en premios", slots: "40 jugadores", desc: "Dúos y escuadras. Premios para el top 3." }
];

function loadKey(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignorar */ }
  saveKey(key, defaults);
  return defaults;
}

function saveKey(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

const getProducts = () => loadKey(PRODUCTS_KEY, DEFAULT_PRODUCTS);
const getPrices = () => loadKey(PRICES_KEY, DEFAULT_PRICES);
const getTournaments = () => loadKey(TOURNAMENTS_KEY, DEFAULT_TOURNAMENTS);
const saveProducts = (d) => saveKey(PRODUCTS_KEY, d);
const savePrices = (d) => saveKey(PRICES_KEY, d);
const saveTournaments = (d) => saveKey(TOURNAMENTS_KEY, d);

function slugify(str) {
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function nextId(list) {
  return list.length ? Math.max(...list.map(i => i.id)) + 1 : 1;
}

/* ---------- Utilidades de imagen (opcional) ---------- */

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const ratio = Math.min(MAX / width, MAX / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setupImageUpload(inputId, previewId, placeholderId, removeBtnId, getImage, setImage) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const removeBtn = document.getElementById(removeBtnId);

  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("⚠️ El archivo debe ser una imagen.");
      input.value = "";
      return;
    }
    try {
      setImage(await resizeImage(file));
      preview.src = getImage();
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
      removeBtn.classList.remove("hidden");
    } catch (e) {
      alert("⚠️ No se pudo procesar la imagen.");
    }
  });

  removeBtn.addEventListener("click", () => {
    setImage(null);
    input.value = "";
    preview.src = "";
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
    removeBtn.classList.add("hidden");
  });
}

/* ============================================================
   PRODUCTOS
   ============================================================ */

let prodEditingId = null;
let prodUploadedImage = null;

function productVisual(p) {
  return p.image ? `<img src="${p.image}" alt="${p.name}">` : (p.emoji || "📦");
}

function renderProducts() {
  const list = document.getElementById("adminProductList");
  const products = getProducts();
  document.getElementById("productCount").textContent = products.length;
  if (!products.length) {
    list.innerHTML = `<p class="empty-msg">Aún no hay productos. Agrega el primero.</p>`;
    return;
  }
  list.innerHTML = products.map(p => `
    <article class="admin-item" data-id="${p.id}">
      <div class="admin-item-img${p.image ? " has-image" : ""}">${productVisual(p)}</div>
      <div class="admin-item-body">
        <span class="product-cat">${p.catLabel}</span>
        <h4>${p.name}</h4>
        <p>${p.desc}</p>
        <span class="product-price">${p.price}</span>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}">Borrar</button>
      </div>
    </article>
  `).join("");
}

function resetProductForm() {
  prodEditingId = null;
  prodUploadedImage = null;
  document.getElementById("pId").value = "";
  document.getElementById("pName").value = "";
  document.getElementById("pCat").value = "";
  document.getElementById("pEmoji").value = "";
  document.getElementById("pPrice").value = "";
  document.getElementById("pDesc").value = "";
  document.getElementById("pImage").value = "";
  document.getElementById("uploadPreview").src = "";
  document.getElementById("uploadPreview").classList.add("hidden");
  document.getElementById("uploadPlaceholder").classList.remove("hidden");
  document.getElementById("btnRemoveImage").classList.add("hidden");
  document.getElementById("prodFormTitle").textContent = "Agregar producto";
  document.getElementById("btnSave").textContent = "Agregar producto";
  document.getElementById("btnCancel").classList.add("hidden");
  setStatus("adminStatus", "");
}

function startEditProduct(id) {
  const product = getProducts().find(p => p.id === id);
  if (!product) return;
  prodEditingId = id;
  prodUploadedImage = product.image || null;
  document.getElementById("pId").value = id;
  document.getElementById("pName").value = product.name;
  document.getElementById("pCat").value = product.catLabel;
  document.getElementById("pEmoji").value = product.emoji || "";
  document.getElementById("pPrice").value = product.price;
  document.getElementById("pDesc").value = product.desc;
  document.getElementById("pImage").value = "";
  document.getElementById("prodFormTitle").textContent = "Editar producto";
  document.getElementById("btnSave").textContent = "Guardar cambios";
  document.getElementById("btnCancel").classList.remove("hidden");
  const preview = document.getElementById("uploadPreview");
  if (product.image) {
    preview.src = product.image;
    preview.classList.remove("hidden");
    document.getElementById("uploadPlaceholder").classList.add("hidden");
    document.getElementById("btnRemoveImage").classList.remove("hidden");
  } else {
    preview.src = "";
    preview.classList.add("hidden");
    document.getElementById("uploadPlaceholder").classList.remove("hidden");
    document.getElementById("btnRemoveImage").classList.add("hidden");
  }
  setStatus("adminStatus", "");
  document.getElementById("productForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleProductSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("pName").value.trim();
  const catLabel = document.getElementById("pCat").value.trim();
  const emoji = document.getElementById("pEmoji").value.trim();
  const price = document.getElementById("pPrice").value.trim();
  const desc = document.getElementById("pDesc").value.trim();

  if (!name || !catLabel || !price || !desc) {
    setStatus("adminStatus", "⚠️ Completa todos los campos obligatorios.", false);
    return;
  }

  const products = getProducts();
  const cat = slugify(catLabel);

  if (prodEditingId) {
    const idx = products.findIndex(p => p.id === prodEditingId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, cat, catLabel, emoji, price, desc };
      if (prodUploadedImage !== null) {
        products[idx].image = prodUploadedImage;
      } else {
        delete products[idx].image;
      }
    }
    setStatus("adminStatus", "✅ Producto actualizado.");
  } else {
    const product = { id: nextId(products), name, cat, catLabel, emoji, price, desc };
    if (prodUploadedImage) product.image = prodUploadedImage;
    products.push(product);
    setStatus("adminStatus", `✅ "${name}" agregado a la tienda.`);
  }

  saveProducts(products);
  renderProducts();
  resetProductForm();
}

/* ============================================================
   PRECIOS
   ============================================================ */

let priceEditingId = null;

function renderPrices() {
  const list = document.getElementById("adminPriceList");
  const prices = getPrices();
  document.getElementById("priceCount").textContent = prices.length;
  if (!prices.length) {
    list.innerHTML = `<p class="empty-msg">Aún no hay planes. Agrega el primero.</p>`;
    return;
  }
  list.innerHTML = prices.map(p => `
    <article class="admin-item" data-id="${p.id}">
      <div class="admin-item-img">${p.popular ? "⭐" : "💳"}</div>
      <div class="admin-item-body">
        <h4>${p.name} ${p.popular ? '<span class="count-badge">Popular</span>' : ""}</h4>
        <p><strong>${p.amount}</strong> ${p.unit}</p>
        <p>${p.features.join(" · ")}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-id="${p.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${p.id}">Borrar</button>
      </div>
    </article>
  `).join("");
}

function resetPriceForm() {
  priceEditingId = null;
  document.getElementById("pcId").value = "";
  document.getElementById("pcName").value = "";
  document.getElementById("pcAmount").value = "";
  document.getElementById("pcUnit").value = "";
  document.getElementById("pcFeatures").value = "";
  document.getElementById("pcPopular").checked = false;
  document.getElementById("priceFormTitle").textContent = "Agregar plan";
  document.getElementById("pcBtnSave").textContent = "Agregar plan";
  document.getElementById("pcBtnCancel").classList.add("hidden");
  setStatus("priceStatus", "");
}

function startEditPrice(id) {
  const price = getPrices().find(p => p.id === id);
  if (!price) return;
  priceEditingId = id;
  document.getElementById("pcId").value = id;
  document.getElementById("pcName").value = price.name;
  document.getElementById("pcAmount").value = price.amount;
  document.getElementById("pcUnit").value = price.unit;
  document.getElementById("pcFeatures").value = price.features.join(", ");
  document.getElementById("pcPopular").checked = !!price.popular;
  document.getElementById("priceFormTitle").textContent = "Editar plan";
  document.getElementById("pcBtnSave").textContent = "Guardar cambios";
  document.getElementById("pcBtnCancel").classList.remove("hidden");
  setStatus("priceStatus", "");
  document.getElementById("priceForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handlePriceSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("pcName").value.trim();
  const amount = document.getElementById("pcAmount").value.trim();
  const unit = document.getElementById("pcUnit").value.trim();
  const featuresRaw = document.getElementById("pcFeatures").value.trim();
  const popular = document.getElementById("pcPopular").checked;

  if (!name || !amount || !unit || !featuresRaw) {
    setStatus("priceStatus", "⚠️ Completa todos los campos obligatorios.", false);
    return;
  }

  const features = featuresRaw.split(",").map(f => f.trim()).filter(Boolean);
  const prices = getPrices();

  if (priceEditingId) {
    const idx = prices.findIndex(p => p.id === priceEditingId);
    if (idx !== -1) {
      prices[idx] = { ...prices[idx], name, amount, unit, features, popular };
    }
    setStatus("priceStatus", "✅ Plan actualizado.");
  } else {
    prices.push({ id: nextId(prices), name, amount, unit, features, popular });
    setStatus("priceStatus", `✅ "${name}" agregado a los precios.`);
  }

  savePrices(prices);
  renderPrices();
  resetPriceForm();
}

/* ============================================================
   TORNEOS
   ============================================================ */

let tourEditingId = null;
let tourUploadedImage = null;

function tournamentVisual(t) {
  return t.image ? `<img src="${t.image}" alt="${t.title}">` : "🏆";
}

function renderTournaments() {
  const list = document.getElementById("adminTournamentList");
  const tournaments = getTournaments();
  document.getElementById("tourCount").textContent = tournaments.length;
  if (!tournaments.length) {
    list.innerHTML = `<p class="empty-msg">Aún no hay torneos. Agrega el primero.</p>`;
    return;
  }
  list.innerHTML = tournaments.map(t => `
    <article class="admin-item" data-id="${t.id}">
      <div class="admin-item-img${t.image ? " has-image" : ""}">${tournamentVisual(t)}</div>
      <div class="admin-item-body">
        <span class="product-cat">${t.game}</span>
        <h4>${t.title}</h4>
        <p>📅 ${t.date} · 👥 ${t.slots}</p>
        <p>🏆 ${t.prize}</p>
        <p>${t.desc}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-id="${t.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${t.id}">Borrar</button>
      </div>
    </article>
  `).join("");
}

function resetTournamentForm() {
  tourEditingId = null;
  tourUploadedImage = null;
  document.getElementById("tId").value = "";
  document.getElementById("tGame").value = "";
  document.getElementById("tTitle").value = "";
  document.getElementById("tDate").value = "";
  document.getElementById("tPrize").value = "";
  document.getElementById("tSlots").value = "";
  document.getElementById("tDesc").value = "";
  document.getElementById("tImage").value = "";
  document.getElementById("tourUploadPreview").src = "";
  document.getElementById("tourUploadPreview").classList.add("hidden");
  document.getElementById("tourUploadPlaceholder").classList.remove("hidden");
  document.getElementById("btnRemoveTourImage").classList.add("hidden");
  document.getElementById("tourFormTitle").textContent = "Agregar torneo";
  document.getElementById("tBtnSave").textContent = "Agregar torneo";
  document.getElementById("tBtnCancel").classList.add("hidden");
  setStatus("tourStatus", "");
}

function startEditTournament(id) {
  const tournament = getTournaments().find(t => t.id === id);
  if (!tournament) return;
  tourEditingId = id;
  tourUploadedImage = tournament.image || null;
  document.getElementById("tId").value = id;
  document.getElementById("tGame").value = tournament.game;
  document.getElementById("tTitle").value = tournament.title;
  document.getElementById("tDate").value = tournament.date;
  document.getElementById("tPrize").value = tournament.prize;
  document.getElementById("tSlots").value = tournament.slots;
  document.getElementById("tDesc").value = tournament.desc;
  document.getElementById("tImage").value = "";
  document.getElementById("tourFormTitle").textContent = "Editar torneo";
  document.getElementById("tBtnSave").textContent = "Guardar cambios";
  document.getElementById("tBtnCancel").classList.remove("hidden");
  const preview = document.getElementById("tourUploadPreview");
  if (tournament.image) {
    preview.src = tournament.image;
    preview.classList.remove("hidden");
    document.getElementById("tourUploadPlaceholder").classList.add("hidden");
    document.getElementById("btnRemoveTourImage").classList.remove("hidden");
  } else {
    preview.src = "";
    preview.classList.add("hidden");
    document.getElementById("tourUploadPlaceholder").classList.remove("hidden");
    document.getElementById("btnRemoveTourImage").classList.add("hidden");
  }
  setStatus("tourStatus", "");
  document.getElementById("tournamentForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleTournamentSubmit(e) {
  e.preventDefault();
  const game = document.getElementById("tGame").value.trim();
  const title = document.getElementById("tTitle").value.trim();
  const date = document.getElementById("tDate").value.trim();
  const prize = document.getElementById("tPrize").value.trim();
  const slots = document.getElementById("tSlots").value.trim();
  const desc = document.getElementById("tDesc").value.trim();

  if (!game || !title || !date || !prize || !slots || !desc) {
    setStatus("tourStatus", "⚠️ Completa todos los campos obligatorios.", false);
    return;
  }

  const tournaments = getTournaments();

  if (tourEditingId) {
    const idx = tournaments.findIndex(t => t.id === tourEditingId);
    if (idx !== -1) {
      tournaments[idx] = { ...tournaments[idx], game, title, date, prize, slots, desc };
      if (tourUploadedImage !== null) {
        tournaments[idx].image = tourUploadedImage;
      } else {
        delete tournaments[idx].image;
      }
    }
    setStatus("tourStatus", "✅ Torneo actualizado.");
  } else {
    const tournament = { id: nextId(tournaments), game, title, date, prize, slots, desc };
    if (tourUploadedImage) tournament.image = tourUploadedImage;
    tournaments.push(tournament);
    setStatus("tourStatus", `✅ "${title}" agregado a los torneos.`);
  }

  saveTournaments(tournaments);
  renderTournaments();
  resetTournamentForm();
}

/* ============================================================
   TABS
   ============================================================ */

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.toggle("active", p.id === `panel-${tab}`));
}

/* ============================================================
   EVENTOS GLOBALES
   ============================================================ */

function setStatus(id, msg, ok = true) {
  const status = document.getElementById(id);
  status.textContent = msg;
  status.className = "form-status " + (ok ? "ok" : "err");
}

function bindEvents() {
  document.querySelectorAll(".admin-tab").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Productos
  document.getElementById("productForm").addEventListener("submit", handleProductSubmit);
  document.getElementById("btnCancel").addEventListener("click", resetProductForm);
  document.getElementById("adminProductList").addEventListener("click", (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) { startEditProduct(Number(editBtn.dataset.id)); return; }
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      const product = getProducts().find(p => p.id === id);
      if (!confirm(`¿Seguro que quieres borrar "${product ? product.name : "este producto"}"?`)) return;
      saveProducts(getProducts().filter(p => p.id !== id));
      renderProducts();
      setStatus("adminStatus", `✅ "${product.name}" eliminado.`);
    }
  });

  // Precios
  document.getElementById("priceForm").addEventListener("submit", handlePriceSubmit);
  document.getElementById("pcBtnCancel").addEventListener("click", resetPriceForm);
  document.getElementById("adminPriceList").addEventListener("click", (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) { startEditPrice(Number(editBtn.dataset.id)); return; }
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      const price = getPrices().find(p => p.id === id);
      if (!confirm(`¿Seguro que quieres borrar "${price ? price.name : "este plan"}"?`)) return;
      savePrices(getPrices().filter(p => p.id !== id));
      renderPrices();
      setStatus("priceStatus", `✅ "${price.name}" eliminado.`);
    }
  });

  // Torneos
  document.getElementById("tournamentForm").addEventListener("submit", handleTournamentSubmit);
  document.getElementById("tBtnCancel").addEventListener("click", resetTournamentForm);
  document.getElementById("adminTournamentList").addEventListener("click", (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) { startEditTournament(Number(editBtn.dataset.id)); return; }
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      const tournament = getTournaments().find(t => t.id === id);
      if (!confirm(`¿Seguro que quieres borrar "${tournament ? tournament.title : "este torneo"}"?`)) return;
      saveTournaments(getTournaments().filter(t => t.id !== id));
      renderTournaments();
      setStatus("tourStatus", `✅ "${tournament.title}" eliminado.`);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  renderProducts();
  renderPrices();
  renderTournaments();
  setupImageUpload("pImage", "uploadPreview", "uploadPlaceholder", "btnRemoveImage",
    () => prodUploadedImage, (v) => { prodUploadedImage = v; });
  setupImageUpload("tImage", "tourUploadPreview", "tourUploadPlaceholder", "btnRemoveTourImage",
    () => tourUploadedImage, (v) => { tourUploadedImage = v; });
  bindEvents();
});