// ==========================================
// 0. SECURITY & ENCRYPTION HELPERS
// ==========================================

function sanitizeInput(text) {
    if (typeof text !== 'string') return text;
    return text
        .replace(/<[^>]*>/g, '') // Strip HTML tags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

function encryptData(plainText) {
    try {
        const key = 'KopiKitaAman2026';
        let cipherText = '';
        for (let i = 0; i < plainText.length; i++) {
            const charCode = plainText.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            cipherText += String.fromCharCode(charCode);
        }
        return btoa(unescape(encodeURIComponent(cipherText)));
    } catch (e) {
        console.error("Encryption error:", e);
        return plainText;
    }
}

function decryptData(encryptedText) {
    if (!encryptedText) return null;
    const trimmed = encryptedText.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        // Plain text JSON fallback (Self-healing)
        return encryptedText;
    }
    try {
        const decoded = decodeURIComponent(escape(atob(trimmed)));
        const key = 'KopiKitaAman2026';
        let plainText = '';
        for (let i = 0; i < decoded.length; i++) {
            const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            plainText += String.fromCharCode(charCode);
        }
        return plainText;
    } catch (e) {
        console.error("Decryption error, falling back:", e);
        return encryptedText;
    }
}

function loadOrderHistory() {
    try {
        const data = localStorage.getItem('kopi_kita_order_history');
        if (!data) return null;
        const decrypted = decryptData(data);
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Gagal memuat riwayat pesanan:", e);
        return null;
    }
}

function saveOrderHistory() {
    try {
        const plainStr = JSON.stringify(STATE.orderHistory);
        const encryptedStr = encryptData(plainStr);
        localStorage.setItem('kopi_kita_order_history', encryptedStr);
    } catch (e) {
        console.error("Gagal menyimpan riwayat pesanan:", e);
    }
}

// Settings storage & sync
function loadSettings() {
    try {
        const data = localStorage.getItem('kopi_kita_settings');
        if (!data) return { shopName: "Kopi Kita", qrisImage: null, adminPin: "9999", cashierPin: "1234" };
        const decrypted = decryptData(data);
        const settings = JSON.parse(decrypted);
        if (!settings.adminPin) settings.adminPin = "9999";
        if (!settings.cashierPin) settings.cashierPin = "1234";
        return settings;
    } catch (e) {
        console.error("Gagal memuat pengaturan toko:", e);
        return { shopName: "Kopi Kita", qrisImage: null, adminPin: "9999", cashierPin: "1234" };
    }
}

function saveSettings() {
    try {
        const plainStr = JSON.stringify({
            shopName: STATE.shopName,
            qrisImage: STATE.qrisImage,
            adminPin: STATE.adminPin || "9999",
            cashierPin: STATE.cashierPin || "1234"
        });
        const encryptedStr = encryptData(plainStr);
        localStorage.setItem('kopi_kita_settings', encryptedStr);
    } catch (e) {
        console.error("Gagal menyimpan pengaturan toko:", e);
    }
}

function applySettings() {
    const shopName = STATE.shopName || "Kopi Kita";
    
    // 1. Update logo texts
    const logoTexts = document.querySelectorAll('.logo-text');
    logoTexts.forEach(el => {
        el.innerHTML = `KOPI <span>${shopName.replace('Kopi', '').replace('KOPI', '').trim() || 'KITA'}</span>`;
    });
    
    // Welcome text
    const welcomeText = document.getElementById('welcome-text');
    if (welcomeText) {
        welcomeText.innerHTML = `Selamat Datang di ${shopName}!<br>Waktunya Kopi Sore ☕`;
    }
    
    // Receipt name fills
    const receiptFills = document.querySelectorAll('.receipt-shop-name-fill');
    receiptFills.forEach(el => {
        el.textContent = shopName;
    });
    const receiptShopName = document.getElementById('receipt-shop-name');
    if (receiptShopName) receiptShopName.textContent = shopName.toUpperCase();
    
    // Document Title
    document.title = `${shopName} - Premium Coffee Ordering Web App`;
    
    // Update QRIS Code in client checkout
    const qrisContainer = document.getElementById('qris-qr-code-container');
    if (qrisContainer) {
        if (STATE.qrisImage) {
            qrisContainer.innerHTML = `<img src="${STATE.qrisImage}" alt="Custom QRIS" style="max-width: 100%; height: auto; display: block; border-radius: 8px; margin: 0 auto;">`;
        } else {
            // Restore default vector SVG
            qrisContainer.innerHTML = `
                <svg class="qris-qr-svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="10" y="10" width="80" height="80" rx="8" fill="white" stroke="#332115" stroke-width="3"/>
                    <rect x="22" y="22" width="20" height="20" fill="#332115"/>
                    <rect x="58" y="22" width="20" height="20" fill="#332115"/>
                    <rect x="22" y="58" width="20" height="20" fill="#332115"/>
                    <rect x="58" y="58" width="20" height="20" fill="#332115"/>
                    <!-- QR details patterns -->
                    <rect x="46" y="22" width="6" height="6" fill="#332115"/>
                    <rect x="46" y="34" width="6" height="6" fill="#332115"/>
                    <rect x="22" y="46" width="6" height="6" fill="#332115"/>
                    <rect x="34" y="46" width="6" height="6" fill="#332115"/>
                    <rect x="46" y="46" width="12" height="12" fill="#332115"/>
                    <rect x="58" y="46" width="6" height="6" fill="#332115"/>
                    <rect x="46" y="58" width="6" height="12" fill="#332115"/>
                    <rect x="46" y="72" width="6" height="6" fill="#332115"/>
                    <rect x="72" y="46" width="6" height="6" fill="#332115"/>
                </svg>`;
        }
    }
    
    // Update Settings UI fields if active
    const shopNameInp = document.getElementById('settings-shop-name');
    if (shopNameInp) shopNameInp.value = shopName;
    
    const cashierPinInp = document.getElementById('settings-cashier-pin');
    if (cashierPinInp) cashierPinInp.value = STATE.cashierPin || "1234";
    
    const adminPinInp = document.getElementById('settings-admin-pin');
    if (adminPinInp) adminPinInp.value = STATE.adminPin || "9999";
    
    const filenameEl = document.getElementById('settings-qris-filename');
    const resetBtn = document.getElementById('btn-reset-qris');
    const previewContainer = document.getElementById('settings-qris-preview-container');
    
    if (previewContainer) {
        if (STATE.qrisImage) {
            previewContainer.innerHTML = `<img src="${STATE.qrisImage}" alt="QRIS Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
            if (filenameEl) filenameEl.textContent = "Kustom (Tersimpan)";
            if (resetBtn) resetBtn.style.display = "inline-block";
        } else {
            previewContainer.innerHTML = `<span style="font-size: 10px; color: #8A7365; font-weight: 700; text-align: center;">Sistem SVG</span>`;
            if (filenameEl) filenameEl.textContent = "Bawaan (SVG Sistem)";
            if (resetBtn) resetBtn.style.display = "none";
        }
    }
}

// ==========================================
// 1. DATA STATE & CONFIGURATION
// ==========================================

const INITIAL_SETTINGS = loadSettings();

const STATE = {
    currentUser: null,
    currentTab: 'beranda',
    currentCategory: 'Semua',
    searchQuery: '',
    cart: [],
    promoSlideIndex: 0,
    activeModalProduct: null,
    modalQty: 1,
    modalSelectedSize: 'Medium',
    modalSelectedIce: 'Normal',
    paymentMethod: 'qris',
    isBaristaMode: false,
    kdsActiveTab: 'active',
    activeBarista: 'Kasir Utama',
    currentPaymentProofBase64: null,
    shopName: INITIAL_SETTINGS.shopName || "Kopi Kita",
    qrisImage: INITIAL_SETTINGS.qrisImage || null,
    adminPin: INITIAL_SETTINGS.adminPin || "9999",
    cashierPin: INITIAL_SETTINGS.cashierPin || "1234",
    orderHistory: loadOrderHistory() || [
        {
            id: '#KK-2831',
            customerName: 'Sarah Melody',
            date: 'Kemarin, 14:25',
            items: [
                { name: 'Es Kopi Susu Aren', qty: 1, size: 'Medium', ice: 'Normal', price: 25000 }
            ],
            subtotal: 25000,
            serviceFee: 0,
            discount: 0,
            total: 25000,
            status: 'Selesai',
            paymentMethod: 'QRIS'
        }
    ]
};

// Premium Menu Products (Matching mockups and generated assets)
const DEFAULT_PRODUCTS = [
    {
        id: 'p1',
        name: 'Es Kopi Susu Aren',
        basePrice: 25000,
        costPrice: 10000,
        rating: 4.9,
        reviewsCount: 110,
        category: 'Es Kopi',
        image: 'assets/es_kopi_susu.png',
        desc: 'Espresso robusta pilihan berkualitas tinggi dipadukan dengan susu segar yang gurih dan pemanis alami dari gula aren cair murni. Memberikan kenikmatan manis-lembut yang pas untuk sore hari Anda.'
    },
    {
        id: 'p2',
        name: 'Brown Sugar Boba',
        basePrice: 32000,
        costPrice: 12000,
        rating: 4.8,
        reviewsCount: 95,
        category: 'Non-Kopi',
        image: 'assets/brown_sugar.png',
        desc: 'Boba kenyal manis dimasak perlahan dalam sirup gula merah karamel premium, disajikan dengan susu cair segar dingin yang super creamy. Cita rasa manis gurih yang memanjakan lidah!'
    },
    {
        id: 'p3',
        name: 'Iced Caramel Macchiato',
        basePrice: 30000,
        costPrice: 12000,
        rating: 4.7,
        reviewsCount: 80,
        category: 'Es Kopi',
        image: 'assets/iced_caramel.png',
        desc: 'Kombinasi klasik espresso shot yang kaya rasa dengan susu dingin lembut, sirup vanilla wangi, dan sirup karamel emas tebal di atasnya. Keseimbangan rasa manis pahit yang luar biasa.'
    },
    {
        id: 'p4',
        name: 'Hot Cappuccino',
        basePrice: 28000,
        costPrice: 11000,
        rating: 4.9,
        reviewsCount: 120,
        category: 'Kopi Panas',
        image: 'assets/cappuccino.png',
        desc: 'Espresso premium racikan barista profesional dengan susu kukus berbusa mikro (microfoam) yang lembut berpola seni daun yang cantik. Nikmat diseruput hangat di kala sore.'
    },
    {
        id: 'p5',
        name: 'Matcha Frappe',
        basePrice: 29000,
        costPrice: 11000,
        rating: 4.8,
        reviewsCount: 75,
        category: 'Non-Kopi',
        image: 'assets/matcha_frappe.png',
        desc: 'Es krim blender creamy yang terbuat dari bubuk teh hijau Uji Matcha asli Jepang berpadu dengan susu premium segar, ditaburi whipped cream tebal yang manis di atasnya.'
    },
    {
        id: 'p6',
        name: 'Croissant Mentega',
        basePrice: 22000,
        costPrice: 8000,
        rating: 4.7,
        reviewsCount: 60,
        category: 'Camilan',
        image: 'assets/croissant.png',
        desc: 'Camilan pendamping kopi terbaik. Croissant mentega khas Prancis yang dipanggang segar setiap pagi dengan lapisan luar garing beremah yang gurih bermentega.'
    },
    {
        id: 'p7',
        name: 'Americano Ice',
        basePrice: 20000,
        costPrice: 8000,
        rating: 4.6,
        reviewsCount: 45,
        category: 'Es Kopi',
        image: 'assets/iced_caramel.png',
        desc: 'Double shot espresso dari biji kopi arabika pilihan yang dilarutkan air dingin segar dan disajikan di atas es batu melimpah. Bersih, menyegarkan, dan rendah kalori.'
    }
];

function loadProducts() {
    try {
        const data = localStorage.getItem('kopi_kita_products_list');
        if (!data) return null;
        const decrypted = decryptData(data);
        return JSON.parse(decrypted);
    } catch (e) {
        console.error("Gagal memuat produk:", e);
        return null;
    }
}

function saveProducts() {
    try {
        const plainStr = JSON.stringify(PRODUCTS);
        const encryptedStr = encryptData(plainStr);
        localStorage.setItem('kopi_kita_products_list', encryptedStr);
    } catch (e) {
        console.error("Gagal menyimpan produk:", e);
    }
}

let PRODUCTS = loadProducts() || DEFAULT_PRODUCTS;

// Self-healing: Ensure every product has costPrice property
PRODUCTS.forEach(p => {
    if (typeof p.costPrice !== 'number') {
        const dp = DEFAULT_PRODUCTS.find(d => d.id === p.id);
        p.costPrice = dp ? dp.costPrice : Math.floor(p.basePrice * 0.4);
    }
});

// Sync database initially
if (!localStorage.getItem('kopi_kita_products_list')) {
    saveProducts();
}

const CATEGORIES = ['Semua', 'Es Kopi', 'Kopi Panas', 'Non-Kopi', 'Camilan'];

// ==========================================
// 2. APP INITIALIZATION & UTILITIES
// ==========================================

// Validate, migrate and repair order history to prevent crashes from older/corrupted formats
function sanitizeOrderHistory() {
    if (!STATE.orderHistory || !Array.isArray(STATE.orderHistory)) {
        STATE.orderHistory = [];
        return;
    }
    
    STATE.orderHistory = STATE.orderHistory.filter(order => {
        if (!order || typeof order !== 'object') return false;
        
        // Repair ID
        if (!order.id || typeof order.id !== 'string') {
            order.id = `#KK-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        
        // Repair Customer Name
        if (!order.customerName || typeof order.customerName !== 'string') {
            order.customerName = 'Pelanggan';
        } else {
            order.customerName = sanitizeInput(order.customerName);
        }
        
        // Repair Date
        if (!order.date || typeof order.date !== 'string') {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            order.date = `Hari Ini, ${timeString}`;
        }
        
        // Repair Items
        if (!order.items || !Array.isArray(order.items)) {
            order.items = [];
        }
        
        order.items = order.items.filter(it => it && typeof it === 'object');
        order.items.forEach(it => {
            if (!it.name || typeof it.name !== 'string') it.name = 'Menu Premium';
            if (typeof it.qty !== 'number') it.qty = parseInt(it.qty) || 1;
            if (!it.size || typeof it.size !== 'string') it.size = 'Medium';
            if (!it.ice || typeof it.ice !== 'string') it.ice = 'Normal';
            if (typeof it.price !== 'number') it.price = parseInt(it.price) || 0;
            if (typeof it.cost !== 'number') {
                const p = PRODUCTS.find(prod => prod.name === it.name);
                it.cost = p ? p.costPrice : Math.floor(it.price * 0.4);
            }
        });
        
        // Repair Numeric Fields
        order.subtotal = typeof order.subtotal === 'number' ? order.subtotal : 0;
        order.serviceFee = typeof order.serviceFee === 'number' ? order.serviceFee : 0;
        order.discount = typeof order.discount === 'number' ? order.discount : 0;
        order.total = typeof order.total === 'number' ? order.total : (order.subtotal + order.serviceFee - order.discount);
        
        // Repair Status
        if (!order.status || typeof order.status !== 'string') {
            order.status = 'Sedang Disiapkan';
        }
        
        // Repair Payment Method
        if (!order.paymentMethod || typeof order.paymentMethod !== 'string') {
            order.paymentMethod = 'QRIS';
        }
        
        // Repair Timestamp for calendar queries
        if (typeof order.timestamp !== 'number') {
            if (order.date && order.date.includes('Hari Ini')) {
                order.timestamp = Date.now();
            } else if (order.date && order.date.includes('Kemarin')) {
                order.timestamp = Date.now() - 24 * 60 * 60 * 1000;
            } else {
                const parsed = Date.parse(order.date);
                order.timestamp = isNaN(parsed) ? (Date.now() - 48 * 60 * 60 * 1000) : parsed;
            }
        }
        
        return true;
    });
    
    saveOrderHistory();
}

// Check and automatically reset session, cart, next order sequential number and order logs if it is a new day
function checkDailyReset() {
    try {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const lastAccessDate = localStorage.getItem('kopi_kita_last_access_date');
        
        if (lastAccessDate && lastAccessDate !== todayStr) {
            // New day detected! Reset session and data
            STATE.cart = [];
            updateCartBadge();
            
            // Reset sequential order number back to 2832
            localStorage.setItem('kopi_kita_next_order_number', '2832');
            
            // Set order history to a clean today-dated starter order
            const timeString = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;
            STATE.orderHistory = [
                {
                    id: '#KK-2831',
                    customerName: 'Sarah Melody',
                    date: `Hari Ini, ${timeString}`,
                    items: [
                        { name: 'Es Kopi Susu Aren', qty: 1, size: 'Medium', ice: 'Normal', price: 25000 }
                    ],
                    subtotal: 25000,
                    serviceFee: 0,
                    discount: 0,
                    total: 25000,
                    status: 'Selesai',
                    paymentMethod: 'QRIS'
                }
            ];
            
            // Save encrypted clean starter state
            saveOrderHistory();
            
            // Wait slightly for DOM to settle, then show Toast and switch to home
            setTimeout(() => {
                showToast("Sesi Anda telah direset otomatis untuk hari baru. Selamat menikmati kopi! ☕", "info");
                switchTab('beranda');
            }, 500);
        }
        
        // Save today's date as last access date
        localStorage.setItem('kopi_kita_last_access_date', todayStr);
    } catch (e) {
        console.error("Gagal melakukan pengecekan reset harian:", e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    applySettings();
    checkDailyReset();
    sanitizeOrderHistory();
    initClock();
    initPromoSlider();
    initEventListeners();
    renderCategoryTabs();
    renderProductsGrid();
    renderFeaturedPicks();
});

// Update Phone status bar time automatically
function initClock() {
    const timeEl = document.getElementById('phone-time');
    const updateTime = () => {
        const now = new Date();
        let hours = now.getHours().toString().padStart(2, '0');
        let minutes = now.getMinutes().toString().padStart(2, '0');
        timeEl.textContent = `${hours}:${minutes}`;
    };
    updateTime();
    setInterval(updateTime, 60000);
}

// Show custom toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const toastText = document.getElementById('toast-text');
    if (!toast || !toastText) {
        console.warn("Toast elements not found in DOM:", message);
        return;
    }
    toastText.textContent = message;
    
    // Set custom icon based on type
    const iconSvg = toast.querySelector('svg');
    if (iconSvg) {
        if (type === 'success') {
            iconSvg.innerHTML = '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>';
            iconSvg.style.fill = '#2ECC71';
        } else {
            iconSvg.innerHTML = '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>';
            iconSvg.style.fill = '#E74C3C';
        }
    }
    
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 2500);
}

// ==========================================
// 3. TAB NAVIGATION & VIEW MANAGEMENT
// ==========================================

function switchTab(tabId) {
    // Set active tab marker for responsive layout
    const screenWrapper = document.querySelector('.screen-wrapper');
    if (screenWrapper) screenWrapper.setAttribute('data-active-tab', tabId);
    
    // Remove active state from all screens & nav icons
    const screens = ['home', 'menu', 'orders', 'account'];
    screens.forEach(s => {
        const el = document.getElementById(`screen-${s}`);
        if (el) el.classList.remove('active');
    });
    
    const navItems = ['beranda', 'menu', 'pesanan', 'akun'];
    navItems.forEach(n => {
        const el = document.getElementById(`nav-${n}`);
        if (el) el.classList.remove('active');
    });
    
    // Also sync desktop nav active classes
    document.querySelectorAll('.desktop-nav-link').forEach(link => {
        if (link.getAttribute('data-tab') === tabId) {
            link.classList.add('active');
        } else if (tabId === 'beranda' && link.getAttribute('data-tab') === 'beranda') {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Set new active tab state
    STATE.currentTab = tabId;
    
    if (tabId === 'beranda') {
        const homeScreen = document.getElementById('screen-home');
        if (homeScreen) homeScreen.classList.add('active');
        const navBeranda = document.getElementById('nav-beranda');
        if (navBeranda) navBeranda.classList.add('active');
        // Reset category to Semua on home click
        filterCategory('Semua');
    } else if (tabId === 'menu') {
        const menuScreen = document.getElementById('screen-menu');
        if (menuScreen) menuScreen.classList.add('active');
        const navMenu = document.getElementById('nav-menu');
        if (navMenu) navMenu.classList.add('active');
        
        // Search container is permanently block in menu tab, but let's make sure
        const searchBox = document.getElementById('search-box');
        if (searchBox) searchBox.style.display = 'block';
        
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.focus();
    } else if (tabId === 'pesanan') {
        const ordersScreen = document.getElementById('screen-orders');
        if (ordersScreen) ordersScreen.classList.add('active');
        const navPesanan = document.getElementById('nav-pesanan');
        if (navPesanan) navPesanan.classList.add('active');
        renderCartView();
    } else if (tabId === 'akun') {
        const accountScreen = document.getElementById('screen-account');
        if (accountScreen) accountScreen.classList.add('active');
        const navAkun = document.getElementById('nav-akun');
        if (navAkun) navAkun.classList.add('active');
        renderOrderHistory();
    }
}

// ==========================================
// 5. PROMO SLIDER MODULE
// ==========================================

let promoInterval;

function initPromoSlider() {
    const slides = document.getElementById('promo-slides');
    const dots = document.querySelectorAll('.slider-dot');
    
    const startAutoplay = () => {
        promoInterval = setInterval(() => {
            let nextSlide = (STATE.promoSlideIndex + 1) % 3;
            goToSlide(nextSlide);
        }, 5000);
    };
    
    window.goToSlide = (index) => {
        STATE.promoSlideIndex = index;
        slides.style.transform = `translateX(-${index * 100}%)`;
        
        dots.forEach((dot, idx) => {
            if (idx === index) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    };
    
    // Reset autoplay timer when manually clicked
    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            clearInterval(promoInterval);
            goToSlide(idx);
            startAutoplay();
        });
    });
    
    startAutoplay();
}

// ==========================================
// 6. CATEGORIES & PRODUCTS RENDERER
// ==========================================

function renderCategoryTabs() {
    const container = document.getElementById('category-tabs-row');
    container.innerHTML = '';
    
    CATEGORIES.forEach(cat => {
        const tab = document.createElement('button');
        tab.className = `category-tab ${STATE.currentCategory === cat ? 'active' : ''}`;
        tab.textContent = cat;
        tab.setAttribute('onclick', `filterCategory('${cat}')`);
        container.appendChild(tab);
    });
}

function filterCategory(categoryName) {
    STATE.currentCategory = categoryName;
    renderCategoryTabs();
    renderProductsGrid();
}

function renderProductsGrid() {
    const container = document.getElementById('products-grid-container');
    const emptyState = document.getElementById('search-empty-state');
    container.innerHTML = '';
    
    // Apply category & search query filters
    const filteredProducts = PRODUCTS.filter(prod => {
        const matchCategory = STATE.currentCategory === 'Semua' || prod.category === STATE.currentCategory;
        const matchQuery = prod.name.toLowerCase().includes(STATE.searchQuery.toLowerCase()) ||
                           prod.category.toLowerCase().includes(STATE.searchQuery.toLowerCase());
        return matchCategory && matchQuery;
    });
    
    if (filteredProducts.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    container.style.display = 'grid';
    emptyState.style.display = 'none';
    
    filteredProducts.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-wrapper" onclick="openProductDetail('${prod.id}')">
                <img src="${prod.image}" alt="${prod.name}" class="product-img">
                <div class="product-rating">
                    <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    <span>${prod.rating}</span>
                </div>
            </div>
            <div class="product-info" onclick="openProductDetail('${prod.id}')">
                <h3 class="product-name">${prod.name}</h3>
                <span class="product-reviews">Rp ${prod.basePrice / 1000}k | ${prod.reviewsCount} ulasan</span>
            </div>
            <div class="product-footer">
                <span class="product-price">Rp ${(prod.basePrice).toLocaleString('id-ID')}</span>
                <button class="add-cart-btn" onclick="quickAddCart('${prod.id}', event)">
                    <svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render signature/best sellers dynamically on Home/Beranda Screen
function renderFeaturedPicks() {
    const container = document.getElementById('featured-picks-container');
    if (!container) return;
    container.innerHTML = '';
    
    // We target p1, p4, p6 as our featured picks
    const targetIds = ['p1', 'p4', 'p6'];
    const featuredItems = [];
    
    targetIds.forEach(id => {
        const prod = PRODUCTS.find(p => p.id === id);
        if (prod) {
            featuredItems.push({
                product: prod,
                tag: id === 'p1' ? 'Bestseller 🔥' : (id === 'p4' ? 'Barista Pick ⭐' : 'Snack Favorit 🥐')
            });
        }
    });
    
    // If some target items are missing (e.g. deleted by admin), backfill with other available items
    if (featuredItems.length < 3) {
        const fallbackTags = ['Rekomendasi 🔥', 'Pilihan Kami ⭐', 'Terlaris 🥐'];
        let tagIndex = 0;
        PRODUCTS.forEach(prod => {
            if (featuredItems.length >= 3) return;
            if (!featuredItems.some(item => item.product.id === prod.id)) {
                featuredItems.push({
                    product: prod,
                    tag: fallbackTags[tagIndex % fallbackTags.length]
                });
                tagIndex++;
            }
        });
    }
    
    featuredItems.forEach(item => {
        const prod = item.product;
        const tag = item.tag;
        
        // Sliced description for the short overview
        let shortDesc = prod.desc || '';
        if (shortDesc.length > 85) {
            shortDesc = shortDesc.slice(0, 82) + '...';
        }
        
        const card = document.createElement('div');
        card.className = 'featured-pick-card';
        card.setAttribute('onclick', `openProductDetail('${prod.id}')`);
        
        card.innerHTML = `
            <div class="pick-img-wrapper">
                <span class="pick-tag">${tag}</span>
                <img src="${prod.image}" alt="${prod.name}">
            </div>
            <div class="pick-details">
                <h4>${prod.name}</h4>
                <div class="pick-rating-price">
                    <div class="pick-rating">
                        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                        <span>${prod.rating}</span>
                    </div>
                    <span class="pick-price">Rp ${(prod.basePrice).toLocaleString('id-ID')}</span>
                </div>
                <p class="pick-desc-short">${shortDesc}</p>
                <button class="pick-order-btn" onclick="quickAddCart('${prod.id}', event)">Pesan Cepat</button>
            </div>
        `;
        container.appendChild(card);
    });
}

// ==========================================
// 7. PRODUCT DETAIL MODAL MODULE
// ==========================================

function openProductDetail(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    STATE.activeModalProduct = product;
    STATE.modalQty = 1;
    STATE.modalSelectedSize = 'Medium';
    STATE.modalSelectedIce = 'Normal';
    
    // Set UI contents
    document.getElementById('modal-product-name').textContent = product.name;
    document.getElementById('modal-product-img').src = product.image;
    document.getElementById('modal-product-rating').textContent = product.rating;
    document.getElementById('modal-product-desc').textContent = product.desc;
    
    // Toggle Ice option depending on whether product is warm or cold
    const iceContainer = document.getElementById('ice-option-container');
    if (product.category === 'Kopi Panas' || product.category === 'Camilan') {
        iceContainer.style.display = 'none';
        STATE.modalSelectedIce = 'None';
    } else {
        iceContainer.style.display = 'block';
    }
    
    // Reset option active states
    document.querySelectorAll('#option-sizes .option-chip').forEach(chip => {
        if (chip.getAttribute('data-value') === 'Medium') chip.classList.add('active');
        else chip.classList.remove('active');
    });
    
    document.querySelectorAll('#option-ice .option-chip').forEach(chip => {
        if (chip.getAttribute('data-value') === 'Normal') chip.classList.add('active');
        else chip.classList.remove('active');
    });
    
    updateModalPrice();
    
    // Slide Open Modal
    document.getElementById('product-detail-modal').classList.add('active');
}

function closeProductDetail() {
    document.getElementById('product-detail-modal').classList.remove('active');
    STATE.activeModalProduct = null;
}

function updateModalPrice() {
    if (!STATE.activeModalProduct) return;
    
    let base = STATE.activeModalProduct.basePrice;
    
    // Premium charge for Large size
    if (STATE.modalSelectedSize.includes('Large')) {
        base += 5000;
    }
    
    const totalPrice = base * STATE.modalQty;
    document.getElementById('modal-qty-number').textContent = STATE.modalQty;
    document.getElementById('modal-price-display').textContent = `Rp ${totalPrice.toLocaleString('id-ID')}`;
}

// Add directly from plus (+) dashboard button
function quickAddCart(productId, event) {
    event.stopPropagation(); // prevent card click details
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const isHot = product.category === 'Kopi Panas' || product.category === 'Camilan';
    
    addToCart({
        id: product.id,
        name: product.name,
        image: product.image,
        basePrice: product.basePrice,
        size: 'Medium',
        ice: isHot ? 'None' : 'Normal',
        qty: 1,
        finalPrice: product.basePrice
    });
    
    showToast(`1 ${product.name} dimasukkan ke keranjang.`);
}

function addToCart(cartItem) {
    // Check if duplicate item exists (matching options)
    const duplicate = STATE.cart.find(item => 
        item.id === cartItem.id && 
        item.size === cartItem.size && 
        item.ice === cartItem.ice
    );
    
    if (duplicate) {
        duplicate.qty += cartItem.qty;
    } else {
        STATE.cart.push(cartItem);
    }
    
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    const totalQty = STATE.cart.reduce((sum, item) => sum + item.qty, 0);
    
    if (totalQty > 0) {
        badge.textContent = totalQty;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ==========================================
// 8. CART & ORDERS SYSTEM MANAGEMENT
// ==========================================

function renderCartView() {
    const emptyView = document.getElementById('empty-cart-view');
    const populatedView = document.getElementById('populated-cart-view');
    const itemsContainer = document.getElementById('cart-items-container');
    
    if (STATE.cart.length === 0) {
        emptyView.style.display = 'flex';
        populatedView.style.display = 'none';
        return;
    }
    
    emptyView.style.display = 'none';
    populatedView.style.display = 'block';
    

    
    // Clear list
    itemsContainer.innerHTML = '';
    
    let subtotal = 0;
    
    STATE.cart.forEach((item, index) => {
        const itemTotal = item.finalPrice * item.qty;
        subtotal += itemTotal;
        
        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div>
                    <div style="display: flex; justify-content: space-between;">
                        <h4 class="cart-item-title">${item.name}</h4>
                        <button class="delete-cart-item" onclick="deleteCartIndex(${index})" title="Hapus">
                            <svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                        </button>
                    </div>
                    <p class="cart-item-option">Ukuran: ${item.size.split(' ')[0]} ${item.ice !== 'None' ? `| Es: ${item.ice}` : ''}</p>
                </div>
                <div class="cart-item-footer">
                    <span class="cart-item-price">Rp ${itemTotal.toLocaleString('id-ID')}</span>
                    <div class="cart-item-actions">
                        <button class="cart-item-btn" onclick="updateCartQty(${index}, -1)">-</button>
                        <span class="cart-item-qty">${item.qty}</span>
                        <button class="cart-item-btn" onclick="updateCartQty(${index}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
        itemsContainer.appendChild(cartItemEl);
    });
    
    // Calculation numbers
    const serviceFee = 0;
    // Premium Offer: discount Rp 5.000 if subtotal above Rp 50.000
    const discount = subtotal >= 50000 ? 5000 : 0;
    const total = subtotal + serviceFee - discount;
    
    document.getElementById('summary-subtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
    document.getElementById('summary-discount').textContent = `-Rp ${discount.toLocaleString('id-ID')}`;
    document.getElementById('summary-total').textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

window.updateCartQty = (index, delta) => {
    const item = STATE.cart[index];
    item.qty += delta;
    
    if (item.qty <= 0) {
        STATE.cart.splice(index, 1);
        showToast(`Item dihapus dari keranjang.`, 'error');
    }
    
    updateCartBadge();
    renderCartView();
};

window.deleteCartIndex = (index) => {
    const deletedName = STATE.cart[index].name;
    STATE.cart.splice(index, 1);
    updateCartBadge();
    renderCartView();
    showToast(`${deletedName} dihapus dari keranjang.`, 'error');
};

function clearCart() {
    if (STATE.cart.length === 0) return;
    
    STATE.cart = [];
    updateCartBadge();
    renderCartView();
    showToast("Keranjang belanja dikosongkan.", "error");
}



function openQRISModal(formattedTotal) {
    const modal = document.getElementById('qris-payment-modal');
    const amountVal = document.getElementById('qris-total-amount');
    const statusText = document.getElementById('qris-status-message');
    const spinner = document.getElementById('qris-loading-spinner');
    
    if (amountVal) amountVal.textContent = formattedTotal;
    if (statusText) statusText.textContent = 'Menunggu pembayaran Anda...';
    if (spinner) {
        spinner.className = 'qris-spinner';
    }
    
    // Reset payment proof state
    STATE.currentPaymentProofBase64 = null;
    
    // Reset proof upload elements in DOM
    const fileInput = document.getElementById('qris-proof-file-input');
    if (fileInput) fileInput.value = '';
    
    const placeholder = document.getElementById('qris-upload-placeholder');
    const previewContainer = document.getElementById('qris-upload-preview-container');
    const previewImg = document.getElementById('qris-upload-preview-img');
    const fileNameEl = document.getElementById('qris-upload-file-name');
    
    if (placeholder) placeholder.style.display = 'flex';
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileNameEl) fileNameEl.textContent = '';
    
    if (modal) modal.classList.add('active');
}

function closeQRISModal() {
    const modal = document.getElementById('qris-payment-modal');
    if (modal) modal.classList.remove('active');
}

function logOrder(method, status, orderId = null) {
    if (STATE.cart.length === 0) return;
    
    let subtotal = STATE.cart.reduce((sum, item) => sum + (item.finalPrice * item.qty), 0);
    const serviceFee = 0;
    const discount = subtotal >= 50000 ? 5000 : 0;
    const total = subtotal + serviceFee - discount;
    
    // Load current sequential order counter (unique and continuous)
    let nextNum = parseInt(localStorage.getItem('kopi_kita_next_order_number')) || 2832;
    const id = orderId || `#KK-${nextNum}`;
    
    // Only increment and save if we are generating a new sequence number
    if (!orderId) {
        localStorage.setItem('kopi_kita_next_order_number', (nextNum + 1).toString());
    }
    
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateString = `Hari Ini, ${timeString}`;
    
    // Retrieve custom customer name from input field
    const customerNameInput = document.getElementById('checkout-customer-name');
    const customerName = customerNameInput ? sanitizeInput(customerNameInput.value) : 'Pelanggan';
    
    const order = {
        id: id,
        customerName: customerName,
        date: dateString,
        timestamp: Date.now(),
        items: STATE.cart.map(item => {
            const product = PRODUCTS.find(p => p.id === item.id || p.name === item.name);
            const costPrice = product ? (product.costPrice || 0) : 0;
            return {
                name: item.name,
                qty: item.qty,
                size: item.size,
                ice: item.ice,
                price: item.finalPrice,
                cost: costPrice // Store cost price historically
            };
        }),
        subtotal: subtotal,
        serviceFee: serviceFee,
        discount: discount,
        total: total,
        status: status, // 'Selesai' or 'Menunggu Pembayaran'
        paymentMethod: method, // 'QRIS'
        paymentProof: STATE.currentPaymentProofBase64
    };
    
    // Put at the beginning of the history
    STATE.orderHistory.unshift(order);
    
    // Persist complete order logs in localStorage securely
    saveOrderHistory();
}

function submitQRISPayment() {
    // If customer has not uploaded a screenshot, block with Toast alert
    if (!STATE.currentPaymentProofBase64) {
        showToast("Wajib mengunggah screenshot bukti transfer QRIS!", "error");
        return;
    }
    
    const statusText = document.getElementById('qris-status-message');
    const spinner = document.getElementById('qris-loading-spinner');
    
    if (statusText) statusText.innerHTML = '<span style="color:#2ECC71; font-weight:700;">Pembayaran Diterima! Pesanan Anda sedang diproses. ☕</span>';
    if (spinner) {
        spinner.className = 'qris-spinner success';
    }
    
    // Log the order to history before clearing cart
    logOrder('QRIS', 'Sedang Disiapkan');
    
    setTimeout(() => {
        closeQRISModal();
        STATE.cart = [];
        updateCartBadge();
        renderCartView();
        showToast("Transaksi QRIS Berhasil! Pesanan sedang disiapkan. ☕");
        switchTab('beranda');
    }, 2500);
}

function processCheckout() {
    if (STATE.cart.length === 0) return;
    
    // Validate that Customer Name is not empty before proceeding
    const nameInput = document.getElementById('checkout-customer-name');
    if (nameInput && !nameInput.value.trim()) {
        showToast("Silakan masukkan Nama Pemesan terlebih dahulu.", "error");
        nameInput.focus();
        return;
    }
    
    // Calculate final total
    let subtotal = STATE.cart.reduce((sum, item) => sum + (item.finalPrice * item.qty), 0);
    const serviceFee = 0;
    const discount = subtotal >= 50000 ? 5000 : 0;
    const total = subtotal + serviceFee - discount;
    const formattedTotal = `Rp ${total.toLocaleString('id-ID')}`;
    
    const checkoutBtn = document.getElementById('btn-checkout');
    const originalContent = checkoutBtn.innerHTML;
    checkoutBtn.disabled = true;
    checkoutBtn.style.opacity = '0.7';
    checkoutBtn.innerHTML = '<span>Memproses Pembayaran...</span>';
    
    setTimeout(() => {
        checkoutBtn.disabled = false;
        checkoutBtn.style.opacity = '1';
        checkoutBtn.innerHTML = originalContent;
        
        // Directly proceed to QRIS payment modal as it is the only unified method
        openQRISModal(formattedTotal);
    }, 1000);
}



function renderOrderHistory() {
    const emptyView = document.getElementById('order-history-empty');
    const listContainer = document.getElementById('order-history-list');
    
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (!STATE.orderHistory || STATE.orderHistory.length === 0) {
        if (emptyView) emptyView.style.display = 'flex';
        return;
    }
    
    if (emptyView) emptyView.style.display = 'none';
    
    STATE.orderHistory.forEach((order, index) => {
        if (!order) return;
        const card = document.createElement('div');
        card.className = 'history-order-card';
        
        // Status classes
        const statusClass = (order.status && typeof order.status === 'string' && order.status.includes('Selesai')) ? 'success' : 'pending';
        const statusText = order.status || 'Sedang Disiapkan';
        
        // Make brief item names summary safely
        const orderItems = Array.isArray(order.items) ? order.items : [];
        const itemsSummary = orderItems.map(it => {
            const name = it && it.name ? it.name : 'Premium Item';
            const qty = it && typeof it.qty === 'number' ? it.qty : 1;
            return `${name} (${qty}x)`;
        }).join(', ');
        
        // Generate collapsible elements for receipt details safely
        let itemsDetailHtml = '';
        orderItems.forEach(it => {
            if (!it) return;
            const name = it.name || 'Premium Item';
            const qty = typeof it.qty === 'number' ? it.qty : 1;
            const sizeStr = typeof it.size === 'string' ? it.size.split(' ')[0] : 'Medium';
            const iceStr = typeof it.ice === 'string' ? it.ice : 'Normal';
            const price = typeof it.price === 'number' ? it.price : 0;
            
            itemsDetailHtml += `
                <div class="history-detail-item" style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px; color: var(--text-main);">
                    <span>${name} (${qty}x) <br><small style="color: var(--text-muted); font-size: 10px;">${sizeStr} ${iceStr !== 'None' ? `| Es: ${iceStr}` : ''}</small></span>
                    <span style="font-weight: 600;">Rp ${(price * qty).toLocaleString('id-ID')}</span>
                </div>
            `;
        });
        
        const totalVal = typeof order.total === 'number' ? order.total : 0;
        const subtotalVal = typeof order.subtotal === 'number' ? order.subtotal : 0;
        const serviceFeeVal = typeof order.serviceFee === 'number' ? order.serviceFee : 0;
        const discountVal = typeof order.discount === 'number' ? order.discount : 0;
        const paymentMethodVal = order.paymentMethod || 'QRIS';
        const customerNameVal = order.customerName || 'Pelanggan';
        
        card.innerHTML = `
            <div class="history-card-header" onclick="toggleHistoryCardDetail(${index})" style="cursor: pointer; display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05);">
                <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="history-order-id" style="font-weight: 700; font-family: monospace; font-size: 14px; color: var(--primary);">${order.id || '#KK-0000'}</span>
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <span class="history-order-date" style="font-size: 11px; color: var(--text-muted); display: block; margin-top: 4px;">${order.date || 'Baru saja'}</span>
                    <span class="history-order-customer" style="font-size: 12px; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 4px; margin-top: 6px;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="var(--primary)" style="opacity: 0.7;">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                        <span>${customerNameVal}</span>
                    </span>
                </div>
                <div style="text-align: right;">
                    <span class="history-order-total" style="font-weight: 800; color: var(--accent-green); font-size: 15px;">Rp ${totalVal.toLocaleString('id-ID')}</span>
                    <svg class="history-expand-icon" id="history-expand-${index}" viewBox="0 0 24 24" width="18" height="18" fill="var(--text-muted)" style="transition: transform 0.3s; margin-top: 4px; display: block; margin-left: auto;">
                        <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
                    </svg>
                </div>
            </div>
            
            <div class="history-card-summary" id="history-summary-${index}" style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                <span class="history-items-summary" style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${itemsSummary}</span>
            </div>
            
            <div class="history-card-details" id="history-details-${index}" style="display: none; padding-top: 12px; margin-top: 8px; border-top: 1px dashed var(--border-color);">
                <div class="history-details-items-list" style="margin-bottom: 12px;">
                    ${itemsDetailHtml}
                </div>
                <div class="history-details-breakdown" style="background: rgba(0,0,0,0.02); padding: 8px 12px; border-radius: 4px; font-size: 11px; color: var(--text-muted); line-height: 1.6;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Subtotal:</span>
                        <span>Rp ${subtotalVal.toLocaleString('id-ID')}</span>
                    </div>
                    ${serviceFeeVal > 0 ? `
                    <div style="display: flex; justify-content: space-between;">
                        <span>Biaya Layanan:</span>
                        <span>Rp ${serviceFeeVal.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                    ${discountVal > 0 ? `
                    <div style="display: flex; justify-content: space-between; color: var(--accent-green);">
                        <span>Diskon:</span>
                        <span>-Rp ${discountVal.toLocaleString('id-ID')}</span>
                    </div>` : ''}
                    <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 12px; color: var(--primary); border-top: 1px solid rgba(0,0,0,0.05); margin-top: 6px; padding-top: 6px;">
                        <span>Total:</span>
                        <span style="color: var(--accent-green);">Rp ${totalVal.toLocaleString('id-ID')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; font-style: italic;">
                        <span>Metode Pembayaran:</span>
                        <span>${paymentMethodVal}</span>
                    </div>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

window.toggleHistoryCardDetail = (index) => {
    const detailsDiv = document.getElementById(`history-details-${index}`);
    const summaryDiv = document.getElementById(`history-summary-${index}`);
    const icon = document.getElementById(`history-expand-${index}`);
    
    if (detailsDiv && detailsDiv.style.display === 'none') {
        detailsDiv.style.display = 'block';
        if (summaryDiv) summaryDiv.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else if (detailsDiv) {
        detailsDiv.style.display = 'none';
        if (summaryDiv) summaryDiv.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
};

window.toggleHistoryCardDetailCallback = (index) => {
    window.toggleHistoryCardDetail(index);
};

// ==========================================
// 9. EVENT LISTENERS MODULE
// ==========================================

function initEventListeners() {
    // Initialize QRIS drag & drop upload
    initDragAndDrop();

    // SEARCH BOX INITIALIZATION
    const searchBox = document.getElementById('search-box');
    if (searchBox) {
        searchBox.style.display = 'block'; // open by default on Cari Menu screen
    }
    
    const btnToggleSearch = document.getElementById('btn-toggle-search');
    if (btnToggleSearch && searchBox) {
        btnToggleSearch.addEventListener('click', () => {
            if (searchBox.style.display === 'none') {
                searchBox.style.display = 'block';
                document.getElementById('search-input').focus();
            } else {
                searchBox.style.display = 'none';
                STATE.searchQuery = '';
                document.getElementById('search-input').value = '';
                renderProductsGrid();
            }
        });
    }
    
    // REAL-TIME SEARCH FILTER
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            STATE.searchQuery = e.target.value;
            renderProductsGrid();
        });
    }
    
    // PRODUCT DETAIL MODAL CONTROLS
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeProductDetail);
    
    // Quantity changes
    const btnQtyMinus = document.getElementById('btn-qty-minus');
    if (btnQtyMinus) {
        btnQtyMinus.addEventListener('click', () => {
            if (STATE.modalQty > 1) {
                STATE.modalQty--;
                updateModalPrice();
            }
        });
    }
    
    const btnQtyPlus = document.getElementById('btn-qty-plus');
    if (btnQtyPlus) {
        btnQtyPlus.addEventListener('click', () => {
            STATE.modalQty++;
            updateModalPrice();
        });
    }
    
    // Customization Chips selection
    document.querySelectorAll('#option-sizes .option-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#option-sizes .option-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            STATE.modalSelectedSize = chip.getAttribute('data-value');
            updateModalPrice();
        });
    });
    
    document.querySelectorAll('#option-ice .option-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('#option-ice .option-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            STATE.modalSelectedIce = chip.getAttribute('data-value');
            updateModalPrice();
        });
    });
    
    // Modal Add-to-cart confirmation
    const btnModalAddToCart = document.getElementById('btn-modal-add-to-cart');
    if (btnModalAddToCart) {
        btnModalAddToCart.addEventListener('click', () => {
            if (!STATE.activeModalProduct) return;
            
            let finalPrice = STATE.activeModalProduct.basePrice;
            if (STATE.modalSelectedSize.includes('Large')) {
                finalPrice += 5000;
            }
            
            addToCart({
                id: STATE.activeModalProduct.id,
                name: STATE.activeModalProduct.name,
                image: STATE.activeModalProduct.image,
                basePrice: STATE.activeModalProduct.basePrice,
                size: STATE.modalSelectedSize,
                ice: STATE.modalSelectedIce,
                qty: STATE.modalQty,
                finalPrice: finalPrice
            });
            
            closeProductDetail();
            showToast(`${STATE.modalQty} ${STATE.activeModalProduct.name} dimasukkan ke keranjang.`);
        });
    }
    
    // CART VIEW CONTROLS
    const btnClearCart = document.getElementById('btn-clear-cart');
    if (btnClearCart) btnClearCart.addEventListener('click', clearCart);
    
    const btnCheckout = document.getElementById('btn-checkout');
    if (btnCheckout) btnCheckout.addEventListener('click', processCheckout);
    
    // QRIS MODAL CONTROLS
    const btnQrisCancel = document.getElementById('btn-qris-cancel');
    if (btnQrisCancel) btnQrisCancel.addEventListener('click', closeQRISModal);
 
    const btnQrisSubmit = document.getElementById('btn-qris-submit');
    if (btnQrisSubmit) btnQrisSubmit.addEventListener('click', submitQRISPayment);
    
    // NOTIFICATIONS CLICK (Class-based selection supporting multiple headers)
    document.querySelectorAll('.btn-notifications').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast("Anda mendapat 3 notifikasi promo Kopi Kita hari ini!", "info");
        });
    });
    
    // PROFILE AVATAR CLICK (Class-based selection supporting multiple headers)
    document.querySelectorAll('.profile-avatar').forEach(avatar => {
        avatar.addEventListener('click', () => {
            switchTab('akun');
        });
    });
    
    // INTERACTIVE LOGOS (Return to home on click, class-based)
    document.querySelectorAll('.logo-section').forEach(logo => {
        logo.addEventListener('click', () => switchTab('beranda'));
        logo.style.cursor = 'pointer';
    });
    
    // Barista Login Modal Close Button
    const btnCloseBaristaLogin = document.getElementById('btn-close-barista-login');
    if (btnCloseBaristaLogin) {
        btnCloseBaristaLogin.addEventListener('click', closeBaristaLogin);
    }
}

// ==========================================
// 10. KASIR & KITCHEN DISPLAY SYSTEM (KDS) CONTROLLER
// ==========================================

function openBaristaLogin() {
    const modal = document.getElementById('barista-login-modal');
    if (modal) {
        modal.classList.add('active');
        clearDigitPin();
    }
}

function closeBaristaLogin() {
    const modal = document.getElementById('barista-login-modal');
    if (modal) {
        modal.classList.remove('active');
        clearDigitPin();
    }
}

function enterDigitPin(digit) {
    const pinValEl = document.getElementById('barista-pin-value');
    if (!pinValEl) return;
    
    let currentPin = pinValEl.value;
    if (currentPin.length >= 4) return;
    
    currentPin += digit;
    pinValEl.value = currentPin;
    
    updatePinDots(currentPin.length);
    
    // Automatically submit if 4 digits entered
    if (currentPin.length === 4) {
        setTimeout(submitBaristaPin, 200); // slight delay for visual dot feedback
    }
}

function clearDigitPin() {
    const pinValEl = document.getElementById('barista-pin-value');
    if (pinValEl) pinValEl.value = '';
    updatePinDots(0);
}

function updatePinDots(length) {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pin-dot-${i}`);
        if (dot) {
            if (i <= length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

function submitBaristaPin() {
    const pinValEl = document.getElementById('barista-pin-value');
    if (!pinValEl) return;
    
    const pin = pinValEl.value;
    if (pin.length === 0) return; // Prevent double submission
    
    const expectedCashierPin = STATE.cashierPin || '1234';
    const expectedAdminPin = STATE.adminPin || '9999';
    
    if (pin === expectedCashierPin) {
        showToast("Login Berhasil! Selamat bekerja, Barista.", "success");
        clearDigitPin();
        closeBaristaLogin();
        switchBaristaMode(true);
    } else if (pin === expectedAdminPin) {
        showToast("Akses Admin Berhasil! Selamat datang.", "success");
        clearDigitPin();
        closeBaristaLogin();
        switchAdminMode(true);
    } else {
        showToast("PIN Salah! Akses ditolak.", "error");
        clearDigitPin();
    }
}

function switchBaristaMode(active) {
    STATE.isBaristaMode = active;
    
    // Set active tab marker for responsive layout
    const screenWrapper = document.querySelector('.screen-wrapper');
    if (screenWrapper) {
        if (active) {
            screenWrapper.setAttribute('data-active-tab', 'barista');
        } else {
            screenWrapper.setAttribute('data-active-tab', STATE.currentTab);
        }
    }
    
    // Toggle screens
    const screenBarista = document.getElementById('screen-barista');
    if (screenBarista) {
        if (active) {
            screenBarista.classList.add('active');
            
            // Hide customer screens
            const customerScreens = ['home', 'menu', 'orders', 'account'];
            customerScreens.forEach(s => {
                const el = document.getElementById(`screen-${s}`);
                if (el) el.classList.remove('active');
            });
            
            // Close login modal if open
            closeBaristaLogin();
            
            // Render KDS dashboard
            renderBaristaDashboard();
        } else {
            screenBarista.classList.remove('active');
            
            // Restore current customer screen
            switchTab(STATE.currentTab);
        }
    }
}

function setKdsView(tabId) {
    STATE.kdsActiveTab = tabId;
    
    // Toggle active classes on tabs
    const activeTabEl = document.getElementById('kds-tab-active');
    const doneTabEl = document.getElementById('kds-tab-done');
    
    if (activeTabEl && doneTabEl) {
        if (tabId === 'active') {
            activeTabEl.classList.add('active');
            activeTabEl.style.background = 'var(--primary)';
            activeTabEl.style.color = 'white';
            
            doneTabEl.classList.remove('active');
            doneTabEl.style.background = 'transparent';
            doneTabEl.style.color = '#BCA394';
        } else {
            doneTabEl.classList.add('active');
            doneTabEl.style.background = 'var(--primary)';
            doneTabEl.style.color = 'white';
            
            activeTabEl.classList.remove('active');
            activeTabEl.style.background = 'transparent';
            activeTabEl.style.color = '#BCA394';
        }
    }
    
    renderBaristaDashboard();
}

function renderBaristaDashboard() {
    if (!STATE.isBaristaMode) return;
    
    const queueContainer = document.getElementById('kds-queue-container');
    const emptyState = document.getElementById('kds-empty-state');
    
    const activeStatEl = document.getElementById('kds-stat-active');
    const completedStatEl = document.getElementById('kds-stat-completed');
    
    if (!queueContainer) return;
    queueContainer.innerHTML = '';
    
    // Safety check for history
    const historyList = Array.isArray(STATE.orderHistory) ? STATE.orderHistory : [];
    
    // Count active and completed orders from orderHistory safely
    const activeOrders = historyList.filter(o => o && o.status === 'Sedang Disiapkan');
    const completedOrders = historyList.filter(o => o && o.status && typeof o.status === 'string' && o.status.includes('Selesai'));
    
    if (activeStatEl) activeStatEl.textContent = `${activeOrders.length} Pesanan`;
    if (completedStatEl) completedStatEl.textContent = completedOrders.length;
    
    const currentTab = STATE.kdsActiveTab || 'active';
    const targetOrders = currentTab === 'active' ? activeOrders : completedOrders;
    
    if (targetOrders.length === 0) {
        queueContainer.style.display = 'none';
        if (emptyState) {
            emptyState.style.display = 'flex';
            // Update empty state text
            const titleEl = emptyState.querySelector('h4');
            const descEl = emptyState.querySelector('p');
            if (currentTab === 'active') {
                if (titleEl) titleEl.textContent = 'Belum Ada Antrean';
                if (descEl) descEl.textContent = 'Pesanan baru berstatus paid via QRIS akan otomatis masuk di sini.';
            } else {
                if (titleEl) titleEl.textContent = 'Belum Ada Pesanan Selesai';
                if (descEl) descEl.textContent = 'Selesaikan pesanan aktif di tab Antrean untuk melihat riwayat di sini.';
            }
        }
        return;
    }
    
    queueContainer.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    
    targetOrders.forEach(order => {
        if (!order) return;
        const card = document.createElement('div');
        const isPreparing = order.status === 'Sedang Disiapkan';
        card.className = `kds-order-card ${isPreparing ? 'preparing' : 'completed'}`;
        
        let itemsHtml = '';
        const orderItems = Array.isArray(order.items) ? order.items : [];
        orderItems.forEach(it => {
            if (!it) return;
            const name = it.name || 'Premium Item';
            const qty = typeof it.qty === 'number' ? it.qty : 1;
            const sizeStr = typeof it.size === 'string' ? it.size.split(' ')[0] : 'Medium';
            const iceStr = typeof it.ice === 'string' ? it.ice : 'Normal';
            const price = typeof it.price === 'number' ? it.price : 0;
            const finalItemPrice = price * qty;
            
            itemsHtml += `
                <div class="kds-item-row">
                    <span>
                        <span class="kds-item-qty">${qty}x</span>
                        <span class="kds-item-desc">${name}</span>
                        <span class="kds-item-custom">Ukuran: ${sizeStr} ${iceStr !== 'None' ? `| Es: ${iceStr}` : ''}</span>
                    </span>
                    <span class="kds-item-price">Rp ${finalItemPrice.toLocaleString('id-ID')}</span>
                </div>
            `;
        });
        
        const totalVal = typeof order.total === 'number' ? order.total : 0;
        const methodVal = order.paymentMethod || 'QRIS';
        
        const actionButtonHtml = isPreparing 
            ? `<button class="btn-kds-complete" onclick="completeBaristaOrder('${order.id}')">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>Selesaikan & Panggil</span>
               </button>`
            : `<div style="text-align: center; color: #2ECC71; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; background: rgba(46,204,113,0.1); border-radius: 6px; border: 1px solid rgba(46,204,113,0.2);">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                    <span>Selesai & Dipanggil</span>
               </div>`;
               
        const proofButtonHtml = order.paymentProof 
            ? `<button class="kds-btn-proof" onclick="openPaymentProofModal('${order.id}')" style="background: rgba(188, 163, 148, 0.15); border: 1px solid rgba(188, 163, 148, 0.3); border-radius: 6px; color: %23BCA394; font-size: 10px; font-weight: 700; cursor: pointer; padding: 3px 8px; display: inline-flex; align-items: center; gap: 4px; transition: all 0.2s; margin-left: 6px; outline: none;">
                    <span>👁️ Bukti Bayar</span>
               </button>`
            : '';

        card.innerHTML = `
            <div class="kds-card-header">
                <div>
                    <span class="kds-order-id">${order.id || '#KK-0000'}</span>
                    <span class="kds-order-time" style="display: block; margin-top: 2px;">${order.date || 'Baru saja'}</span>
                </div>
                <div class="kds-customer-row" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <span>👤 ${order.customerName || 'Pelanggan'}</span>
                    ${proofButtonHtml}
                </div>
            </div>
            
            <div class="kds-items-list">
                ${itemsHtml}
            </div>
            
            <div class="kds-card-footer">
                <div>
                    <span style="font-size: 10px; color: #BCA394; display: block; text-transform: uppercase;">Metode: ${methodVal}</span>
                    <span class="kds-total-price">Rp ${totalVal.toLocaleString('id-ID')}</span>
                </div>
                ${actionButtonHtml}
            </div>
        `;
        
        queueContainer.appendChild(card);
    });
}

function completeBaristaOrder(orderId) {
    const order = STATE.orderHistory.find(o => o && o.id === orderId);
    if (!order) return;
    
    order.status = 'Selesai! Kopi Siap Dinikmati ☕';
    
    // Save to localStorage securely
    saveOrderHistory();
    
    // Re-render KDS
    renderBaristaDashboard();
    
    // Re-render Customer Order History if screen active
    renderOrderHistory();
    
    // Trigger Indonesian Text-to-Speech callout
    speakBaristaCallout(order.customerName);
    
    // Compile details and show thermal receipt popup
    showThermalReceipt(order);
}

function speakBaristaCallout(customerName) {
    if (!('speechSynthesis' in window)) {
        console.warn('Text-to-Speech tidak didukung pada browser ini.');
        return;
    }
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const speechText = `Panggilan untuk Kak ${customerName}, pesanan Anda telah selesai disiapkan! Silakan diambil di meja barista Kopi Kita.`;
    const utterance = new SpeechSynthesisUtterance(speechText);
    
    // Find Indonesian voice if available
    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(voice => voice.lang === 'id-ID' || voice.lang.startsWith('id'));
    if (idVoice) {
        utterance.voice = idVoice;
    }
    
    utterance.lang = 'id-ID';
    utterance.rate = 0.95; // slightly slower for clearer pronunciation
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

// ==========================================
// 11. PAYMENT PROOF CONTROLLERS & DRAG-AND-DROP
// ==========================================

// Handle file selection and read as Base64
function handleProofFileSelect(file) {
    if (!file) return;
    
    // Check if it's an image
    if (!file.type.startsWith('image/')) {
        showToast("Format berkas harus berupa gambar!", "error");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        STATE.currentPaymentProofBase64 = e.target.result;
        
        // Show preview in UI
        const placeholder = document.getElementById('qris-upload-placeholder');
        const previewContainer = document.getElementById('qris-upload-preview-container');
        const previewImg = document.getElementById('qris-upload-preview-img');
        const fileNameEl = document.getElementById('qris-upload-file-name');
        
        if (placeholder) placeholder.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'flex';
        if (previewImg) previewImg.src = e.target.result;
        if (fileNameEl) fileNameEl.textContent = file.name;
        
        showToast("Bukti pembayaran berhasil diunggah!", "success");
    };
    reader.onerror = function() {
        showToast("Gagal membaca file bukti pembayaran.", "error");
    };
    reader.readAsDataURL(file);
}

// Remove QRIS proof handler
function removeQrisProof(event) {
    if (event) {
        event.stopPropagation();
        event.preventDefault();
    }
    STATE.currentPaymentProofBase64 = null;
    
    const fileInput = document.getElementById('qris-proof-file-input');
    if (fileInput) fileInput.value = '';
    
    const placeholder = document.getElementById('qris-upload-placeholder');
    const previewContainer = document.getElementById('qris-upload-preview-container');
    const previewImg = document.getElementById('qris-upload-preview-img');
    const fileNameEl = document.getElementById('qris-upload-file-name');
    
    if (placeholder) placeholder.style.display = 'flex';
    if (previewContainer) previewContainer.style.display = 'none';
    if (previewImg) previewImg.src = '';
    if (fileNameEl) fileNameEl.textContent = '';
    
    showToast("Bukti pembayaran dihapus.", "info");
}

// Initialize drag & drop triggers
function initDragAndDrop() {
    const dropArea = document.getElementById('qris-drag-drop-area');
    const fileInput = document.getElementById('qris-proof-file-input');
    if (!dropArea) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);
    
    // Handle selected files via input
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            if (e.target.files && e.target.files[0]) {
                handleProofFileSelect(e.target.files[0]);
            }
        });
    }
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        dropArea.classList.add('dragover');
    }
    
    function unhighlight() {
        dropArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files[0]) {
            handleProofFileSelect(files[0]);
        }
    }
}

// Lightbox modal triggers in KDS
function openPaymentProofModal(orderId) {
    const order = STATE.orderHistory.find(o => o && o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('kds-payment-proof-modal');
    const nameEl = document.getElementById('kds-proof-customer-name');
    const orderIdEl = document.getElementById('kds-proof-order-id');
    const imgEl = document.getElementById('kds-payment-proof-img');
    
    if (nameEl) nameEl.textContent = `Pelanggan: ${order.customerName}`;
    if (orderIdEl) orderIdEl.textContent = `Order ID: ${order.id}`;
    if (imgEl && order.paymentProof) {
        imgEl.src = order.paymentProof;
    }
    
    if (modal) modal.classList.add('active');
}

function closePaymentProofModal() {
    const modal = document.getElementById('kds-payment-proof-modal');
    if (modal) modal.classList.remove('active');
}

// ==========================================
// 11. PORTAL ADMIN CONTROLLER, SETTINGS & ANALYTICS
// ==========================================

let currentAdminTab = 'analytics';
let currentAdminPeriod = 'day';
let editingProductId = null;

// Reusable Canvas downscaler & compressor to 300x300 JPEG 0.8
function compressAndDownscaleImage(file, maxSize, quality, callback) {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Downscale proportionally
            if (width > height) {
                if (width > maxSize) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            const base64Str = canvas.toDataURL('image/jpeg', quality);
            callback(base64Str);
        };
        img.onerror = function() {
            showToast("Gagal memuat gambar untuk kompresi.", "error");
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        showToast("Gagal membaca file gambar.", "error");
    };
    reader.readAsDataURL(file);
}

// ------------------------------------------
// Cart Price Synchronization & Cleanup
// ------------------------------------------
function syncCartItemPrices(productId, newBasePrice) {
    STATE.cart.forEach(item => {
        if (item.id === productId) {
            item.basePrice = newBasePrice;
            let sizeCharge = 0;
            if (item.size && item.size.includes('Large')) {
                sizeCharge = 5000;
            }
            item.finalPrice = newBasePrice + sizeCharge;
        }
    });
    updateCartBadge();
    if (STATE.currentTab === 'pesanan') {
        renderCartView();
    }
}

function removeProductFromCart(productId) {
    STATE.cart = STATE.cart.filter(item => item.id !== productId);
    updateCartBadge();
    if (STATE.currentTab === 'pesanan') {
        renderCartView();
    }
}

// ------------------------------------------
// Shop identity & custom settings
// ------------------------------------------
function toggleProductImageSource(sourceValue) {
    const uploadBtn = document.getElementById('btn-admin-product-image-upload');
    const filenameEl = document.getElementById('admin-product-image-filename');
    const previewImg = document.getElementById('admin-product-image-preview');
    
    if (sourceValue === 'custom') {
        if (uploadBtn) uploadBtn.style.display = 'inline-block';
        if (filenameEl) {
            filenameEl.style.display = 'block';
            if (STATE.currentProductImageBase64) {
                filenameEl.textContent = "Kustom (Tersimpan)";
                if (previewImg) previewImg.src = STATE.currentProductImageBase64;
            } else {
                filenameEl.textContent = "Belum ada berkas terpilih";
                if (previewImg) previewImg.src = 'assets/es_kopi_susu.png';
            }
        }
    } else {
        if (uploadBtn) uploadBtn.style.display = 'none';
        if (filenameEl) filenameEl.style.display = 'none';
        if (previewImg) previewImg.src = sourceValue;
        STATE.currentProductImageBase64 = null;
    }
}

function handleProductImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast("Format berkas harus berupa gambar!", "error");
        return;
    }
    
    compressAndDownscaleImage(file, 300, 0.8, function(base64Str) {
        STATE.currentProductImageBase64 = base64Str;
        
        const previewImg = document.getElementById('admin-product-image-preview');
        const filenameEl = document.getElementById('admin-product-image-filename');
        
        if (previewImg) previewImg.src = base64Str;
        if (filenameEl) filenameEl.textContent = file.name;
        
        showToast("Foto produk berhasil diunggah & dikompres!", "success");
    });
}

function handleQrisImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast("Format berkas harus berupa gambar!", "error");
        return;
    }
    
    compressAndDownscaleImage(file, 300, 0.8, function(base64Str) {
        STATE.qrisImage = base64Str;
        
        const previewContainer = document.getElementById('settings-qris-preview-container');
        const filenameEl = document.getElementById('settings-qris-filename');
        const resetBtn = document.getElementById('btn-reset-qris');
        
        if (previewContainer) {
            previewContainer.innerHTML = `<img src="${base64Str}" alt="QRIS Preview" style="max-width: 100%; max-height: 100%; object-fit: contain;">`;
        }
        if (filenameEl) filenameEl.textContent = file.name;
        if (resetBtn) resetBtn.style.display = "inline-block";
        
        showToast("QRIS kustom diunggah & dikompres!", "success");
    });
}

function resetQrisToDefault() {
    STATE.qrisImage = null;
    saveSettings();
    applySettings();
    showToast("QRIS toko dikembalikan ke sistem bawaan.", "info");
}

function saveSettingsForm(event) {
    if (event) event.preventDefault();
    
    const shopNameInp = document.getElementById('settings-shop-name');
    const cashierPinInp = document.getElementById('settings-cashier-pin');
    const adminPinInp = document.getElementById('settings-admin-pin');
    if (!shopNameInp || !cashierPinInp || !adminPinInp) return;
    
    const nameVal = sanitizeInput(shopNameInp.value);
    const cashierPinVal = cashierPinInp.value.trim();
    const adminPinVal = adminPinInp.value.trim();
    
    if (!nameVal) {
        showToast("Nama toko tidak boleh kosong!", "error");
        return;
    }
    
    // Validate PIN length and numeric pattern
    if (!/^[0-9]{4}$/.test(cashierPinVal)) {
        showToast("PIN Kasir harus berupa 4 digit angka!", "error");
        cashierPinInp.focus();
        return;
    }
    
    if (!/^[0-9]{4}$/.test(adminPinVal)) {
        showToast("PIN Administrator harus berupa 4 digit angka!", "error");
        adminPinInp.focus();
        return;
    }
    
    STATE.shopName = nameVal;
    STATE.cashierPin = cashierPinVal;
    STATE.adminPin = adminPinVal;
    
    saveSettings();
    applySettings();
    
    showToast("Pengaturan identitas toko & PIN berhasil disimpan!", "success");
}

// ------------------------------------------
// Calendar filtering handlers
// ------------------------------------------
function applyCustomDateFilter(val) {
    if (!val) return;
    STATE.customDateFilter = val;
    STATE.customMonthFilter = null;
    const monthInput = document.getElementById('admin-custom-month');
    if (monthInput) monthInput.value = '';
    renderAdminDashboard();
}

function applyCustomMonthFilter(val) {
    if (!val) return;
    STATE.customMonthFilter = val;
    STATE.customDateFilter = null;
    const dateInput = document.getElementById('admin-custom-date');
    if (dateInput) dateInput.value = '';
    renderAdminDashboard();
}

// ------------------------------------------
// Thermal receipt functions
// ------------------------------------------
function showThermalReceipt(order) {
    const modal = document.getElementById('thermal-receipt-modal');
    if (!modal) return;
    
    const receiptOrderId = document.getElementById('receipt-order-id');
    const receiptOrderDate = document.getElementById('receipt-order-date');
    const receiptCustomerName = document.getElementById('receipt-customer-name');
    const receiptBaristaName = document.getElementById('receipt-barista-name');
    const receiptSubtotal = document.getElementById('receipt-subtotal');
    const receiptDiscount = document.getElementById('receipt-discount');
    const receiptTotal = document.getElementById('receipt-total');
    const receiptPaymentMethod = document.getElementById('receipt-payment-method');
    const receiptItemsList = document.getElementById('receipt-items-list');
    
    const shopName = STATE.shopName || "Kopi Kita";
    const receiptShopName = document.getElementById('receipt-shop-name');
    if (receiptShopName) receiptShopName.textContent = shopName.toUpperCase();
    
    if (receiptOrderId) receiptOrderId.textContent = order.id;
    if (receiptOrderDate) receiptOrderDate.textContent = order.date;
    if (receiptCustomerName) receiptCustomerName.textContent = order.customerName;
    if (receiptBaristaName) receiptBaristaName.textContent = STATE.activeBarista || 'Kasir Utama';
    
    if (receiptItemsList) {
        receiptItemsList.innerHTML = '';
        order.items.forEach(item => {
            const itemRow = document.createElement('div');
            itemRow.style.cssText = "display: flex; justify-content: space-between; margin-bottom: 4px;";
            
            const sizeShort = item.size ? item.size.split(' ')[0] : 'M';
            const iceLabel = item.ice && item.ice !== 'None' ? `| Es:${item.ice.split(' ')[0]}` : '';
            const descStr = `${item.qty}x ${item.name} (${sizeShort}${iceLabel})`;
            const priceStr = `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`;
            
            itemRow.innerHTML = `
                <span>${descStr}</span>
                <span style="font-family: monospace;">${priceStr}</span>
            `;
            receiptItemsList.appendChild(itemRow);
        });
    }
    
    const disc = order.discount || 0;
    const sub = order.subtotal || 0;
    const sFee = typeof order.serviceFee === 'number' ? order.serviceFee : 0;
    const tot = order.total || (sub + sFee - disc);
    
    if (receiptSubtotal) receiptSubtotal.textContent = `Rp ${sub.toLocaleString('id-ID')}`;
    if (receiptDiscount) receiptDiscount.textContent = disc > 0 ? `-Rp ${disc.toLocaleString('id-ID')}` : `Rp 0`;
    
    const receiptServiceFee = document.getElementById('receipt-service-fee');
    if (receiptServiceFee) {
        receiptServiceFee.textContent = `Rp ${sFee.toLocaleString('id-ID')}`;
        const serviceFeeRow = receiptServiceFee.closest('tr');
        if (serviceFeeRow) {
            serviceFeeRow.style.display = sFee > 0 ? 'table-row' : 'none';
        }
    }
    
    if (receiptTotal) receiptTotal.textContent = `Rp ${tot.toLocaleString('id-ID')}`;
    if (receiptPaymentMethod) receiptPaymentMethod.textContent = `Metode: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'QRIS'}`;
    
    modal.classList.add('active');
}

function triggerPrintReceipt() {
    window.print();
}

function closeReceiptModal() {
    const modal = document.getElementById('thermal-receipt-modal');
    if (modal) modal.classList.remove('active');
}

// ------------------------------------------
// Admin navigation & rendering
// ------------------------------------------
function switchAdminMode(active) {
    STATE.isAdminMode = active;
    
    const screenWrapper = document.querySelector('.screen-wrapper');
    if (screenWrapper) {
        if (active) {
            screenWrapper.setAttribute('data-active-tab', 'admin');
        } else {
            screenWrapper.setAttribute('data-active-tab', STATE.currentTab);
        }
    }
    
    if (active && STATE.isBaristaMode) {
        switchBaristaMode(false);
    }
    
    const screenAdmin = document.getElementById('screen-admin');
    if (screenAdmin) {
        if (active) {
            screenAdmin.style.display = 'flex';
            screenAdmin.classList.add('active');
            
            const screens = ['home', 'menu', 'orders', 'account', 'barista'];
            screens.forEach(s => {
                const el = document.getElementById(`screen-${s}`);
                if (el) el.classList.remove('active');
            });
            
            switchAdminTab('analytics');
        } else {
            screenAdmin.style.display = 'none';
            screenAdmin.classList.remove('active');
            
            switchTab(STATE.currentTab);
        }
    }
}

function switchAdminTab(tabName) {
    currentAdminTab = tabName;
    
    const panAnalytics = document.getElementById('admin-panel-analytics');
    const panMenu = document.getElementById('admin-panel-menu');
    const panSettings = document.getElementById('admin-panel-settings');
    
    const btnAnalytics = document.getElementById('admin-tab-analytics');
    const btnMenu = document.getElementById('admin-tab-menu');
    const btnSettings = document.getElementById('admin-tab-settings');
    
    if (panAnalytics) panAnalytics.style.display = 'none';
    if (panMenu) panMenu.style.display = 'none';
    if (panSettings) panSettings.style.display = 'none';
    
    if (btnAnalytics) {
        btnAnalytics.classList.remove('active');
        btnAnalytics.style.background = 'transparent';
        btnAnalytics.style.color = '#BCA394';
    }
    if (btnMenu) {
        btnMenu.classList.remove('active');
        btnMenu.style.background = 'transparent';
        btnMenu.style.color = '#BCA394';
    }
    if (btnSettings) {
        btnSettings.classList.remove('active');
        btnSettings.style.background = 'transparent';
        btnSettings.style.color = '#BCA394';
    }
    
    if (tabName === 'analytics') {
        if (panAnalytics) panAnalytics.style.display = 'block';
        if (btnAnalytics) {
            btnAnalytics.classList.add('active');
            btnAnalytics.style.background = 'var(--primary)';
            btnAnalytics.style.color = 'white';
        }
        renderAdminDashboard();
    } else if (tabName === 'menu') {
        if (panMenu) panMenu.style.display = 'block';
        if (btnMenu) {
            btnMenu.classList.add('active');
            btnMenu.style.background = 'var(--primary)';
            btnMenu.style.color = 'white';
        }
        renderAdminCrudList();
    } else if (tabName === 'settings') {
        if (panSettings) panSettings.style.display = 'block';
        if (btnSettings) {
            btnSettings.classList.add('active');
            btnSettings.style.background = 'var(--primary)';
            btnSettings.style.color = 'white';
        }
    }
}

function setAdminPeriod(period) {
    currentAdminPeriod = period;
    
    const periods = ['day', 'month', 'year', 'custom'];
    periods.forEach(p => {
        const btn = document.getElementById(`admin-period-${p}`);
        if (btn) {
            if (p === period) {
                btn.classList.add('active');
                btn.style.background = 'var(--primary)';
                btn.style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.style.background = 'transparent';
                btn.style.color = '#BCA394';
            }
        }
    });
    
    const customPickers = document.getElementById('admin-custom-pickers');
    if (customPickers) {
        if (period === 'custom') {
            customPickers.style.display = 'grid';
        } else {
            customPickers.style.display = 'none';
        }
    }
    
    renderAdminDashboard();
}

function renderAdminDashboard() {
    const paidOrders = STATE.orderHistory.filter(order => 
        order && (order.status === 'Selesai' || (order.status && typeof order.status === 'string' && order.status.includes('Selesai')) || order.status === 'Sedang Disiapkan')
    );
    
    const filteredOrders = paidOrders.filter(order => {
        if (currentAdminPeriod === 'day') {
            return order.date && order.date.includes('Hari Ini');
        } else if (currentAdminPeriod === 'month') {
            return order.date && (order.date.includes('Hari Ini') || order.date.includes('Kemarin') || order.date.includes(new Date().getFullYear().toString()));
        } else if (currentAdminPeriod === 'year') {
            return true;
        } else if (currentAdminPeriod === 'custom') {
            if (!order.timestamp) return false;
            const orderDate = new Date(order.timestamp);
            
            if (STATE.customDateFilter) {
                const [y, m, d] = STATE.customDateFilter.split('-').map(Number);
                return orderDate.getFullYear() === y && 
                       (orderDate.getMonth() + 1) === m && 
                       orderDate.getDate() === d;
            } else if (STATE.customMonthFilter) {
                const [y, m] = STATE.customMonthFilter.split('-').map(Number);
                return orderDate.getFullYear() === y && 
                       (orderDate.getMonth() + 1) === m;
            }
            return true;
        }
        return true;
    });
    
    let totalOrders = filteredOrders.length;
    let totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    let totalCost = filteredOrders.reduce((sum, order) => {
        const orderCost = order.items.reduce((costSum, item) => {
            const itemCost = item.cost || Math.floor((item.price || 0) * 0.4);
            return costSum + (itemCost * item.qty);
        }, 0);
        return sum + orderCost;
    }, 0);
    
    let netProfit = totalRevenue - totalCost;
    
    const ordersEl = document.getElementById('admin-metric-orders');
    const revenueEl = document.getElementById('admin-metric-revenue');
    const costEl = document.getElementById('admin-metric-cost');
    const profitEl = document.getElementById('admin-metric-profit');
    
    if (ordersEl) ordersEl.textContent = `${totalOrders} Order`;
    if (revenueEl) revenueEl.textContent = `Rp ${totalRevenue.toLocaleString('id-ID')}`;
    if (costEl) costEl.textContent = `Rp ${totalCost.toLocaleString('id-ID')}`;
    if (profitEl) profitEl.textContent = `Rp ${netProfit.toLocaleString('id-ID')}`;
    
    const topItemsMap = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            topItemsMap[item.name] = (topItemsMap[item.name] || 0) + item.qty;
        });
    });
    
    const topItemsList = Object.entries(topItemsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);
        
    const chartContainer = document.getElementById('admin-svg-chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = '';
        
        if (topItemsList.length === 0) {
            chartContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 40px 0;">
                    Belum ada data penjualan pada periode ini.
                </div>
            `;
        } else {
            const width = 300;
            const height = 150;
            const paddingLeft = 100;
            const paddingRight = 45;
            const paddingTop = 12;
            const paddingBottom = 12;
            
            const maxQty = Math.max(...topItemsList.map(s => s.qty));
            const barAreaWidth = width - paddingLeft - paddingRight;
            const barHeight = 18;
            const barGap = 12;
            
            let svgStr = `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" style="font-family: inherit;">`;
            
            svgStr += `
                <line x1="${paddingLeft}" y1="${paddingTop}" x2="${paddingLeft}" y2="${height - paddingBottom}" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
                <line x1="${paddingLeft + barAreaWidth / 2}" y1="${paddingTop}" x2="${paddingLeft + barAreaWidth / 2}" y2="${height - paddingBottom}" stroke="rgba(255,255,255,0.02)" stroke-width="1" stroke-dasharray="3,3"/>
                <line x1="${paddingLeft + barAreaWidth}" y1="${paddingTop}" x2="${paddingLeft + barAreaWidth}" y2="${height - paddingBottom}" stroke="rgba(255,255,255,0.06)" stroke-width="1.5"/>
            `;
            
            topItemsList.slice(0, 4).forEach((item, index) => {
                const y = paddingTop + index * (barHeight + barGap);
                const barWidth = maxQty > 0 ? (item.qty / maxQty) * barAreaWidth : 0;
                
                svgStr += `
                    <defs>
                        <linearGradient id="barGrad-${index}" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.85" />
                            <stop offset="100%" stop-color="#E67E22" stop-opacity="1" />
                        </linearGradient>
                    </defs>
                    
                    <text x="${paddingLeft - 8}" y="${y + barHeight / 2 + 3.5}" fill="#BCA394" font-size="8.5" font-weight="700" text-anchor="end">${item.name}</text>
                    <rect x="${paddingLeft}" y="${y}" width="${barWidth}" height="${barHeight}" rx="4" fill="url(#barGrad-${index})" class="svg-chart-bar" />
                    <text x="${paddingLeft + barWidth + 6}" y="${y + barHeight / 2 + 3.5}" fill="white" font-size="9" font-weight="800" font-family="monospace">${item.qty} pcs</text>
                `;
            });
            
            svgStr += `</svg>`;
            chartContainer.innerHTML = svgStr;
        }
    }
    
    const listContainer = document.getElementById('admin-sales-history-list');
    if (listContainer) {
        listContainer.innerHTML = '';
        
        if (filteredOrders.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 24px 0;">
                    Belum ada riwayat pesanan terbayar.
                </div>
            `;
        } else {
            filteredOrders.forEach(order => {
                const itemsSummary = order.items.map(it => `${it.qty}x ${it.name}`).join(', ');
                const itemEl = document.createElement('div');
                itemEl.style.cssText = "background: #251D18; padding: 10px 14px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.02); font-size: 11.5px; margin-bottom: 4px;";
                
                itemEl.innerHTML = `
                    <div style="text-align: left; max-width: 60%; overflow: hidden;">
                        <span style="font-weight: 800; color: var(--primary); font-family: monospace;">${order.id}</span>
                        <span style="color: #EEEEEE; font-weight: 700; margin-left: 6px;">${order.customerName}</span>
                        <span style="display: block; font-size: 10px; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; margin-top: 1px;">${itemsSummary}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="font-weight: 800; color: var(--accent-green); font-family: monospace; display: block;">Rp ${order.total.toLocaleString('id-ID')}</span>
                        <span style="color: var(--text-muted); font-size: 9px; display: block; margin-top: 1px;">${order.date}</span>
                    </div>
                `;
                listContainer.appendChild(itemEl);
            });
        }
    }
}

function renderAdminCrudList() {
    const listContainer = document.getElementById('admin-crud-products-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';
    
    if (PRODUCTS.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 40px 0;">
                Belum ada produk terdaftar. Tambahkan produk baru!
            </div>
        `;
        return;
    }
    
    PRODUCTS.forEach(p => {
        const itemEl = document.createElement('div');
        itemEl.className = 'admin-crud-item';
        itemEl.innerHTML = `
            <img src="${p.image}" alt="${p.name}" class="admin-crud-img">
            <div class="admin-crud-info">
                <h4 class="admin-crud-name">${p.name}</h4>
                <div class="admin-crud-meta">
                    <span style="color: var(--primary); font-weight: 800; font-family: monospace;">Rp ${p.basePrice.toLocaleString('id-ID')}</span>
                    <span style="opacity: 0.3; margin: 0 4px;">•</span>
                    <span style="color: #BDC3C7; font-family: monospace;">Modal: Rp ${(p.costPrice || 0).toLocaleString('id-ID')}</span>
                    <span style="opacity: 0.3; margin: 0 4px;">•</span>
                    <span style="color: var(--text-muted); font-weight: 700; font-size: 10px; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${p.category}</span>
                </div>
            </div>
            <div class="admin-crud-actions">
                <button type="button" class="btn-crud-edit" onclick="openProductModal('${p.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button type="button" class="btn-crud-delete" onclick="deleteProduct('${p.id}')">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
        listContainer.appendChild(itemEl);
    });
}

function openProductModal(productId = null) {
    editingProductId = productId;
    const modal = document.getElementById('admin-product-modal');
    const titleEl = document.getElementById('admin-modal-title');
    
    const nameInp = document.getElementById('admin-product-name');
    const catSelect = document.getElementById('admin-product-category');
    const imgSelect = document.getElementById('admin-product-image');
    const priceInp = document.getElementById('admin-product-price');
    const costInp = document.getElementById('admin-product-cost');
    const descInp = document.getElementById('admin-product-desc');
    
    if (productId) {
        const p = PRODUCTS.find(prod => prod.id === productId);
        if (!p) return;
        
        if (titleEl) titleEl.textContent = "Edit Detail Menu";
        if (nameInp) nameInp.value = p.name;
        if (catSelect) catSelect.value = p.category;
        
        // Populate image selector
        if (p.image && (p.image.startsWith('data:') || p.image.includes('base64'))) {
            if (imgSelect) imgSelect.value = 'custom';
            STATE.currentProductImageBase64 = p.image;
            toggleProductImageSource('custom');
            const filenameEl = document.getElementById('admin-product-image-filename');
            if (filenameEl) filenameEl.textContent = "Gambar Kustom (Tersimpan)";
        } else {
            if (imgSelect) imgSelect.value = p.image || 'assets/es_kopi_susu.png';
            STATE.currentProductImageBase64 = null;
            toggleProductImageSource(imgSelect ? imgSelect.value : '');
        }
        
        const previewImg = document.getElementById('admin-product-image-preview');
        if (previewImg) previewImg.src = p.image || 'assets/es_kopi_susu.png';
        
        if (priceInp) priceInp.value = p.basePrice;
        if (costInp) costInp.value = p.costPrice || Math.floor(p.basePrice * 0.4);
        if (descInp) descInp.value = p.desc;
    } else {
        if (titleEl) titleEl.textContent = "Tambah Menu Baru";
        if (nameInp) nameInp.value = '';
        if (catSelect) catSelect.value = 'Es Kopi';
        if (imgSelect) imgSelect.value = 'assets/es_kopi_susu.png';
        STATE.currentProductImageBase64 = null;
        toggleProductImageSource('assets/es_kopi_susu.png');
        
        if (priceInp) priceInp.value = '';
        if (costInp) costInp.value = '';
        if (descInp) descInp.value = '';
    }
    
    if (modal) modal.classList.add('active');
}

function closeProductModal() {
    const modal = document.getElementById('admin-product-modal');
    if (modal) modal.classList.remove('active');
    editingProductId = null;
}

function saveProductForm(event) {
    if (event) event.preventDefault();
    
    const nameInp = document.getElementById('admin-product-name');
    const catSelect = document.getElementById('admin-product-category');
    const imgSelect = document.getElementById('admin-product-image');
    const priceInp = document.getElementById('admin-product-price');
    const costInp = document.getElementById('admin-product-cost');
    const descInp = document.getElementById('admin-product-desc');
    
    if (!nameInp || !catSelect || !imgSelect || !priceInp || !costInp || !descInp) return;
    
    const nameVal = sanitizeInput(nameInp.value);
    const catVal = catSelect.value;
    let imgVal = imgSelect.value;
    const priceVal = parseInt(priceInp.value);
    const costVal = parseInt(costInp.value);
    const descVal = sanitizeInput(descInp.value);
    
    if (isNaN(priceVal) || priceVal < 0 || isNaN(costVal) || costVal < 0) {
        showToast("Harga Jual dan Harga Modal harus berupa angka positif!", "error");
        return;
    }
    
    if (imgVal === 'custom') {
        if (!STATE.currentProductImageBase64) {
            showToast("Harap unggah gambar kustom terlebih dahulu!", "error");
            return;
        }
        imgVal = STATE.currentProductImageBase64;
    }
    
    if (editingProductId) {
        const idx = PRODUCTS.findIndex(p => p.id === editingProductId);
        if (idx !== -1) {
            PRODUCTS[idx].name = nameVal;
            PRODUCTS[idx].category = catVal;
            PRODUCTS[idx].image = imgVal;
            PRODUCTS[idx].basePrice = priceVal;
            PRODUCTS[idx].costPrice = costVal;
            PRODUCTS[idx].desc = descVal;
            
            // Synchronize active cart prices instantly
            syncCartItemPrices(editingProductId, priceVal);
            
            showToast("Menu berhasil diperbarui!", "success");
        }
    } else {
        const newP = {
            id: 'p_' + Date.now(),
            name: nameVal,
            basePrice: priceVal,
            costPrice: costVal,
            rating: 4.8,
            reviewsCount: 1,
            category: catVal,
            image: imgVal,
            desc: descVal
        };
        PRODUCTS.push(newP);
        showToast(`Menu "${nameVal}" berhasil ditambahkan!`, "success");
    }
    
    saveProducts();
    
    renderCategoryTabs();
    renderProductsGrid();
    renderFeaturedPicks();
    renderAdminCrudList();
    closeProductModal();
}

function deleteProduct(productId) {
    const p = PRODUCTS.find(prod => prod.id === productId);
    if (!p) return;
    
    if (confirm(`Apakah Anda yakin ingin menghapus menu "${p.name}"?`)) {
        PRODUCTS = PRODUCTS.filter(prod => prod.id !== productId);
        saveProducts();
        
        // Remove deleted product from active shopping carts
        removeProductFromCart(productId);
        
        renderCategoryTabs();
        renderProductsGrid();
        renderFeaturedPicks();
        renderAdminCrudList();
        
        showToast(`Menu "${p.name}" berhasil dihapus.`, "info");
    }
}

function downloadQrisCode() {
    const container = document.getElementById('qris-qr-code-container');
    if (!container) return;
    
    const img = container.querySelector('img');
    const svg = container.querySelector('svg');
    
    const shopName = (STATE.shopName || "Kopi Kita").replace(/\s+/g, '-').toLowerCase();
    const filename = `qris-${shopName}.png`;
    
    if (img && img.src) {
        // Custom uploaded base64 image
        const link = document.createElement('a');
        link.href = img.src;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Gambar QRIS berhasil diunduh!", "success");
    } else if (svg) {
        // Default system SVG, let's render it to canvas so it downloads as a PNG image!
        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = 400; // high res
            canvas.height = 400;
            const context = canvas.getContext('2d');
            
            // Fill white background for scanability
            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw the SVG image
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            
            // Trigger download
            const pngDataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngDataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(blobURL);
            showToast("Kode QRIS Sistem berhasil diunduh!", "success");
        };
        image.onerror = function() {
            // Fallback to direct SVG file download
            const link = document.createElement('a');
            link.href = blobURL;
            link.download = `qris-${shopName}.svg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("QRIS diunduh sebagai berkas vektor SVG.", "success");
        };
        image.src = blobURL;
    } else {
        showToast("Gagal menemukan kode QRIS untuk diunduh.", "error");
    }
}

// Global exports for HTML hooks
window.openBaristaLogin = openBaristaLogin;
window.closeBaristaLogin = closeBaristaLogin;
window.enterDigitPin = enterDigitPin;
window.clearDigitPin = clearDigitPin;
window.submitBaristaPin = submitBaristaPin;
window.switchBaristaMode = switchBaristaMode;
window.setKdsView = setKdsView;
window.completeBaristaOrder = completeBaristaOrder;
window.removeQrisProof = removeQrisProof;
window.openPaymentProofModal = openPaymentProofModal;
window.closePaymentProofModal = closePaymentProofModal;

// Portal Admin Global Exports
window.switchAdminMode = switchAdminMode;
window.switchAdminTab = switchAdminTab;
window.setAdminPeriod = setAdminPeriod;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProductForm = saveProductForm;
window.deleteProduct = deleteProduct;
window.renderFeaturedPicks = renderFeaturedPicks;

// Custom uploaded downscaling, shop settings, calendar and receipt triggers exports
window.toggleProductImageSource = toggleProductImageSource;
window.handleProductImageUpload = handleProductImageUpload;
window.handleQrisImageUpload = handleQrisImageUpload;
window.resetQrisToDefault = resetQrisToDefault;
window.saveSettingsForm = saveSettingsForm;
window.applyCustomDateFilter = applyCustomDateFilter;
window.applyCustomMonthFilter = applyCustomMonthFilter;
window.triggerPrintReceipt = triggerPrintReceipt;
window.closeReceiptModal = closeReceiptModal;
window.downloadQrisCode = downloadQrisCode;

