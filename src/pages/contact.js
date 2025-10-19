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
  
  // Future: Add enter animations here (fade in, slide up, etc.)
}

// Page exit animation
function playPageExitAnimation() {
  // Future: Add exit animations here
  return Promise.resolve();
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

