/* ============================================================
   Cyber El Bosque — Panel de administración (productos, precios, torneos)
   ============================================================ */

const PRODUCTS_KEY = "ciberProducts";
const PRICES_KEY = "ciberPrices";
const TOURNAMENTS_KEY = "ciberTournaments";
const ORDERS_KEY = "ciberOrders";
const CONFIG_KEY = "ciberConfig";

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
const getOrders = () => loadKey(ORDERS_KEY, []);
const saveProducts = (d) => saveKey(PRODUCTS_KEY, d);
const savePrices = (d) => saveKey(PRICES_KEY, d);
const saveTournaments = (d) => saveKey(TOURNAMENTS_KEY, d);
const saveOrders = (d) => saveKey(ORDERS_KEY, d);

const DEFAULT_CONFIG = {
  envioPrice: "",
  envioMin: "",
  whatsapp: "",
  address: "",
  bank: "",
  holder: "",
  account: "",
  aliasType: "",
  alias: ""
};
const getConfig = () => ({ ...DEFAULT_CONFIG, ...loadKey(CONFIG_KEY, DEFAULT_CONFIG) });
const saveConfig = (d) => saveKey(CONFIG_KEY, d);

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
   PEDIDOS
   ============================================================ */

let orderEditingId = null;

const ORDER_STATUS = { pendiente: "Pendiente", entregado: "Entregado", facturado: "Facturado" };

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function statusBadge(s) {
  return `<span class="status-badge ${s}">${ORDER_STATUS[s] || s}</span>`;
}

function parsePrice(str) {
  const n = parseFloat(String(str || "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

function formatGuaranies(n) {
  return "₲" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function renderOrders() {
  const list = document.getElementById("adminOrderList");
  const orders = getOrders();
  document.getElementById("orderCount").textContent = orders.length;
  if (!orders.length) {
    list.innerHTML = `<p class="empty-msg">Aún no hay pedidos. Agrega el primero.</p>`;
    return;
  }
  list.innerHTML = orders.map(o => `
    <article class="admin-item" data-id="${o.id}">
      <div class="admin-item-img">📦</div>
      <div class="admin-item-body">
        <span class="product-cat">${o.product} · 📅 ${o.date || "—"}</span>
        <h4>${o.client} ${statusBadge(o.status || "pendiente")}</h4>
        <p>💰 ${o.price}</p>
        <p>🛵 Repartidor: ${o.delivery}</p>
        <p>📍 ${o.place}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-outline" data-action="edit" data-id="${o.id}">Editar</button>
        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${o.id}">Borrar</button>
      </div>
    </article>
  `).join("");
}

function resetOrderForm() {
  orderEditingId = null;
  document.getElementById("oId").value = "";
  document.getElementById("oProduct").value = "";
  document.getElementById("oPrice").value = "";
  document.getElementById("oClient").value = "";
  document.getElementById("oDelivery").value = "";
  document.getElementById("oPlace").value = "";
  document.getElementById("oDate").value = todayISO();
  document.getElementById("oStatus").value = "pendiente";
  document.getElementById("orderFormTitle").textContent = "Agregar pedido";
  document.getElementById("oBtnSave").textContent = "Agregar pedido";
  document.getElementById("oBtnCancel").classList.add("hidden");
  setStatus("orderStatus", "");
}

function startEditOrder(id) {
  const order = getOrders().find(o => o.id === id);
  if (!order) return;
  orderEditingId = id;
  document.getElementById("oId").value = id;
  document.getElementById("oProduct").value = order.product;
  document.getElementById("oPrice").value = order.price;
  document.getElementById("oClient").value = order.client;
  document.getElementById("oDelivery").value = order.delivery;
  document.getElementById("oPlace").value = order.place;
  document.getElementById("oDate").value = order.date || todayISO();
  document.getElementById("oStatus").value = order.status || "pendiente";
  document.getElementById("orderFormTitle").textContent = "Editar pedido";
  document.getElementById("oBtnSave").textContent = "Guardar cambios";
  document.getElementById("oBtnCancel").classList.remove("hidden");
  setStatus("orderStatus", "");
  document.getElementById("orderForm").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleOrderSubmit(e) {
  e.preventDefault();
  const product = document.getElementById("oProduct").value.trim();
  const price = document.getElementById("oPrice").value.trim();
  const client = document.getElementById("oClient").value.trim();
  const delivery = document.getElementById("oDelivery").value.trim();
  const place = document.getElementById("oPlace").value.trim();
  const date = document.getElementById("oDate").value || todayISO();
  const status = document.getElementById("oStatus").value;

  if (!product || !price || !client || !delivery || !place) {
    setStatus("orderStatus", "⚠️ Completa todos los campos obligatorios.", false);
    return;
  }

  const orders = getOrders();

  if (orderEditingId) {
    const idx = orders.findIndex(o => o.id === orderEditingId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], product, price, client, delivery, place, date, status };
    }
    setStatus("orderStatus", "✅ Pedido actualizado.");
  } else {
    orders.push({ id: nextId(orders), product, price, client, delivery, place, date, status });
    setStatus("orderStatus", `✅ Pedido de "${client}" agregado.`);
  }

  saveOrders(orders);
  renderOrders();
  refreshGeneral();
  resetOrderForm();
}

/* ============================================================
   GENERAL (estadísticas y registro)
   ============================================================ */

function renderStats() {
  const orders = getOrders();
  const today = todayISO();
  const facturadoHoy = orders.filter(o => o.status === "facturado" && (o.statusDate || o.date) === today).length;
  const entregadosHoy = orders.filter(o => o.status === "entregado" && (o.statusDate || o.date) === today).length;
  const pendientes = orders.filter(o => (o.status || "pendiente") === "pendiente").length;
  const total = orders.length;
  const promedio = total ? orders.reduce((acc, o) => acc + parsePrice(o.price), 0) / total : 0;

  document.getElementById("statFacturadoHoy").textContent = facturadoHoy;
  document.getElementById("statPendientes").textContent = pendientes;
  document.getElementById("statEntregados").textContent = entregadosHoy;
  document.getElementById("statTicketPromedio").textContent = formatGuaranies(promedio);
}

function renderPendingToday() {
  const list = document.getElementById("pendingTodayList");
  const today = todayISO();
  const pending = getOrders().filter(o => (o.status || "pendiente") === "pendiente" && (o.date || today) === today);
  document.getElementById("pendHoyCount").textContent = pending.length;
  if (!pending.length) {
    list.innerHTML = `<p class="empty-msg">🎉 No hay pedidos pendientes de hoy.</p>`;
    return;
  }
  list.innerHTML = pending.map(o => `
    <article class="admin-item" data-id="${o.id}">
      <div class="admin-item-img">📦</div>
      <div class="admin-item-body">
        <span class="product-cat">${o.product}</span>
        <h4>${o.client}</h4>
        <p>💰 ${o.price} · 📍 ${o.place}</p>
        <p>🛵 ${o.delivery}</p>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-primary" data-action="marcar" data-status="entregado" data-id="${o.id}">Entregado</button>
        <button class="btn btn-sm btn-green" data-action="marcar" data-status="facturado" data-id="${o.id}">Facturado</button>
      </div>
    </article>
  `).join("");
}

let regFilters = { from: "", to: "", status: "" };

function renderRegistry() {
  const list = document.getElementById("orderRegistry");
  let orders = getOrders().slice().reverse();
  const { from, to, status } = regFilters;
  if (from) orders = orders.filter(o => (o.date || "") >= from);
  if (to) orders = orders.filter(o => (o.date || "") <= to);
  if (status) orders = orders.filter(o => (o.status || "pendiente") === status);
  if (!orders.length) {
    list.innerHTML = `<p class="empty-msg">No se encontraron pedidos con esos filtros.</p>`;
    return;
  }
  list.innerHTML = orders.map(o => `
    <article class="admin-item" data-id="${o.id}">
      <div class="admin-item-img">📦</div>
      <div class="admin-item-body">
        <span class="product-cat">${o.product} · 📅 ${o.date || "—"}</span>
        <h4>${o.client} ${statusBadge(o.status || "pendiente")}</h4>
        <p>💰 ${o.price} · 🛵 ${o.delivery}</p>
        <p>📍 ${o.place}</p>
      </div>
    </article>
  `).join("");
}

function refreshGeneral() {
  renderStats();
  renderPendingToday();
  renderRegistry();
}

function setOrderStatus(id, status) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return;
  orders[idx].status = status;
  orders[idx].statusDate = todayISO();
  saveOrders(orders);
  renderOrders();
  refreshGeneral();
  setStatus("orderStatus", `✅ Pedido marcado como ${ORDER_STATUS[status]}.`);
}

/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

function loadConfigForm() {
  const cfg = getConfig();
  document.getElementById("cfgEnvioPrice").value = cfg.envioPrice || "";
  document.getElementById("cfgEnvioMin").value = cfg.envioMin || "";
  document.getElementById("cfgWhatsapp").value = cfg.whatsapp || "";
  document.getElementById("cfgAddress").value = cfg.address || "";
  document.getElementById("cfgBank").value = cfg.bank || "";
  document.getElementById("cfgHolder").value = cfg.holder || "";
  document.getElementById("cfgAccount").value = cfg.account || "";
  document.getElementById("cfgAliasType").value = cfg.aliasType || "";
  document.getElementById("cfgAlias").value = cfg.alias || "";
}

function handleEnvioSubmit(e) {
  e.preventDefault();
  const envioPrice = document.getElementById("cfgEnvioPrice").value.trim();
  const envioMin = document.getElementById("cfgEnvioMin").value.trim();
  const whatsapp = document.getElementById("cfgWhatsapp").value.trim();
  const address = document.getElementById("cfgAddress").value.trim();
  if (!envioPrice || !envioMin || !whatsapp || !address) {
    setStatus("envioStatus", "⚠️ Completa todos los campos.", false);
    return;
  }
  saveConfig({ ...getConfig(), envioPrice, envioMin, whatsapp, address });
  setStatus("envioStatus", "✅ Datos de envíos y pedidos guardados.");
}

function handleBankSubmit(e) {
  e.preventDefault();
  const bank = document.getElementById("cfgBank").value.trim();
  const holder = document.getElementById("cfgHolder").value.trim();
  const account = document.getElementById("cfgAccount").value.trim();
  const aliasType = document.getElementById("cfgAliasType").value;
  const alias = document.getElementById("cfgAlias").value.trim();
  if (!bank || !holder || !account || !aliasType || !alias) {
    setStatus("bankStatus", "⚠️ Completa todos los campos.", false);
    return;
  }
  saveConfig({ ...getConfig(), bank, holder, account, aliasType, alias });
  setStatus("bankStatus", "✅ Datos bancarios guardados.");
}

/* ============================================================
   TABS
   ============================================================ */

function switchTab(tab) {
  document.querySelectorAll(".admin-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".admin-panel").forEach(p => p.classList.toggle("active", p.id === `panel-${tab}`));
  if (tab === "general") refreshGeneral();
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

  // Pedidos
  document.getElementById("orderForm").addEventListener("submit", handleOrderSubmit);
  document.getElementById("oBtnCancel").addEventListener("click", resetOrderForm);
  document.getElementById("adminOrderList").addEventListener("click", (e) => {
    const editBtn = e.target.closest('[data-action="edit"]');
    const deleteBtn = e.target.closest('[data-action="delete"]');
    if (editBtn) { startEditOrder(Number(editBtn.dataset.id)); return; }
    if (deleteBtn) {
      const id = Number(deleteBtn.dataset.id);
      const order = getOrders().find(o => o.id === id);
      if (!confirm(`¿Seguro que quieres borrar el pedido de "${order ? order.client : "este cliente"}"?`)) return;
      saveOrders(getOrders().filter(o => o.id !== id));
renderOrders();
  refreshGeneral();
  loadConfigForm();
      setStatus("orderStatus", `✅ Pedido de "${order.client}" eliminado.`);
    }
  });

  // General
  document.getElementById("pendingTodayList").addEventListener("click", (e) => {
    const btn = e.target.closest('[data-action="marcar"]');
    if (!btn) return;
    setOrderStatus(Number(btn.dataset.id), btn.dataset.status);
  });
  document.getElementById("regFilterBtn").addEventListener("click", () => {
    regFilters = {
      from: document.getElementById("regFrom").value,
      to: document.getElementById("regTo").value,
      status: document.getElementById("regStatus").value
    };
    renderRegistry();
  });

  // Configuración
  document.getElementById("envioForm").addEventListener("submit", handleEnvioSubmit);
  document.getElementById("bankForm").addEventListener("submit", handleBankSubmit);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("year").textContent = new Date().getFullYear();
  renderProducts();
  renderPrices();
  renderTournaments();
  renderOrders();
  refreshGeneral();
  setupImageUpload("pImage", "uploadPreview", "uploadPlaceholder", "btnRemoveImage",
    () => prodUploadedImage, (v) => { prodUploadedImage = v; });
  setupImageUpload("tImage", "tourUploadPreview", "tourUploadPlaceholder", "btnRemoveTourImage",
    () => tourUploadedImage, (v) => { tourUploadedImage = v; });
  bindEvents();
});