/**
 * LEAD PAGE - SWIPE CARD FUNCTIONALITY
 * Implementa a funcionalidade de deslizar para rejeitar/curtir
 */

function initLeadSwipe() {
  const leadCard = document.querySelector('[data-lead-card]');
  const gallerySlides = document.querySelector('[data-gallery-slides]');
  const indicators = document.querySelectorAll('.indicator');
  const galleryPrev = document.querySelector('[data-gallery-prev]');
  const galleryNext = document.querySelector('[data-gallery-next]');
  const swipeIndicator = document.querySelector('[data-swipe-indicator]');
  // REMOVIDO: rejectButton e likeButton não são mais necessários para o clique,
  // pois o HTML agora usa button_to, que envia o formulário automaticamente.
  // const rejectButton = document.querySelector('[data-action-reject]');
  // const likeButton = document.querySelector('[data-action-like]');

  let currentSlide = 0;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isDragging = false;
  let dragX = 0;

  // ========================================
  // GALLERY NAVIGATION
  // ========================================

  function updateGallery() {
    const slides = document.querySelectorAll('.gallery-slide');
    slides.forEach((slide, index) => {
      slide.classList.toggle('active', index === currentSlide);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === currentSlide);
    });
  }

  if (galleryPrev) {
    galleryPrev.addEventListener('click', () => {
      const slides = document.querySelectorAll('.gallery-slide');
      currentSlide = (currentSlide - 1 + slides.length) % slides.length;
      updateGallery();
    });
  }

  if (galleryNext) {
    galleryNext.addEventListener('click', () => {
      const slides = document.querySelectorAll('.gallery-slide');
      currentSlide = (currentSlide + 1) % slides.length;
      updateGallery();
    });
  }

  // Clique nos indicadores
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      currentSlide = index;
      updateGallery();
    });
  });

  // ========================================
  // SWIPE FUNCTIONALITY
  // ========================================

  if (leadCard) {
    // MOUSE EVENTS (DESKTOP)
    leadCard.addEventListener('mousedown', (e) => {
      // Adicionado: Permite o clique nos botões (que agora são button_to)
      if (e.target.closest('.gallery-nav') || e.target.closest('form')) return; 
      isDragging = true;
      touchStartX = e.clientX;
      touchStartY = e.clientY;
      dragX = 0;
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      dragX = e.clientX - touchStartX;
      updateCardTransform();
      updateSwipeIndicator();
    });

    document.addEventListener('mouseup', (e) => {
      if (!isDragging) return;
      isDragging = false;
      handleSwipeEnd();
    });

    // TOUCH EVENTS (MOBILE)
    leadCard.addEventListener('touchstart', (e) => {
      // Adicionado: Permite o clique nos botões (que agora são button_to)
      if (e.target.closest('form')) return; 
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
      dragX = 0;
    });

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      dragX = e.touches[0].clientX - touchStartX;
      updateCardTransform();
      updateSwipeIndicator();
    });

    document.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      handleSwipeEnd();
    });

    // Prevenir comportamento padrão de drag
    leadCard.addEventListener('dragstart', (e) => {
      e.preventDefault();
    });
  }

  // ========================================
  // TRANSFORM & VISUAL FEEDBACK
  // ========================================

  function updateCardTransform() {
    if (!leadCard) return;

    const rotation = (dragX / 100) * 15;
    const opacity = Math.max(0, 1 - Math.abs(dragX) / 300);

    leadCard.style.transform = `translateX(${dragX}px) rotateZ(${rotation}deg)`;
    leadCard.style.opacity = opacity;
  }

  function updateSwipeIndicator() {
    if (!swipeIndicator) return;

    const threshold = 50;
    swipeIndicator.classList.toggle('active', Math.abs(dragX) > threshold);

    if (dragX < -threshold) {
      // REJEITAR (ESQUERDA)
      swipeIndicator.style.opacity = Math.min(1, Math.abs(dragX) / 150);
    } else if (dragX > threshold) {
      // CURTIR (DIREITA)
      swipeIndicator.style.opacity = Math.min(1, dragX / 150);
    } else {
      swipeIndicator.style.opacity = 0;
    }
  }

  function handleSwipeEnd() {
    const threshold = 100;

    if (dragX < -threshold) {
      // REJEITAR
      performReject();
    } else if (dragX > threshold) {
      // CURTIR
      performLike();
    } else {
      // RESET
      resetCard();
    }
  }

  function resetCard() {
    if (!leadCard) return;
    leadCard.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    leadCard.style.transform = 'translateX(0) rotateZ(0deg)';
    leadCard.style.opacity = '1';

    if (swipeIndicator) {
      swipeIndicator.style.opacity = '0';
    }

    setTimeout(() => {
      leadCard.style.transition = '';
    }, 300);
  }

  // ========================================
  // ACTION HANDLERS
  // ========================================

  // Ações de swipe agora disparam o envio do formulário
  function performReject() {
    if (!leadCard) return;
    leadCard.classList.add('swipe-left');
    leadCard.style.pointerEvents = 'none';

    // Encontra o formulário de rejeição e o submete
    const rejectForm = document.querySelector('.reject-button').closest('form');
    if (rejectForm) {
      setTimeout(() => {
        rejectForm.submit();
      }, 500);
    }
  }

  function performLike() {
    if (!leadCard) return;
    leadCard.classList.add('swipe-right');
    leadCard.style.pointerEvents = 'none';

    // Encontra o formulário de like e o submete
    const likeForm = document.querySelector('.like-button').closest('form');
    if (likeForm) {
      setTimeout(() => {
        likeForm.submit();
      }, 500);
    }
  }

  // REMOVIDO: submitAction não é mais necessário, pois o formulário é submetido diretamente.
  // function submitAction(action) { ... }

  // ========================================
  // BUTTON CLICK HANDLERS (FALLBACK)
  // REMOVIDO: Não é mais necessário, pois o button_to gera um formulário que
  // é submetido automaticamente ao ser clicado.
  // ========================================

  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================

  document.addEventListener('keydown', (e) => {
    if (isDragging) return;

    switch (e.key) {
      case 'ArrowLeft':
        performReject();
        break;
      case 'ArrowRight':
        performLike();
        break;
      case 'ArrowUp':
        if (galleryPrev) galleryPrev.click();
        break;
      case 'ArrowDown':
        if (galleryNext) galleryNext.click();
        break;
    }
  });

  // ========================================
  // PREVENT ACCIDENTAL ACTIONS
  // ========================================

  // Desabilitar seleção de texto durante swipe
  leadCard?.addEventListener('selectstart', (e) => {
    if (isDragging) e.preventDefault();
  });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLeadSwipe);
} else {
  initLeadSwipe();
}

// Suporte para Turbo/Turbolinks
if (window.Turbo) {
  document.addEventListener('turbo:load', initLeadSwipe);
}

// Suporte para Stimulus (se estiver usando)
if (window.Stimulus) {
  Stimulus.register('lead-swipe', class extends Stimulus.Controller {
    connect() {
      initLeadSwipe();
    }
  });
}