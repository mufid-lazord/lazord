/* =============================================
   script.js — لازورد Multi-Page Website
   متصل بـ Backend API
============================================= */

/* ===== API CONFIGURATION =====
   عدّل هذا الرابط بعد نشر الباك إند على Render
   مثلاً: https://lazord-api.onrender.com
   لاختبار محلي: http://localhost:5000
============================================= */
const API_URL = 'https://mufid-lazord-api.onrender.com';

/* ===== AUTH HELPERS ===== */
const Auth = {
  getToken: () => localStorage.getItem('lazord_token'),
  setToken: (t) => localStorage.setItem('lazord_token', t),
  clearToken: () => localStorage.removeItem('lazord_token'),
  getUser: () => {
    const u = localStorage.getItem('lazord_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (u) => localStorage.setItem('lazord_user', JSON.stringify(u)),
  clearUser: () => localStorage.removeItem('lazord_user'),
  logout: () => {
    localStorage.removeItem('lazord_token');
    localStorage.removeItem('lazord_user');
  },
  isLoggedIn: () => !!localStorage.getItem('lazord_token'),
};

/* ===== API HELPER ===== */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API error:', err);
    return {
      ok: false,
      status: 0,
      data: { message: 'تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت' },
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {

  /* ===== MOBILE MENU ===== */
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu    = document.getElementById('mobileMenu');

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('active');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);

      const spans = mobileMenuBtn.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'translateY(7.5px) rotate(45deg)';
        spans[1].style.opacity   = '0';
        spans[2].style.transform = 'translateY(-7.5px) rotate(-45deg)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        mobileMenuBtn.setAttribute('aria-expanded', false);
        mobileMenuBtn.querySelectorAll('span').forEach(s => {
          s.style.transform = ''; s.style.opacity = '';
        });
      });
    });
  }

  /* ===== NAVBAR SCROLL SHADOW ===== */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 4px 24px rgba(26,58,42,0.14)'
        : '0 2px 16px rgba(26,58,42,0.08)';
    }, { passive: true });
  }

  /* ===== FAQ ACCORDION ===== */
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const answer   = btn.nextElementSibling;

      document.querySelectorAll('.faq-btn').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.classList.remove('open');
        }
      });

      btn.setAttribute('aria-expanded', String(!expanded));
      answer.classList.toggle('open', !expanded);
    });
  });

  /* ===== CONTACT FORM — REAL API ===== */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = contactForm.querySelector('#firstName').value.trim();
      const lastName  = contactForm.querySelector('#lastName')?.value.trim() || '';
      const email     = contactForm.querySelector('#email').value.trim();
      const phone     = contactForm.querySelector('#phone')?.value.trim() || '';
      const clinic    = contactForm.querySelector('#clinic')?.value.trim() || '';
      const role      = contactForm.querySelector('#role')?.value.trim() || '';

      if (!firstName || !email) {
        showToast('يرجى ملء الاسم الأول والبريد الإلكتروني على الأقل.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        showToast('يرجى إدخال عنوان بريد إلكتروني صحيح.', 'error');
        return;
      }

      const btn = contactForm.querySelector('.btn-submit');
      const originalText = btn.textContent;
      btn.textContent = 'جارٍ الإرسال...';
      btn.disabled = true;

      const { ok, data } = await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ firstName, lastName, email, phone, clinic, role }),
      });

      btn.textContent = originalText;
      btn.disabled = false;

      if (ok) {
        showToast(data.message || 'تم إرسال طلبك بنجاح!', 'success');
        contactForm.reset();
      } else {
        showToast(data.message || 'حدث خطأ، حاول مرة أخرى', 'error');
      }
    });
  }

  /* ===== LOGIN FORM — REAL API ===== */
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email    = loginForm.querySelector('#loginEmail').value.trim();
      const password = loginForm.querySelector('#loginPassword').value;

      if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        showToast('يرجى إدخال عنوان بريد إلكتروني صحيح.', 'error');
        return;
      }

      const btn = loginForm.querySelector('.btn-submit');
      const originalText = btn.textContent;
      btn.textContent = 'جارٍ الدخول...';
      btn.disabled = true;

      const { ok, data } = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      btn.textContent = originalText;
      btn.disabled = false;

      if (ok && data.token) {
        Auth.setToken(data.token);
        Auth.setUser(data.user);
        showToast(`مرحباً ${data.user.name}! جارٍ تحويلك...`, 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1200);
      } else {
        showToast(data.message || 'فشل تسجيل الدخول', 'error');
      }
    });
  }

  /* ===== UPDATE NAVBAR IF LOGGED IN ===== */
  if (Auth.isLoggedIn()) {
    const user = Auth.getUser();
    document.querySelectorAll('.btn-login').forEach(link => {
      if (user?.name) {
        link.textContent = `مرحباً، ${user.name.split(' ')[0]}`;
        link.href = '#';
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('هل تريد تسجيل الخروج؟')) {
            Auth.logout();
            location.reload();
          }
        });
      }
    });
  }

  /* ===== HELPERS ===== */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showToast(message, type = 'success') {
    document.querySelector('.toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    Object.assign(toast.style, {
      position:   'fixed',
      bottom:     '32px',
      left:       '50%',
      transform:  'translateX(-50%) translateY(20px)',
      background: type === 'success' ? '#27ae60' : '#e74c3c',
      color:      '#fff',
      padding:    '14px 28px',
      borderRadius: '10px',
      fontFamily: "'Cairo', sans-serif",
      fontSize:   '0.95rem',
      fontWeight: '600',
      zIndex:     '9999',
      boxShadow:  '0 8px 30px rgba(0,0,0,0.18)',
      opacity:    '0',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
      direction:  'rtl',
      maxWidth:   '90vw',
      textAlign:  'center',
    });

    document.body.appendChild(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      toast.style.opacity   = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }));

    setTimeout(() => {
      toast.style.opacity   = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 350);
    }, 3500);
  }

  window.showToast = showToast;

  /* ===== SCROLL REVEAL ===== */
  const fadeSelectors = [
    '.feature-card', '.stat-card', '.result-card', '.product-card',
    '.scanning-card', '.blog-main', '.blog-thumb', '.workflow-content',
    '.workflow-image', '.contact-info', '.contact-form', '.faq-item',
    '.hero-content', '.hero-image-wrap', '.section-title', '.section-subtitle',
    '.faq-title', '.pricing-card', '.page-hero-content', '.login-card',
  ];

  fadeSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('fade-in');
      el.style.transitionDelay = `${i * 0.07}s`;
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  /* ===== SMOOTH ANCHOR SCROLL ===== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ===== ACTIVE NAV HIGHLIGHT ===== */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  function setActiveLink() {
    const scrollY = window.scrollY + 100;
    sections.forEach(section => {
      const id   = section.getAttribute('id');
      const link = document.querySelector(`.nav-links a[href="#${id}"]`);
      if (link && scrollY >= section.offsetTop && scrollY < section.offsetTop + section.offsetHeight) {
        navLinks.forEach(l => { if (!l.classList.contains('nav-active')) l.style.color = ''; });
        link.style.color = 'var(--green-mid)';
      }
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
});
