// === КЛАС ГОЛОВНОГО ДОДАТКА OLX ===
class OlxApp {
  constructor() {
    this.storageKey = "olx_ads_v2";
    this.favStorageKey = "olx_favs_v2";
    this.ads = [];
    this.favorites = new Set();

    this.filters = {
      search: "",
      city: "",
      category: "",
      priceMin: null,
      priceMax: null,
      condition: "",
      olxDeliveryOnly: false,
      sortBy: "newest"
    };

    this.currentTab = "all"; // 'all' або 'favorites'
    this.currentDetailAd = null;
    this.adToDeleteId = null;
    this.uploadedImageBase64 = "";

    this.categories = [
      { name: "Всі категорії", icon: "✨" },
      { name: "Електроніка", icon: "💻" },
      { name: "Хобі та спорт", icon: "🚲" },
      { name: "Мода і стиль", icon: "👟" },
      { name: "Дім і сад", icon: "☕" },
      { name: "Авто", icon: "🚗" },
      { name: "Нерухомість", icon: "🏠" },
      { name: "Дитячий світ", icon: "🧸" },
      { name: "Тварини", icon: "🐾" }
    ];

    this.init();
  }

  init() {
    this.loadData();
    this.renderCategories();
    this.bindEvents();
    this.renderAds();
    this.updateFavCount();
  }

  // Завантаження з LocalStorage
  loadData() {
    const savedAds = localStorage.getItem(this.storageKey);
    if (savedAds) {
      try {
        this.ads = JSON.parse(savedAds);
      } catch (e) {
        this.ads = typeof INITIAL_ADS !== "undefined" ? [...INITIAL_ADS] : [];
      }
    } else {
      this.ads = typeof INITIAL_ADS !== "undefined" ? [...INITIAL_ADS] : [];
      this.saveAds();
    }

    const savedFavs = localStorage.getItem(this.favStorageKey);
    if (savedFavs) {
      try {
        this.favorites = new Set(JSON.parse(savedFavs));
      } catch (e) {
        this.favorites = new Set();
      }
    }
  }

  saveAds() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.ads));
  }

  saveFavorites() {
    localStorage.setItem(this.favStorageKey, JSON.stringify([...this.favorites]));
    this.updateFavCount();
  }

  // Прив'язка обробників подій
  bindEvents() {
    const searchInput = document.getElementById("searchInput");
    const btnClearSearch = document.getElementById("btnClearSearch");

    searchInput.addEventListener("input", (e) => {
      this.filters.search = e.target.value.trim();
      btnClearSearch.style.display = this.filters.search ? "block" : "none";
      this.renderAds();
    });

    btnClearSearch.addEventListener("click", () => {
      searchInput.value = "";
      this.filters.search = "";
      btnClearSearch.style.display = "none";
      this.renderAds();
    });

    document.getElementById("cityFilter").addEventListener("change", (e) => {
      this.filters.city = e.target.value;
      this.renderAds();
    });

    document.getElementById("priceMin").addEventListener("input", (e) => {
      this.filters.priceMin = e.target.value ? Number(e.target.value) : null;
      this.renderAds();
    });

    document.getElementById("priceMax").addEventListener("input", (e) => {
      this.filters.priceMax = e.target.value ? Number(e.target.value) : null;
      this.renderAds();
    });

    document.getElementById("conditionFilter").addEventListener("change", (e) => {
      this.filters.condition = e.target.value;
      this.renderAds();
    });

    document.getElementById("olxDeliveryOnly").addEventListener("change", (e) => {
      this.filters.olxDeliveryOnly = e.target.checked;
      this.renderAds();
    });

    document.getElementById("sortBy").addEventListener("change", (e) => {
      this.filters.sortBy = e.target.value;
      this.renderAds();
    });

    // Лічильник символів у заголовку
    const titleInput = document.getElementById("formTitle");
    const titleCounter = document.getElementById("titleCounter");
    titleInput.addEventListener("input", () => {
      titleCounter.textContent = titleInput.value.length;
    });

    // Підтвердження видалення
    document.getElementById("btnConfirmDeleteAction").addEventListener("click", () => {
      if (this.adToDeleteId) {
        this.deleteAd(this.adToDeleteId);
        this.closeModal("modalConfirmDelete");
        this.adToDeleteId = null;
      }
    });

    // Закриття модалок при кліку на backdrop
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove("show");
        }
      });
    });
  }

  // Рендер кнопок категорій
  renderCategories() {
    const container = document.getElementById("categoriesPills");
    if (!container) return;

    container.innerHTML = this.categories.map(cat => {
      const isAll = cat.name === "Всі категорії";
      const isActive = (!this.filters.category && isAll) || (this.filters.category === cat.name);
      return `
        <button class="cat-pill ${isActive ? 'active' : ''}" onclick="app.filterByCategory('${isAll ? '' : cat.name}')">
          <span>${cat.icon}</span> ${cat.name}
        </button>
      `;
    }).join("");
  }

  filterByCategory(catName) {
    this.filters.category = catName;
    this.renderCategories();
    this.renderAds();
  }

  toggleFavoritesTab() {
    const btn = document.getElementById("btnFavoritesTab");
    const title = document.getElementById("sectionTitle");

    if (this.currentTab === "favorites") {
      this.currentTab = "all";
      btn.classList.remove("btn-primary");
      title.textContent = "Останні оголошення";
    } else {
      this.currentTab = "favorites";
      btn.classList.add("btn-primary");
      title.textContent = "Обрані оголошення ❤️";
    }

    this.renderAds();
  }

  // Застосувати фільтри
  applyFilters() {
    this.renderAds();
  }

  resetAllFilters() {
    this.filters = {
      search: "",
      city: "",
      category: "",
      priceMin: null,
      priceMax: null,
      condition: "",
      olxDeliveryOnly: false,
      sortBy: "newest"
    };

    document.getElementById("searchInput").value = "";
    document.getElementById("btnClearSearch").style.display = "none";
    document.getElementById("cityFilter").value = "";
    document.getElementById("priceMin").value = "";
    document.getElementById("priceMax").value = "";
    document.getElementById("conditionFilter").value = "";
    document.getElementById("olxDeliveryOnly").checked = false;
    document.getElementById("sortBy").value = "newest";

    this.currentTab = "all";
    document.getElementById("btnFavoritesTab").classList.remove("btn-primary");
    document.getElementById("sectionTitle").textContent = "Останні оголошення";

    this.renderCategories();
    this.renderAds();
    this.showToast("Фільтри скинуто");
  }

  // Отримання відфільтрованих оголошень
  getFilteredAds() {
    let result = [...this.ads];

    if (this.currentTab === "favorites") {
      result = result.filter(ad => this.favorites.has(ad.id));
    }

    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      result = result.filter(ad => 
        ad.title.toLowerCase().includes(q) || 
        ad.description.toLowerCase().includes(q)
      );
    }

    if (this.filters.category) {
      result = result.filter(ad => ad.category === this.filters.category);
    }

    if (this.filters.city) {
      result = result.filter(ad => ad.city === this.filters.city);
    }

    if (this.filters.condition) {
      result = result.filter(ad => ad.condition === this.filters.condition);
    }

    if (this.filters.priceMin !== null) {
      result = result.filter(ad => ad.price >= this.filters.priceMin);
    }

    if (this.filters.priceMax !== null) {
      result = result.filter(ad => ad.price <= this.filters.priceMax);
    }

    if (this.filters.olxDeliveryOnly) {
      result = result.filter(ad => ad.deliveryOlx);
    }

    // Сортування
    if (this.filters.sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (this.filters.sortBy === "price_asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (this.filters.sortBy === "price_desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }

  // Рендер карток оголошень
  renderAds() {
    const list = this.getFilteredAds();
    const grid = document.getElementById("adsGrid");
    const emptyState = document.getElementById("emptyState");
    const resultsCount = document.getElementById("resultsCount");

    resultsCount.textContent = `Знайдено ${list.length} ${this.declensionAds(list.length)}`;

    if (list.length === 0) {
      grid.style.display = "none";
      emptyState.style.display = "block";
      return;
    }

    grid.style.display = "grid";
    emptyState.style.display = "none";

    grid.innerHTML = list.map(ad => {
      const isFav = this.favorites.has(ad.id);
      const formattedPrice = new Intl.NumberFormat("uk-UA").format(ad.price);
      const timeStr = this.formatDate(ad.createdAt);

      return `
        <div class="ad-card" onclick="app.showAdDetails('${ad.id}')">
          <div class="ad-card-img-wrap">
            <img class="ad-card-img" src="${ad.image || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600'}" alt="${this.escapeHtml(ad.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600'">
            <button class="btn-fav ${isFav ? 'active' : ''}" title="${isFav ? 'Видалити з обраних' : 'Додати в обрані'}" onclick="event.stopPropagation(); app.toggleFavorite('${ad.id}')">
              ${isFav ? '❤️' : '🤍'}
            </button>
            <span class="ad-badge-top">${ad.category}</span>
          </div>

          <div class="ad-card-body">
            <h3 class="ad-card-title">${this.escapeHtml(ad.title)}</h3>

            <div class="ad-card-price-row">
              <span class="ad-card-price">${formattedPrice} грн</span>
              ${ad.negotiable ? '<span class="ad-card-negotiable">Договірна</span>' : ''}
            </div>

            <div class="ad-card-badges">
              <span class="badge-tag">Стан: ${ad.condition}</span>
              ${ad.deliveryOlx ? '<span class="badge-tag badge-delivery">📦 OLX Доставка</span>' : ''}
            </div>

            <div class="ad-card-footer">
              <span>📍 ${ad.city}${ad.district ? ', ' + ad.district : ''}</span>
              <span>${timeStr}</span>
            </div>

            <div class="ad-card-actions" onclick="event.stopPropagation()">
              <button class="btn btn-outline" onclick="app.openEditModal('${ad.id}')">✏️ Редагувати</button>
              <button class="btn btn-danger-outline" onclick="app.confirmDeleteAd('${ad.id}')">🗑️ Видалити</button>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Детальний перегляд оголошення
  showAdDetails(id) {
    const ad = this.ads.find(item => item.id === id);
    if (!ad) return;

    this.currentDetailAd = ad;

    document.getElementById("detailCategory").textContent = ad.category;
    document.getElementById("detailTitle").textContent = ad.title;
    document.getElementById("detailPrice").textContent = `${new Intl.NumberFormat("uk-UA").format(ad.price)} грн`;
    document.getElementById("detailNegotiable").textContent = ad.negotiable ? "Можливий торг" : "Без торгу";
    document.getElementById("detailCondition").textContent = `Стан: ${ad.condition}`;
    document.getElementById("detailDateCity").textContent = `📍 ${ad.city}${ad.district ? ', ' + ad.district : ''} • Опубліковано ${this.formatDate(ad.createdAt)}`;

    document.getElementById("detailImage").src = ad.image || 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=600';
    document.getElementById("detailDescription").textContent = ad.description;
    document.getElementById("detailSellerName").textContent = ad.sellerName || "Продавець";

    // Скидання кнопки телефону
    const phoneDisplay = document.getElementById("phoneDisplay");
    phoneDisplay.textContent = "Показати телефон";
    document.getElementById("btnShowPhone").dataset.revealed = "false";

    // Доставка
    const deliveryList = document.getElementById("detailDeliveryList");
    deliveryList.innerHTML = `
      ${ad.deliveryOlx ? '<li>✅ <strong>OLX Доставка</strong> (безпечна оплата карткою через сайт)</li>' : ''}
      ${ad.deliveryNovaPoshta ? '<li>📦 <strong>Нова Пошта</strong> (накладений платіж або передоплата)</li>' : ''}
      ${ad.deliveryMeet ? '<li>🤝 <strong>Самовивіз</strong> / особиста зустріч у м. ' + ad.city + '</li>' : ''}
    `;

    this.openModal("modalAdDetails");
  }

  revealPhone() {
    const btn = document.getElementById("btnShowPhone");
    const phoneDisplay = document.getElementById("phoneDisplay");
    if (!this.currentDetailAd) return;

    if (btn.dataset.revealed === "true") {
      phoneDisplay.textContent = "Показати телефон";
      btn.dataset.revealed = "false";
    } else {
      phoneDisplay.textContent = this.currentDetailAd.phone || "+380 XX XXX XX XX";
      btn.dataset.revealed = "true";
    }
  }

  // Чат з продавцем
  openChatModal() {
    if (!this.currentDetailAd) return;
    document.getElementById("chatModalTitle").textContent = `Чат з: ${this.currentDetailAd.sellerName}`;
    const messagesBox = document.getElementById("chatMessages");
    messagesBox.innerHTML = `
      <div class="chat-bubble seller">
        Вітаю! Дякую за інтерес до «${this.currentDetailAd.title}». Напишіть ваше запитання або пропозицію, з радістю відповім!
      </div>
    `;
    this.openModal("modalChat");
  }

  sendChatMessage(e) {
    e.preventDefault();
    const input = document.getElementById("chatInput");
    const text = input.value.trim();
    if (!text) return;

    const messagesBox = document.getElementById("chatMessages");
    // Повідомлення покупця
    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user";
    userMsg.textContent = text;
    messagesBox.appendChild(userMsg);
    input.value = "";
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Автоматична реалістична відповідь продавця
    setTimeout(() => {
      const sellerMsg = document.createElement("div");
      sellerMsg.className = "chat-bubble seller";
      sellerMsg.textContent = "Дякую за повідомлення! Товар актуальний, можу відправити вже сьогодні або завтра вранці.";
      messagesBox.appendChild(sellerMsg);
      messagesBox.scrollTop = messagesBox.scrollHeight;
    }, 900);
  }

  // МОДАЛКА: СТВОРЕННЯ
  openCreateModal() {
    document.getElementById("formModalTitle").textContent = "Подати нове оголошення";
    document.getElementById("btnSubmitForm").textContent = "Опублікувати оголошення";
    document.getElementById("adForm").reset();
    document.getElementById("formAdId").value = "";
    document.getElementById("titleCounter").textContent = "0";
    this.clearFormImage();
    this.openModal("modalAdForm");
  }

  // АВТОЗАПОВНЕННЯ ФОРМИ КРЕАТИВНИМ ТОВАРОМ
  generateRandomAdForm() {
    if (typeof RANDOM_PRODUCTS_POOL === "undefined" || !RANDOM_PRODUCTS_POOL.length) return;
    const item = RANDOM_PRODUCTS_POOL[Math.floor(Math.random() * RANDOM_PRODUCTS_POOL.length)];

    document.getElementById("formTitle").value = item.title;
    document.getElementById("titleCounter").textContent = item.title.length;
    document.getElementById("formCategory").value = item.category;
    document.getElementById("formCondition").value = item.condition;
    document.getElementById("formPrice").value = item.price;
    document.getElementById("formNegotiable").checked = Boolean(item.negotiable);
    document.getElementById("formCity").value = item.city;
    document.getElementById("formDistrict").value = item.district || "";
    document.getElementById("formDescription").value = item.description;
    document.getElementById("formSellerName").value = item.sellerName;
    document.getElementById("formPhone").value = item.phone;

    document.getElementById("formDeliveryOlx").checked = Boolean(item.deliveryOlx);
    document.getElementById("formDeliveryNovaPoshta").checked = Boolean(item.deliveryNovaPoshta);
    document.getElementById("formDeliveryMeet").checked = Boolean(item.deliveryMeet);

    this.uploadedImageBase64 = "";
    document.getElementById("formPhotoUrl").value = item.image;
    this.setImagePreview(item.image);

    this.showToast("Форму заповнено придуманим товаром! ✨");
  }

  // ШВИДКЕ ДОДАВАННЯ ПРИДУМАНОГО ТОВАРУ БЕЗ ВІДКРИТТЯ ФОРМИ
  quickAddRandomAd() {
    if (typeof RANDOM_PRODUCTS_POOL === "undefined" || !RANDOM_PRODUCTS_POOL.length) return;
    const base = RANDOM_PRODUCTS_POOL[Math.floor(Math.random() * RANDOM_PRODUCTS_POOL.length)];

    const newAd = {
      ...base,
      id: "ad-" + Date.now(),
      createdAt: new Date().toISOString()
    };

    this.ads.unshift(newAd);
    this.saveAds();
    this.renderAds();
    this.showToast(`Додано: «${base.title.substring(0, 30)}...» 🎲🎉`);
  }

  // МОДАЛКА: РЕДАГУВАННЯ
  openEditModal(id) {
    const ad = this.ads.find(item => item.id === id);
    if (!ad) return;

    document.getElementById("formModalTitle").textContent = "Редагувати оголошення";
    document.getElementById("btnSubmitForm").textContent = "Зберегти зміни";
    document.getElementById("formAdId").value = ad.id;

    document.getElementById("formTitle").value = ad.title;
    document.getElementById("titleCounter").textContent = ad.title.length;
    document.getElementById("formCategory").value = ad.category;
    document.getElementById("formCondition").value = ad.condition;
    document.getElementById("formPrice").value = ad.price;
    document.getElementById("formNegotiable").checked = Boolean(ad.negotiable);
    document.getElementById("formCity").value = ad.city;
    document.getElementById("formDistrict").value = ad.district || "";
    document.getElementById("formDescription").value = ad.description;
    document.getElementById("formSellerName").value = ad.sellerName;
    document.getElementById("formPhone").value = ad.phone;

    document.getElementById("formDeliveryOlx").checked = Boolean(ad.deliveryOlx);
    document.getElementById("formDeliveryNovaPoshta").checked = Boolean(ad.deliveryNovaPoshta);
    document.getElementById("formDeliveryMeet").checked = Boolean(ad.deliveryMeet);

    this.uploadedImageBase64 = "";
    if (ad.image) {
      if (ad.image.startsWith("data:")) {
        this.uploadedImageBase64 = ad.image;
        this.setImagePreview(ad.image);
      } else {
        document.getElementById("formPhotoUrl").value = ad.image;
        this.setImagePreview(ad.image);
      }
    } else {
      this.clearFormImage();
    }

    this.openModal("modalAdForm");
  }

  editFromDetails() {
    if (!this.currentDetailAd) return;
    this.closeModal("modalAdDetails");
    this.openEditModal(this.currentDetailAd.id);
  }

  deleteFromDetails() {
    if (!this.currentDetailAd) return;
    const id = this.currentDetailAd.id;
    this.closeModal("modalAdDetails");
    this.confirmDeleteAd(id);
  }

  // Обробка фотографій
  handleImageFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImageBase64 = e.target.result;
      document.getElementById("formPhotoUrl").value = "";
      this.setImagePreview(this.uploadedImageBase64);
    };
    reader.readAsDataURL(file);
  }

  handleImageUrlInput() {
    const url = document.getElementById("formPhotoUrl").value.trim();
    if (url) {
      this.uploadedImageBase64 = "";
      this.setImagePreview(url);
    } else {
      this.clearFormImage();
    }
  }

  setImagePreview(src) {
    const container = document.getElementById("imagePreviewContainer");
    const img = document.getElementById("imagePreview");
    img.src = src;
    container.style.display = "inline-block";
  }

  clearFormImage() {
    this.uploadedImageBase64 = "";
    document.getElementById("formPhotoFile").value = "";
    document.getElementById("formPhotoUrl").value = "";
    document.getElementById("imagePreview").src = "";
    document.getElementById("imagePreviewContainer").style.display = "none";
  }

  // Сабміт форми (Створення / Оновлення)
  handleFormSubmit(e) {
    e.preventDefault();

    const adId = document.getElementById("formAdId").value;
    const title = document.getElementById("formTitle").value.trim();
    const category = document.getElementById("formCategory").value;
    const condition = document.getElementById("formCondition").value;
    const price = Number(document.getElementById("formPrice").value);
    const negotiable = document.getElementById("formNegotiable").checked;
    const city = document.getElementById("formCity").value;
    const district = document.getElementById("formDistrict").value.trim();
    const description = document.getElementById("formDescription").value.trim();
    const sellerName = document.getElementById("formSellerName").value.trim();
    const phone = document.getElementById("formPhone").value.trim();
    const deliveryOlx = document.getElementById("formDeliveryOlx").checked;
    const deliveryNovaPoshta = document.getElementById("formDeliveryNovaPoshta").checked;
    const deliveryMeet = document.getElementById("formDeliveryMeet").checked;

    let image = this.uploadedImageBase64 || document.getElementById("formPhotoUrl").value.trim();
    if (!image) {
      image = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80";
    }

    if (adId) {
      // Оновлення існуючого оголошення
      const index = this.ads.findIndex(a => a.id === adId);
      if (index !== -1) {
        this.ads[index] = {
          ...this.ads[index],
          title,
          category,
          condition,
          price,
          negotiable,
          city,
          district,
          description,
          sellerName,
          phone,
          deliveryOlx,
          deliveryNovaPoshta,
          deliveryMeet,
          image
        };
        this.saveAds();
        this.renderAds();
        this.closeModal("modalAdForm");
        this.showToast("Оголошення успішно оновлено! ✅");
      }
    } else {
      // Створення нового оголошення
      const newAd = {
        id: "ad-" + Date.now(),
        title,
        category,
        condition,
        price,
        negotiable,
        city,
        district,
        description,
        sellerName,
        phone,
        deliveryOlx,
        deliveryNovaPoshta,
        deliveryMeet,
        image,
        createdAt: new Date().toISOString()
      };

      this.ads.unshift(newAd);
      this.saveAds();
      this.renderAds();
      this.closeModal("modalAdForm");
      this.showToast("Оголошення опубліковано! 🎉");
    }
  }

  // Видалення
  confirmDeleteAd(id) {
    this.adToDeleteId = id;
    this.openModal("modalConfirmDelete");
  }

  deleteAd(id) {
    this.ads = this.ads.filter(a => a.id !== id);
    this.favorites.delete(id);
    this.saveAds();
    this.saveFavorites();
    this.renderAds();
    this.showToast("Оголошення видалено 🗑️");
  }

  // Обрані (Favorites)
  toggleFavorite(id) {
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
      this.showToast("Видалено з обраних");
    } else {
      this.favorites.add(id);
      this.showToast("Додано в обрані ❤️");
    }
    this.saveFavorites();
    this.renderAds();
  }

  updateFavCount() {
    const el = document.getElementById("favCount");
    if (el) {
      el.textContent = this.favorites.size;
    }
  }

  // Відновлення демо-даних
  restoreSampleData() {
    if (confirm("Відновити всі стандартні оголошення? Поточні зміни будуть скинуті.")) {
      this.ads = typeof INITIAL_ADS !== "undefined" ? [...INITIAL_ADS] : [];
      this.favorites.clear();
      this.saveAds();
      this.saveFavorites();
      this.resetAllFilters();
      this.showToast("Дані успішно відновлено!");
    }
  }

  // Модальні вікна допоміжні
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove("show");
      document.body.style.overflow = "";
    }
  }

  // Повідомлення Toast
  showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // Допоміжні методи
  formatDate(isoStr) {
    if (!isoStr) return "";
    const date = new Date(isoStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" });
    if (isToday) {
      return `Сьогодні о ${time}`;
    }
    return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" }) + ` о ${time}`;
  }

  declensionAds(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 19) return "оголошень";
    if (mod10 === 1) return "оголошення";
    if (mod10 >= 2 && mod10 <= 4) return "оголошення";
    return "оголошень";
  }

  escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Ініціалізація додатку при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
  window.app = new OlxApp();
});
