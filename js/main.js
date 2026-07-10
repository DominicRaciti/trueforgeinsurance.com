// ===== TrueForge Insurance — Main JS =====

// Mobile nav toggle
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navCta = document.querySelector('.nav-cta');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    navCta?.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    hamburger.classList.toggle('is-open');
    if (hamburger.classList.contains('is-open')) {
      spans[0].style.transform = 'translateY(7px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// Close mobile nav on link click
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks?.classList.remove('open');
    navCta?.classList.remove('open');
    const spans = hamburger?.querySelectorAll('span') || [];
    hamburger?.classList.remove('is-open');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

// Active nav link
function setActiveNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}
setActiveNav();

// FAQ accordion
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Contact form submit
// ===== Contact / intake form — REAL delivery via Netlify Forms + optional GHL =====
// Paste your GoHighLevel inbound webhook URL here to also push leads into GHL.
// Leave blank to rely on Netlify Forms alone (leads still captured + emailed).
const TF_GHL_WEBHOOK = '';

const contactForm = document.getElementById('contactForm');
if (contactForm) {
  // Populate ad-attribution hidden fields so every lead carries its source
  (function fillAttribution() {
    const q = new URLSearchParams(location.search);
    const set = (name, val) => {
      const el = contactForm.querySelector('input[name="' + name + '"]');
      if (el && val) el.value = val;
    };
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid'].forEach(k => set(k, q.get(k)));
    set('landing_page', location.href);
    set('referrer', document.referrer);
  })();

  const encode = (form) => new URLSearchParams(new FormData(form)).toString();

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');

    // Validate required fields + consent
    const val = (n) => (contactForm.querySelector('[name="' + n + '"]')?.value || '').trim();
    const consent = contactForm.querySelector('#consent');
    const consentWrap = contactForm.querySelector('#consentWrap');
    const phoneDigits = val('phone').replace(/\D/g, '');
    const missing = !val('firstName') || !val('lastName') || phoneDigits.length < 10 || !val('email') || !(consent && consent.checked);
    if (consentWrap) consentWrap.classList.toggle('invalid', !(consent && consent.checked));
    if (missing) {
      if (!(consent && consent.checked)) {
        consentWrap && consentWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        contactForm.reportValidity();
      }
      return;
    }

    const originalText = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    // Fire GHL webhook (non-blocking, only if configured)
    if (TF_GHL_WEBHOOK) {
      const obj = {};
      new FormData(contactForm).forEach((v, k) => {
        if (obj[k]) { obj[k] = [].concat(obj[k], v); } else { obj[k] = v; }
      });
      obj.source = 'TrueForge Contact Form';
      obj.tcpa_consent_time = new Date().toISOString();
      fetch(TF_GHL_WEBHOOK, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj)
      }).catch(() => {});
    }

    try {
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode(contactForm),
      });
      if (!res.ok) throw new Error('Netlify responded ' + res.status);

      if (typeof gtag === 'function') {
        gtag('event', 'generate_lead', { event_category: 'contact_form', event_label: val('interest') || 'unspecified' });
      }

      // Inline success — replace the form with a confirmation
      const wrap = contactForm.parentElement;
      wrap.innerHTML =
        '<div style="text-align:center;padding:2rem 1rem;">' +
          '<div style="font-size:3rem;margin-bottom:0.5rem;">✅</div>' +
          '<h2 style="color:var(--navy);margin-bottom:0.75rem;">Got it — thank you, ' + (val('firstName') || 'friend') + '!</h2>' +
          '<p style="color:var(--gray);max-width:420px;margin:0 auto 1.25rem;line-height:1.6;">Your information is in my hands. I\'ll review it and reach out ' +
          (val('bestTime') && val('bestTime') !== 'Anytime' ? 'during your preferred time (' + val('bestTime').toLowerCase() + ')' : 'shortly') +
          '. Want to skip the wait?</p>' +
          '<a href="tel:+15743920192" style="display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;background:var(--gold);color:var(--navy);font-weight:800;padding:1rem 1.75rem;border-radius:10px;text-decoration:none;font-size:1.05rem;">📞 Call me now — (574) 392-0192</a>' +
          '<p style="font-size:0.8rem;color:var(--gray);margin-top:1rem;">Or <a href="https://calendly.com/dominic-trueforgeinsurance/30min" target="_blank" rel="noopener" style="color:var(--navy);font-weight:700;">pick a time on my calendar →</a></p>' +
        '</div>';
      window.scrollTo({ top: wrap.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
    } catch (err) {
      // Fallback: let the browser submit natively to the Netlify action page
      btn.textContent = originalText;
      btn.disabled = false;
      contactForm.submit();
    }
  });
}

// Animate elements on scroll
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.product-card, .step, .testimonial-card, .value-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
  observer.observe(el);
});

// Lift the Tidio chat launcher above the sticky mobile call bar so the two
// fixed elements stop colliding at the bottom-right corner (mobile only).
(function liftTidioLauncher() {
  function apply() {
    var host = document.querySelector('#tidio-chat');
    var sr = host && host.shadowRoot;
    if (!sr) return false;
    if (sr.getElementById('tf-tidio-fix')) return true;
    var st = document.createElement('style');
    st.id = 'tf-tidio-fix';
    st.textContent = '@media (max-width:768px){#tidio-chat-root{bottom:80px !important;}}';
    sr.appendChild(st);
    return true;
  }
  if (apply()) return;
  var tries = 0;
  var iv = setInterval(function () {
    if (apply() || ++tries > 40) clearInterval(iv);
  }, 500);
})();
