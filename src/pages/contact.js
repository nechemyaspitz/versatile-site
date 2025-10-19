import { setState } from '../core/state.js';

// Page enter animation
function playPageEnterAnimation() {
  // 0. Reveal page immediately (hidden by CSS/transition to prevent FOUC)
  const view = document.querySelector('[data-taxi-view="contact"]');
  if (view) {
    if (window.gsap) {
      window.gsap.set(view, { opacity: 1 });
    } else {
      // Fallback if GSAP not loaded yet
      view.style.opacity = '1';
    }
  }
  
  // 1. Footer: fade in
  if (window.gsap) {
    const footer = document.querySelector('.footer-section');
    if (footer) {
      window.gsap.set(footer, { opacity: 0 });
      window.gsap.to(footer, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.inOut',
        delay: 0.2,
      });
    }
  }
  
  // Future: Add enter animations here (fade in, slide up, etc.)
}

// Page exit animation
function playPageExitAnimation() {
  if (!window.gsap) return Promise.resolve();
  
  const tl = window.gsap.timeline();
  
  // Footer: fade out
  const footer = document.querySelector('.footer-section');
  if (footer) {
    tl.to(footer, {
      opacity: 0,
      duration: 0.6,
      ease: 'power2.inOut',
    }, 0);
  }
  
  return tl;
}

// AJAX form handler
function setupFormHandler() {
  const forms = document.querySelectorAll('.form-ajax');
  const handlers = [];
  
  forms.forEach((form) => {
    const handler = function(e) {
      e.preventDefault();
      
      const formAction = form.getAttribute('action');
      const recaptchaSiteKey = form.getAttribute('data-recaptcha-site-key');
      
      if (recaptchaSiteKey && window.grecaptcha) {
        // reCAPTCHA enabled
        grecaptcha.ready(function() {
          grecaptcha.execute(recaptchaSiteKey, { action: 'submit' }).then(function(token) {
            submitForm(form, formAction, token);
          });
        });
      } else {
        // No reCAPTCHA
        submitForm(form, formAction, null);
      }
    };
    
    form.addEventListener('submit', handler);
    handlers.push({ form, handler });
  });
  
  // Return cleanup function
  return () => {
    handlers.forEach(({ form, handler }) => {
      form.removeEventListener('submit', handler);
    });
  };
}

function submitForm(form, formAction, recaptchaToken) {
  const formData = new FormData(form);
  const object = {};
  
  formData.forEach((value, key) => {
    object[key] = value;
  });
  
  if (recaptchaToken) {
    object['recaptcha_token'] = recaptchaToken;
  }
  
  fetch(formAction, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(object),
  })
    .then(async (response) => {
      const jsonResponse = await response.json();
      if (response.status === 200) {
        console.log('✅ Form submitted successfully:', jsonResponse.message);
        form.reset();
      } else {
        console.error('❌ Form submission failed:', jsonResponse.error);
      }
    })
    .catch((error) => {
      console.error('❌ Form submission error:', error);
    });
}

// Contact page logic
export async function initContact() {
  // Wait for fonts to load before any potential SplitText usage
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  
  // Setup AJAX form handler
  const cleanupFormHandler = setupFormHandler();
  
  // Store in state for cleanup
  setState('contact', {
    playExitAnimation: () => playPageExitAnimation(),
    destroy: cleanupFormHandler,
  });
  
  // Play page enter animation
  playPageEnterAnimation();
}

