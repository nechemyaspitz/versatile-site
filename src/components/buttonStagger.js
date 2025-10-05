// Button character stagger animation
export function initButtonCharacterStagger() {
  const offsetIncrement = 0.015;
  const buttons = document.querySelectorAll('[data-button-animate-chars]');
  buttons.forEach((button) => {
    const text = button.textContent;
    button.innerHTML = '';
    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;
      if (char === ' ') span.style.whiteSpace = 'pre';
      button.appendChild(span);
    });
  });
}

