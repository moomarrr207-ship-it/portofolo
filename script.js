const defaultServices = [
    { title: 'أعمال الكهرباء', price: 'حسب المعاينة', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85', description: 'تركيب وصيانة متكاملة، تصليح الأعطال، وشبكات التيار الخفيف.' },
    { title: 'التشطيبات والديكورات', price: 'حسب المشروع', image: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85', description: 'تنفيذ أعمال التشطيبات والديكورات بإشراف فني كامل.' },
    { title: 'الدهانات والصبغ', price: 'عرض سعر مجاني', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=85', description: 'صبغ داخلي وخارجي بأحدث الألوان والخامات وبدون عيوب.' },
    { title: 'البناء والأعمال المعدنية', price: 'حسب المقاس', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=85', description: 'ملاحق ومجالس وبوابات حديد واستانلس ودربزين.' },
    { title: 'الجبسبورد والأثاث', price: 'حسب التصميم', image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=900&q=85', description: 'جبسبورد وجي آر سي وستائر وأثاث بتصاميم عصرية.' },
    { title: 'النوافذ والزجاج', price: 'حسب الطلب', image: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=900&q=85', description: 'ألمنيوم وشبابيك UPVC وشاورات ومرايا عصرية.' }
];

const storage = {
    services() { return JSON.parse(localStorage.getItem('aljameh_services') || 'null') || defaultServices; },
    saveServices(items) { localStorage.setItem('aljameh_services', JSON.stringify(items)); },
    gallery() { return JSON.parse(localStorage.getItem('aljameh_gallery') || '[]'); },
    saveGallery(items) { localStorage.setItem('aljameh_gallery', JSON.stringify(items)); },
    settings() { return JSON.parse(localStorage.getItem('aljameh_settings') || 'null') || { company: 'شركة الجميح', phone: '33071772', location: 'الدوحة، قطر', description: 'نقدم خدمات صيانة مبانٍ وأعمال كهرباء احترافية للمنازل والشركات والمنشآت.' }; },
    saveSettings(value) { localStorage.setItem('aljameh_settings', JSON.stringify(value)); },
    account() { return JSON.parse(localStorage.getItem('aljameh_account') || 'null') || { username: 'admin', password: 'admin 123' }; },
    saveAccount(value) { localStorage.setItem('aljameh_account', JSON.stringify(value)); },
    orders() { return JSON.parse(localStorage.getItem('aljameh_orders') || '[]'); },
    saveOrders(items) { localStorage.setItem('aljameh_orders', JSON.stringify(items)); }
};

async function syncFromDatabase() {
    const response = await fetch('/api/site-data');
    if (!response.ok) throw new Error('تعذر الاتصال بقاعدة البيانات');
    const data = await response.json();
    storage.saveServices(data.services.map(item => ({ ...item, image: item.image })));
    storage.saveGallery(data.gallery);
    storage.saveSettings(data.settings);
    return data;
}

async function databaseRequest(url, options = {}) {
    const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || 'تعذر تنفيذ العملية');
    return data;
}

const Toast = {
    show(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast-msg ${type}`;
        toast.innerHTML = `<i class="fa-solid ${type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check'}"></i><span>${message}</span>`;
        container.appendChild(toast);
        window.setTimeout(() => toast.remove(), 4000);
    }
};

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function initPublicSite() {
    const menuButton = document.getElementById('mobile-menu');
    const navLinks = document.getElementById('nav-links');
    if (menuButton && navLinks) {
        menuButton.addEventListener('click', () => {
            navLinks.classList.toggle('open');
            menuButton.innerHTML = navLinks.classList.contains('open') ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });
        navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => navLinks.classList.remove('open')));
    }

    const reveals = document.querySelectorAll('.reveal');
    const reveal = () => reveals.forEach(item => {
        if (item.getBoundingClientRect().top < window.innerHeight - 60) item.classList.add('active');
    });
    window.addEventListener('scroll', reveal, { passive: true });
    reveal();

    renderPublicServices();
    renderPublicGallery();
    applySiteSettings();
    syncFromDatabase().then(() => {
        renderPublicServices();
        renderPublicGallery();
        applySiteSettings();
    }).catch(() => Toast.show('تعذر تحميل آخر بيانات الموقع', 'error'));
    initPaymentForm();
    initMessageForm();
    document.querySelectorAll('[data-payment-method]').forEach(card => card.addEventListener('click', () => {
        const service = storage.services()[0] || { title: 'طلب خدمة', price: 'حسب المعاينة' };
        openPaymentModal(service.title, service.price, card.dataset.paymentMethod);
    }));
}

function initMessageForm() {
    const form = document.getElementById('message-form');
    if (!form) return;
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = document.getElementById('message-submit');
        button.disabled = true;
        try {
            const data = await databaseRequest('/api/messages', { method: 'POST', body: JSON.stringify({ name: document.getElementById('message-name').value.trim(), phone: document.getElementById('message-phone').value.trim(), service: document.getElementById('message-service').value, preferred_date: document.getElementById('message-date').value || 'لم يحدد', message: document.getElementById('message-text').value.trim() }) });
            form.reset();
            Toast.show(data.message);
        } catch (error) { Toast.show(error.message, 'error'); }
        button.disabled = false;
    });
}

function renderPublicGallery() {
    const grid = document.getElementById('public-gallery-grid');
    if (!grid) return;
    const gallery = storage.gallery();
    grid.innerHTML = gallery.length ? gallery.map(item => `<figure class="project-card reveal active"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy"><figcaption>${escapeHtml(item.title)}</figcaption></figure>`).join('') : '<div class="loader-container"><p class="text-muted">سيتم إضافة صور الأعمال قريباً.</p></div>';
}

function applySiteSettings() {
    const settings = storage.settings();
    const title = document.getElementById('site-title');
    const brand = document.getElementById('brand-company');
    const heroDescription = document.getElementById('hero-description');
    const headerPhone = document.getElementById('header-phone');
    const footerPhone = document.getElementById('footer-phone');
    const footerLocation = document.getElementById('footer-location');
    if (title) title.textContent = `${settings.company} | صيانة المباني وأعمال الكهرباء`;
    if (brand) brand.textContent = settings.company;
    if (heroDescription) heroDescription.textContent = settings.description;
    [headerPhone, footerPhone].forEach(element => { if (element) { element.textContent = settings.phone; element.href = `tel:${settings.phone}`; } });
    if (footerLocation) footerLocation.textContent = settings.location;
}

function renderPublicServices() {
    const grid = document.getElementById('public-services-grid');
    if (!grid) return;
    grid.innerHTML = storage.services().map((service, index) => `
        <article class="service-card glass-card reveal active">
            <div class="s-img-wrapper"><img src="${escapeHtml(service.image)}" class="s-img" alt="${escapeHtml(service.title)}" loading="lazy"><div class="s-overlay-gradient"></div><div class="s-price-tag">${escapeHtml(service.price)}</div></div>
            <div class="s-content"><h3>${escapeHtml(service.title)}</h3><p>${escapeHtml(service.description)}</p><button class="btn btn-primary w-100 mt-10" data-service-index="${index}"><i class="fa-solid fa-phone"></i> اطلب الخدمة الآن</button></div>
        </article>
    `).join('');
    grid.querySelectorAll('[data-service-index]').forEach(button => button.addEventListener('click', () => {
        const service = storage.services()[Number(button.dataset.serviceIndex)];
        openPaymentModal(service.title, service.price);
    }));
}

function openPaymentModal(title, price, method = '') {
    const modal = document.getElementById('payment-modal');
    if (!modal) return;
    document.getElementById('checkout-service-name').textContent = title;
    document.getElementById('checkout-service-price').textContent = price;
    document.getElementById('checkout-payment-method').textContent = method || 'لم تحدد';
    document.getElementById('payment-method').value = method;
    modal.style.display = 'flex';
}

window.closePaymentModal = () => {
    const modal = document.getElementById('payment-modal');
    if (modal) modal.style.display = 'none';
};

function initPaymentForm() {
    const form = document.getElementById('payment-form');
    if (!form) return;
    form.addEventListener('submit', event => {
        event.preventDefault();
        const button = document.getElementById('btn-process-payment');
        const title = document.getElementById('checkout-service-name').textContent;
        const price = document.getElementById('checkout-service-price').textContent;
        const method = document.getElementById('checkout-payment-method').textContent;
        const customer = document.getElementById('payment-customer').value.trim();
        const phone = document.getElementById('payment-phone').value.trim();
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري تسجيل الطلب...';
        window.setTimeout(() => {
            databaseRequest('/api/orders', { method: 'POST', body: JSON.stringify({ service: title, price, customer: `${customer} - ${phone}`, method }) }).then(() => {
                window.closePaymentModal();
                form.reset();
                button.disabled = false;
                button.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد طلب الدفع';
                Toast.show('تم تسجيل طلبك، سنتواصل معك قريباً.');
            }).catch(error => {
                button.disabled = false;
                button.innerHTML = '<i class="fa-solid fa-check"></i> تأكيد طلب الدفع';
                Toast.show(error.message, 'error');
            });
        }, 700);
    });
}

function showAdminDashboard() {
    const overlay = document.getElementById('login-overlay');
    const dashboard = document.getElementById('admin-dashboard');
    if (overlay) overlay.style.display = 'none';
    if (dashboard) dashboard.style.display = 'flex';
    refreshAdminPanel();
}

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }
        if (!file.type.startsWith('image/')) {
            reject(new Error('اختار ملف صورة صالح')); 
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            reject(new Error('حجم الصورة يجب ألا يتجاوز 2 ميجابايت'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const image = new Image();
            image.onload = () => {
                const maxSize = 1400;
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);
                canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            image.onerror = () => reject(new Error('تعذر تجهيز الصورة'));
            image.src = reader.result;
        };
        reader.onerror = () => reject(new Error('تعذر قراءة الصورة'));
        reader.readAsDataURL(file);
    });
}

function initAdminSite() {
    const loginForm = document.getElementById('admin-login-form');
    if (!loginForm) return;
    const mobileMenu = document.getElementById('mobile-admin-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => document.body.classList.toggle('admin-mobile-open'));
    }
    const loggedIn = sessionStorage.getItem('aljameh_admin_logged') === 'true';
    if (loggedIn) {
        fetch('/api/auth/check').then(response => response.json()).then(auth => {
            if (auth.is_admin) showAdminDashboard();
            else sessionStorage.removeItem('aljameh_admin_logged');
        }).catch(() => sessionStorage.removeItem('aljameh_admin_logged'));
    }

    const galleryFile = document.getElementById('g-file');
    const galleryPreview = document.getElementById('g-preview');
    galleryFile.addEventListener('change', () => {
        const file = galleryFile.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
            Toast.show('اختار صورة أقل من 2 ميجابايت', 'error');
            galleryFile.value = '';
            galleryPreview.hidden = true;
            return;
        }
        galleryPreview.src = URL.createObjectURL(file);
        galleryPreview.hidden = false;
    });

    const imageFile = document.getElementById('s-file');
    const imagePreview = document.getElementById('s-preview');
    imageFile.addEventListener('change', () => {
        const file = imageFile.files[0];
        if (!file) {
            imagePreview.hidden = true;
            return;
        }
        if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) {
            Toast.show('الصورة يجب أن تكون أقل من 2 ميجابايت وبصيغة صحيحة', 'error');
            imageFile.value = '';
            imagePreview.hidden = true;
            return;
        }
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.hidden = false;
    });

    loginForm.addEventListener('submit', event => {
        event.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;
        const button = document.getElementById('btn-submit-login');
        button.disabled = true;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
            window.setTimeout(async () => {
                try {
                    await databaseRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
                sessionStorage.setItem('aljameh_admin_logged', 'true');
                showAdminDashboard();
                Toast.show('تم تسجيل الدخول بنجاح');
                } catch (error) {
                    Toast.show(error.message, 'error');
                button.disabled = false;
                button.innerHTML = 'مصادقة الدخول <i class="fa-solid fa-arrow-left"></i>';
            }
        }, 350);
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        sessionStorage.removeItem('aljameh_admin_logged');
            fetch('/api/auth/logout', { method: 'POST' });
            window.location.reload();
    });

    document.querySelectorAll('.sidebar-nav li[data-tab]').forEach(tab => tab.addEventListener('click', () => {
        document.querySelectorAll('.sidebar-nav li[data-tab]').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active-section'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active-section');
        document.getElementById('page-title').textContent = tab.textContent.trim();
        document.body.classList.remove('admin-mobile-open');
    }));

    document.querySelectorAll('.overview-action[data-tab]').forEach(card => card.addEventListener('click', () => {
        const target = document.querySelector(`.sidebar-nav li[data-tab="${card.dataset.tab}"]`);
        if (target) target.click();
    }));

    document.getElementById('add-service-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            const uploadedImage = await readImageFile(imageFile.files[0]);
            const services = storage.services();
            const externalImage = document.getElementById('s-img').value.trim();
                const service = { title: document.getElementById('s-title').value.trim(), price: document.getElementById('s-price').value.trim(), image: uploadedImage || externalImage || defaultServices[0].image, description: document.getElementById('s-desc').value.trim() };
                await databaseRequest('/api/services', { method: 'POST', body: JSON.stringify(service) });
                await syncFromDatabase();
            event.target.reset();
            imagePreview.hidden = true;
            refreshAdminPanel();
            Toast.show('تم نشر الخدمة بالصورة على الموقع فوراً');
        } catch (error) {
            Toast.show(error.message, 'error');
        }
    });

    document.getElementById('btn-clear-orders').addEventListener('click', async () => {
        if (window.confirm('مسح كل طلبات الدفع؟')) {
                await databaseRequest('/api/orders', { method: 'DELETE' });
                storage.saveOrders([]);
            refreshAdminPanel();
            Toast.show('تم مسح الطلبات');
        }
    });

    document.getElementById('btn-refresh-messages').addEventListener('click', loadAdminMessages);

    document.getElementById('add-gallery-form').addEventListener('submit', async event => {
        event.preventDefault();
        try {
            const image = await readImageFile(galleryFile.files[0]);
            await databaseRequest('/api/gallery', { method: 'POST', body: JSON.stringify({ title: document.getElementById('g-title').value.trim(), image }) });
            await syncFromDatabase();
            event.target.reset();
            galleryPreview.hidden = true;
            refreshAdminPanel();
            renderPublicGallery();
            Toast.show('تمت إضافة العمل إلى الموقع');
        } catch (error) { Toast.show(error.message, 'error'); }
    });

    const settings = storage.settings();
    document.getElementById('setting-company').value = settings.company;
    document.getElementById('setting-phone').value = settings.phone;
    document.getElementById('setting-location').value = settings.location;
    document.getElementById('setting-description').value = settings.description;
    document.getElementById('site-settings-form').addEventListener('submit', async event => {
        event.preventDefault();
        const settings = { company: document.getElementById('setting-company').value.trim(), phone: document.getElementById('setting-phone').value.trim(), location: document.getElementById('setting-location').value.trim(), description: document.getElementById('setting-description').value.trim() };
        await databaseRequest('/api/settings', { method: 'PUT', body: JSON.stringify(settings) });
        storage.saveSettings(settings);
        applySiteSettings();
        Toast.show('تم تحديث بيانات الموقع');
    });

    const account = storage.account();
    document.getElementById('account-username').value = account.username;
    document.getElementById('account-form').addEventListener('submit', async event => {
        event.preventDefault();
        const account = { username: document.getElementById('account-username').value.trim(), password: document.getElementById('account-password').value };
        await databaseRequest('/api/account', { method: 'PUT', body: JSON.stringify(account) });
        storage.saveAccount(account);
        Toast.show('تم حفظ بيانات الحساب');
        event.target.reset();
    });
}

async function refreshAdminPanel() {
    try { await syncFromDatabase(); } catch (_error) { Toast.show('تعذر مزامنة بيانات الموقع', 'error'); }
    try {
        const stats = await databaseRequest('/api/stats');
        document.getElementById('stat-srv-count').textContent = stats.services;
        document.getElementById('stat-order-count').textContent = stats.orders;
        document.getElementById('stat-gallery-count').textContent = stats.gallery;
        document.getElementById('stat-db-status').textContent = stats.database;
    } catch (_error) {
        document.getElementById('stat-db-status').textContent = 'غير متصلة';
    }
    loadAdminMessages();
    const services = storage.services();
    const serviceBody = document.getElementById('admin-services-tbody');
    const orderBody = document.getElementById('admin-orders-tbody');
    const count = document.getElementById('stat-srv-count');
    if (count) count.textContent = services.length;
    if (serviceBody) {
        serviceBody.innerHTML = services.map((service, index) => `<tr><td><img src="${escapeHtml(service.image)}" class="td-img" alt="" loading="lazy"></td><td><strong>${escapeHtml(service.title)}</strong></td><td class="text-success">${escapeHtml(service.price)}</td><td><button class="btn-delete" data-delete-service="${index}"><i class="fa-solid fa-trash"></i> حذف</button></td></tr>`).join('');
        serviceBody.querySelectorAll('[data-delete-service]').forEach(button => button.addEventListener('click', async () => {
            if (!window.confirm('حذف هذه الخدمة من الموقع؟')) return;
            const current = storage.services();
            const item = current[Number(button.dataset.deleteService)];
            try {
                await databaseRequest(`/api/services/${item.id}`, { method: 'DELETE' });
                current.splice(Number(button.dataset.deleteService), 1);
            } catch (error) {
                Toast.show(error.message, 'error');
                return;
            }
            storage.saveServices(current);
            refreshAdminPanel();
            Toast.show('تم حذف الخدمة');
        }));
    }
    if (orderBody) {
        let orders = storage.orders();
        try {
            orders = await databaseRequest('/api/orders');
            storage.saveOrders(orders);
        } catch (_error) { /* The cached list remains visible if the request fails. */ }
        orderBody.innerHTML = orders.length ? orders.map(order => `<tr><td>${escapeHtml(order.service)}</td><td>${escapeHtml(order.price)}</td><td>${escapeHtml(order.method || 'لم تحدد')}</td><td>${escapeHtml(order.customer)}</td><td>${escapeHtml(order.created_at || order.date || '')}</td><td class="text-success">${escapeHtml(order.status)}</td></tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">لا توجد طلبات حتى الآن</td></tr>';
    }
    const galleryGrid = document.getElementById('admin-gallery-grid');
    if (galleryGrid) {
        galleryGrid.innerHTML = storage.gallery().length ? storage.gallery().map((item, index) => `<div class="admin-gallery-item"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}"><strong>${escapeHtml(item.title)}</strong><button class="btn-delete" data-delete-gallery="${index}"><i class="fa-solid fa-trash"></i></button></div>`).join('') : '<p class="text-muted mt-20">لا توجد أعمال مضافة.</p>';
        galleryGrid.querySelectorAll('[data-delete-gallery]').forEach(button => button.addEventListener('click', async () => {
            const gallery = storage.gallery();
            const item = gallery[Number(button.dataset.deleteGallery)];
            await databaseRequest(`/api/gallery/${item.id}`, { method: 'DELETE' });
            gallery.splice(Number(button.dataset.deleteGallery), 1);
            storage.saveGallery(gallery);
            refreshAdminPanel();
            renderPublicGallery();
            Toast.show('تم حذف العمل');
        }));
    }
}

async function loadAdminMessages() {
    const body = document.getElementById('admin-messages-tbody');
    if (!body) return;
    try {
        const messages = await databaseRequest('/api/messages');
        const unread = messages.filter(item => !item.is_read).length;
        document.getElementById('message-badge').textContent = unread;
        body.innerHTML = messages.length ? messages.map(item => `<tr class="${item.is_read ? '' : 'msg-unread'}"><td><button class="btn-delete message-read" data-message-id="${item.id}">${item.is_read ? 'مقروءة' : 'جديد'}</button></td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.phone)}</td><td>${escapeHtml(item.service)}</td><td>${escapeHtml(item.preferred_date)}</td><td>${escapeHtml(item.message)}</td></tr>`).join('') : '<tr><td colspan="6" class="text-center text-muted">لا توجد رسائل حتى الآن</td></tr>';
        body.querySelectorAll('.message-read').forEach(button => button.addEventListener('click', async () => { await databaseRequest(`/api/messages/${button.dataset.messageId}/read`, { method: 'PUT' }); loadAdminMessages(); }));
    } catch (_error) { body.innerHTML = '<tr><td colspan="6" class="text-center text-danger">تعذر تحميل الرسائل</td></tr>'; }
}

document.addEventListener('DOMContentLoaded', () => {
    initPublicSite();
    initAdminSite();
});
