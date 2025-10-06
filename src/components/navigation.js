// Persistent navigation (outside Barba container)
const NAV_STATUS_SEL = '[data-navigation-status]';
const NAV_TOGGLE_SEL = '[data-navigation-toggle="toggle"]';
const NAV_CLOSE_SEL = '[data-navigation-toggle="close"]';
const NAV_LINK_SEL =
  '[data-navigation] a[href]:not([target="_blank"]):not([data-no-barba])';

// Store scroll position for restoration
let scrollPosition = 0;

function navEl() {
  return document.querySelector(NAV_STATUS_SEL);
}

export function openNav() {
  const el = navEl();
  if (el) {
    el.setAttribute('data-navigation-status', 'active');
    
    // Lock body scroll and preserve scroll position
    scrollPosition = window.pageYOffset;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
  }
}

export function closeNav() {
  const el = navEl();
  if (el) {
    el.setAttribute('data-navigation-status', 'not-active');
    
    // Unlock body scroll and restore scroll position
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollPosition);
  }
}

function toggleNav() {
  const el = navEl();
  if (!el) return;
  const isActive = el.getAttribute('data-navigation-status') === 'active';
  el.setAttribute('data-navigation-status', isActive ? 'not-active' : 'active');
}

export function updateActiveNavLinks(pathname = location.pathname) {
  const links = document.querySelectorAll(NAV_LINK_SEL);
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    const url = new URL(href, location.origin);
    const isActive = url.pathname === pathname;
    a.classList.toggle('w--current', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

export function initScalingHamburgerNavigation() {
  initScalingHamburgerNavigation._ac?.abort?.();
  const ac = new AbortController();
  initScalingHamburgerNavigation._ac = ac;

  document.querySelectorAll(NAV_TOGGLE_SEL).forEach((btn) => {
    btn.addEventListener('click', toggleNav, { signal: ac.signal });
  });
  document.querySelectorAll(NAV_CLOSE_SEL).forEach((btn) => {
    btn.addEventListener('click', closeNav, { signal: ac.signal });
  });

  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') closeNav();
    },
    { signal: ac.signal }
  );

  // Close on nav link click (Barba will handle SPA navigation)
  document.querySelectorAll(NAV_LINK_SEL).forEach((a) => {
    a.addEventListener('click', () => closeNav(), { signal: ac.signal });
  });
}

