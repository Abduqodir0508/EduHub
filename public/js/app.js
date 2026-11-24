// EduHub Frontend Application Logic

const state = {
  user: null,
  token: localStorage.getItem('eduhub_access_token') || null,
  courses: [],
  searchQuery: ''
};

// API Asosiy yordamchi funksiya
async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token && { 'Authorization': `Bearer ${state.token}` }),
    ...options.headers
  };

  try {
    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include' // Cookie (Refresh token) uzatish uchun
    });

    const data = await response.json();

    // Agar email tasdiqlanmaganligi sababli 403 qaytsa -> /verify-email ga yo'naltirish
    if (response.status === 403 && data?.requireVerification) {
      if (data.email) {
        localStorage.setItem('eduhub_pending_email', data.email);
        window.location.href = `/verify-email?email=${encodeURIComponent(data.email)}`;
      }
    }

    // Agar token muddati tugagan bo'lsa (401), refresh token orqali yangilashga urinish
    if (response.status === 401 && state.token && endpoint !== '/auth/refresh' && endpoint !== '/auth/login') {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        // Qaytadan so'rov yuborish
        headers['Authorization'] = `Bearer ${state.token}`;
        const retryResponse = await fetch(endpoint, { ...options, headers, credentials: 'include' });
        return await retryResponse.json();
      }
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error('API xatolik:', error);
    return { ok: false, error: error.message };
  }
}

// Refresh token orqali access tokenni yangilash
async function tryRefreshToken() {
  try {
    const res = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const result = await res.json();
    if (res.ok && result.accessToken) {
      state.token = result.accessToken;
      localStorage.setItem('eduhub_access_token', result.accessToken);
      return true;
    } else {
      handleLogoutLocal();
      return false;
    }
  } catch (e) {
    handleLogoutLocal();
    return false;
  }
}

// ================= SAHIFA YUKLANGANDA =================
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  await loadCourses();
});

// Foydalanuvchi profilini tekshirish
async function checkAuth() {
  if (!state.token) {
    renderNavbar();
    return;
  }

  const res = await apiRequest('/profile');
  if (res.ok && res.data.success) {
    state.user = res.data.data;
    if (state.user.role === 'admin') {
      loadAdminDashboard();
    }
  } else {
    handleLogoutLocal();
  }
  renderNavbar();
}

// Kurslarni bazadan yuklash
async function loadCourses() {
  const container = document.getElementById('courses-grid');
  const res = await apiRequest('/courses');

  if (res.ok && res.data.success) {
    state.courses = res.data.data || [];
    renderCourses();
  } else {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center text-rose-500">
        <i class="fa-solid fa-triangle-exclamation text-3xl mb-2"></i>
        <p>Kurslarni yuklashda xatolik yuz berdi.</p>
      </div>
    `;
  }
}

// Admin statistikasini yuklash
async function loadAdminDashboard() {
  const section = document.getElementById('admin-dashboard-section');
  const heroAdminBtn = document.getElementById('hero-admin-create-btn');
  const navAdminBadge = document.getElementById('nav-admin-badge');

  if (!state.user || state.user.role !== 'admin') {
    section.classList.add('hidden');
    if (heroAdminBtn) heroAdminBtn.classList.add('hidden');
    if (navAdminBadge) navAdminBadge.classList.add('hidden');
    return;
  }

  const res = await apiRequest('/admin/dashboard');
  if (res.ok && res.data.success) {
    const stats = res.data.data.stats;
    document.getElementById('stat-total-users').innerText = stats.totalUsers || 0;
    document.getElementById('stat-total-courses').innerText = stats.totalCourses || 0;

    section.classList.remove('hidden');
    if (heroAdminBtn) heroAdminBtn.classList.remove('hidden');
    if (navAdminBadge) navAdminBadge.classList.remove('hidden');
  }
}

// ================= RENDER FUNKSIYALARI =================

// Navbar tugmalarini holatga qarab chizish
function renderNavbar() {
  const container = document.getElementById('auth-actions');

  if (!state.user) {
    container.innerHTML = `
      <button onclick="openModal('login-modal')" class="px-5 py-2.5 text-sm font-bold text-slate-700 hover:text-brand-600 transition">
        Kirish
      </button>
      <button onclick="openModal('register-modal')" class="px-5 py-2.5 text-sm font-bold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md shadow-brand-500/20 transition">
        Ro'yxatdan o'tish
      </button>
    `;
  } else {
    const isAdmin = state.user.role === 'admin';
    container.innerHTML = `
      <div class="flex items-center gap-3">
        <button onclick="openProfileModal()" class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition text-sm">
          <div class="w-7 h-7 rounded-lg ${isAdmin ? 'bg-amber-500' : 'bg-brand-600'} text-white flex items-center justify-center text-xs font-bold">
            ${state.user.email.charAt(0).toUpperCase()}
          </div>
          <span class="font-semibold text-slate-800 max-w-[140px] truncate">${state.user.email}</span>
        </button>
        <button onclick="handleLogout()" title="Chiqish" class="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 flex items-center justify-center transition">
          <i class="fa-solid fa-arrow-right-from-bracket text-sm"></i>
        </button>
      </div>
    `;
  }
}

// Kurslarni ekranga chiqarish
function renderCourses() {
  const container = document.getElementById('courses-grid');
  const filtered = state.courses.filter(c => 
    c.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-300">
        <i class="fa-solid fa-folder-open text-4xl mb-3 text-slate-300"></i>
        <h4 class="text-base font-bold text-slate-700">Hech qanday kurs topilmadi</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Hozircha birorta kurs joylanmagan yoki qidiruv so'rovingizga mos kurs mavjud emas.</p>
        ${state.user?.role === 'admin' ? `
          <button onclick="openCreateModal()" class="mt-4 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl transition">
            Birinchi kursni yaratish
          </button>
        ` : ''}
      </div>
    `;
    return;
  }

  const isAdmin = state.user?.role === 'admin';

  container.innerHTML = filtered.map(course => {
    // Tasodifiy ranglar gradienti
    const colors = [
      'from-blue-600 to-indigo-600',
      'from-violet-600 to-purple-600',
      'from-emerald-600 to-teal-600',
      'from-rose-600 to-pink-600',
      'from-amber-500 to-orange-600'
    ];
    const hash = course.title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = colors[hash % colors.length];

    const formattedPrice = new Intl.NumberFormat('uz-UZ').format(course.price);
    const authorEmail = course.createdBy?.email || 'EduHub Ustoz';

    return `
      <div class="course-card bg-white rounded-3xl border border-slate-200 overflow-hidden flex flex-col justify-between">
        <div>
          <!-- Karta Yuqori Qismi (Banner) -->
          <div class="h-44 bg-gradient-to-tr ${gradient} p-6 flex flex-col justify-between text-white relative">
            <span class="inline-block self-start px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider">
              EduHub Kursi
            </span>
            <div class="flex items-center justify-between">
              <span class="text-2xl font-extrabold">${formattedPrice} <span class="text-xs font-normal">so'm</span></span>
              <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
            </div>
          </div>

          <!-- Karta Matni -->
          <div class="p-6">
            <h3 class="text-xl font-bold text-slate-900 line-clamp-1 mb-2" title="${escapeHtml(course.title)}">
              ${escapeHtml(course.title)}
            </h3>
            <p class="text-slate-500 text-sm line-clamp-3 leading-relaxed mb-4">
              ${escapeHtml(course.description)}
            </p>
          </div>
        </div>

        <!-- Karta Pastki Qismi -->
        <div class="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div class="flex items-center gap-2 text-xs text-slate-500 truncate mr-2">
            <i class="fa-solid fa-user-tie text-slate-400"></i>
            <span class="truncate">${escapeHtml(authorEmail)}</span>
          </div>

          <!-- Admin amallari -->
          ${isAdmin ? `
            <div class="flex items-center gap-2">
              <button onclick="openEditModal('${course._id}')" title="Tahrirlash" class="w-8 h-8 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="handleDeleteCourse('${course._id}')" title="O'chirish" class="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition">
                <i class="fa-solid fa-trash text-xs"></i>
              </button>
            </div>
          ` : `
            <button onclick="showToast('Kursga yozilish tez kunda ishga tushadi!', 'info')" class="px-4 py-2 bg-slate-900 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition">
              Batafsil
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');
}

// Qidiruv
function handleSearch(query) {
  state.searchQuery = query;
  renderCourses();
}

// ================= AUTH FORMLARI =================

// Login
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-submit-btn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Kirilmoqda...`;

  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

  btn.disabled = false;
  btn.innerHTML = `Kirish`;

  // Agar email tasdiqlanmagan bo'lsa -> /verify-email sahifasiga yo'naltirish
  if (res.data?.requireVerification) {
    showToast(res.data.message || "Elektron pochtangiz tasdiqlanmagan!", 'info');
    localStorage.setItem('eduhub_pending_email', email);
    setTimeout(() => {
      window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
    }, 1200);
    return;
  }

  if (res.ok && res.data.success) {
    state.token = res.data.accessToken;
    state.user = res.data.user;
    localStorage.setItem('eduhub_access_token', state.token);

    closeModal('login-modal');
    document.getElementById('login-form').reset();
    showToast(`Xush kelibsiz, ${state.user.email}!`, 'success');

    renderNavbar();
    renderCourses();
    if (state.user.role === 'admin') loadAdminDashboard();
  } else {
    showToast(res.data?.message || 'Kirishda xatolik yuz berdi', 'error');
  }
}

// Register
async function handleRegister(e) {
  e.preventDefault();
  const email = document.getElementById('register-email').value;
  const password = document.getElementById('register-password').value;
  const role = document.getElementById('register-role').value;
  const btn = document.getElementById('register-submit-btn');

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Yaratilmoqda...`;

  const res = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, role })
  });

  btn.disabled = false;
  btn.innerHTML = `Hisob yaratish`;

  if (res.ok && res.data.success) {
    showToast(res.data.message || "Ro'yxatdan muvaffaqiyatli o'tildi!", 'success');
    closeModal('register-modal');
    document.getElementById('register-form').reset();

    // Agar tasdiqlash talab qilinsa, darhol /verify-email ga yo'naltirish
    if (res.data.requireVerification) {
      localStorage.setItem('eduhub_pending_email', email);
      setTimeout(() => {
        window.location.href = `/verify-email?email=${encodeURIComponent(email)}`;
      }, 1000);
    } else {
      document.getElementById('login-email').value = email;
      openModal('login-modal');
    }
  } else {
    showToast(res.data?.message || "Ro'yxatdan o'tishda xatolik", 'error');
  }
}

// Logout
async function handleLogout() {
  await apiRequest('/auth/logout', { method: 'POST' });
  handleLogoutLocal();
  showToast("Tizimdan muvaffaqiyatli chiqildi", 'info');
}

function handleLogoutLocal() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('eduhub_access_token');
  closeModal('profile-modal');
  renderNavbar();
  renderCourses();

  document.getElementById('admin-dashboard-section').classList.add('hidden');
  const heroBtn = document.getElementById('hero-admin-create-btn');
  if (heroBtn) heroBtn.classList.add('hidden');
  const navBadge = document.getElementById('nav-admin-badge');
  if (navBadge) navBadge.classList.add('hidden');
}

// Profil modalini ochish
function openProfileModal() {
  if (!state.user) return;

  document.getElementById('profile-id').innerText = state.user._id || state.user.id || 'N/A';
  document.getElementById('profile-email').innerText = state.user.email;
  
  const roleBadge = document.getElementById('profile-role-badge');
  if (state.user.role === 'admin') {
    roleBadge.innerText = 'Administrator';
    roleBadge.className = 'inline-block mt-1 px-3 py-0.5 text-xs font-bold rounded-full uppercase bg-amber-100 text-amber-800 border border-amber-300';
  } else {
    roleBadge.innerText = 'Talaba';
    roleBadge.className = 'inline-block mt-1 px-3 py-0.5 text-xs font-bold rounded-full uppercase bg-brand-100 text-brand-800 border border-brand-200';
  }

  const createdAt = state.user.createdAt ? new Date(state.user.createdAt).toLocaleDateString('uz-UZ') : 'Yaqinda';
  document.getElementById('profile-created-at').innerText = createdAt;

  openModal('profile-modal');
}

// ================= KURSLAR CRUD AMALLARI =================

// Yangi kurs yaratish modalini ochish
function openCreateModal() {
  if (!state.user || state.user.role !== 'admin') {
    showToast("Kurs yaratish faqat adminlar uchun!", 'error');
    return;
  }

  document.getElementById('course-form').reset();
  document.getElementById('course-id').value = '';
  document.getElementById('course-modal-title').innerText = 'Yangi kurs qo\'shish';
  document.getElementById('course-modal-icon').className = 'fa-solid fa-plus';
  openModal('course-modal');
}

// Kursni tahrirlash modalini ochish
function openEditModal(courseId) {
  const course = state.courses.find(c => c._id === courseId);
  if (!course) return;

  document.getElementById('course-id').value = course._id;
  document.getElementById('course-title').value = course.title;
  document.getElementById('course-price').value = course.price;
  document.getElementById('course-description').value = course.description;

  document.getElementById('course-modal-title').innerText = 'Kursni tahrirlash';
  document.getElementById('course-modal-icon').className = 'fa-solid fa-pen';
  openModal('course-modal');
}

// Kursni saqlash (Create yoki Update)
async function handleCourseSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('course-id').value;
  const title = document.getElementById('course-title').value;
  const price = Number(document.getElementById('course-price').value);
  const description = document.getElementById('course-description').value;

  const btn = document.getElementById('course-submit-btn');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saqlanmoqda...`;

  let res;
  if (id) {
    // PUT /courses/:id
    res = await apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title, price, description })
    });
  } else {
    // POST /courses
    res = await apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify({ title, price, description })
    });
  }

  btn.disabled = false;
  btn.innerHTML = `<i class="fa-solid fa-save mr-1"></i> Saqlash`;

  if (res.ok && res.data.success) {
    showToast(id ? 'Kurs muvaffaqiyatli yangilandi!' : 'Yangi kurs yaratildi!', 'success');
    closeModal('course-modal');
    await loadCourses();
    if (state.user?.role === 'admin') loadAdminDashboard();
  } else {
    showToast(res.data?.message || 'Xatolik yuz berdi', 'error');
  }
}

// Kursni o'chirish
async function handleDeleteCourse(courseId) {
  if (!confirm("Haqiqatan ham bu kursni o'chirmoqchimisiz?")) return;

  const res = await apiRequest(`/courses/${courseId}`, {
    method: 'DELETE'
  });

  if (res.ok && res.data.success) {
    showToast("Kurs muvaffaqiyatli o'chirildi", 'success');
    await loadCourses();
    if (state.user?.role === 'admin') loadAdminDashboard();
  } else {
    showToast(res.data?.message || "Kursni o'chirishda xatolik", 'error');
  }
}

// ================= MODAL & TOAST YORDAMCHILARI =================

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function switchModal(fromId, toId) {
  closeModal(fromId);
  openModal(toId);
}

// Toast xabarlari
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const icons = {
    success: 'fa-circle-check text-emerald-500',
    error: 'fa-circle-xmark text-rose-500',
    info: 'fa-circle-info text-sky-500'
  };

  toast.className = `toast flex items-center gap-3 px-5 py-3.5 bg-white rounded-2xl shadow-xl border border-slate-200 text-sm font-semibold text-slate-800 min-w-[280px]`;
  toast.innerHTML = `
    <i class="fa-solid ${icons[type] || icons.info} text-lg"></i>
    <span class="flex-1">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
