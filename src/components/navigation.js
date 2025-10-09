// Persistent navigation
const NAV_STATUS_SEL = '[data-navigation-status]';
const NAV_TOGGLE_SEL = '[data-navigation-toggle="toggle"]';
const NAV_CLOSE_SEL = '[data-navigation-toggle="close"]';
const NAV_LINK_SEL = '[data-navigation] a[href]:not([target="_blank"]):not([data-no-barba])';

let scrollPosition = 0;
let navIsOpen = false;

function navEl() {
  return document.querySelector(NAV_STATUS_SEL);
}

export function openNav() {
  const el = navEl();
  if (el) {
    el.setAttribute('data-navigation-status', 'active');
    navIsOpen = true;
    
    scrollPosition = window.pageYOffset;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
  }
}

export function closeNav(skipScrollRestore = false) {
  const el = navEl();
  if (el) {
    el.setAttribute('data-navigation-status', 'not-active');
    
    // Only restore scroll if nav was actually open AND we're not navigating
    if (navIsOpen) {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      
      // Only restore scroll if NOT navigating (e.g., ESC key, close button)
      if (!skipScrollRestore) {
        window.scrollTo(0, scrollPosition);
      }
      
      navIsOpen = false;
    }
  }
}

function toggleNav() {
  const el = navEl();
  if (!el) return;
  const isActive = el.getAttribute('data-navigation-status') === 'active';
  el.setAttribute('data-navigation-status', isActive ? 'not-active' : 'active');
}

export function updateActiveNavLinks(pathname = location.pathname) {
  let links = document.querySelectorAll(NAV_LINK_SEL);
  
  if (links.length === 0) {
    links = document.querySelectorAll('.hamburger-nav a[href]:not([target="_blank"])');
  }
  
  if (links.length === 0) {
    links = document.querySelectorAll('nav a[href]:not([target="_blank"]):not([data-taxi-ignore])');
  }
  
  links.forEach((a) => {
    const href = a.getAttribute('href') || '';
    try {
      const url = new URL(href, location.origin);
      const isActive = url.pathname === pathname;
      a.classList.toggle('w--current', isActive);
      if (isActive) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    } catch (e) {
      // Invalid URL, skip
    }
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

  document.querySelectorAll(NAV_LINK_SEL).forEach((a) => {
    a.addEventListener('click', () => closeNav(true), { signal: ac.signal });
  });
}
