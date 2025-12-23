import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["card", "slide", "indicator", "swipeIndicator"]
  
  static values = {
    currentSlide: { type: Number, default: 0 },
    slideCount: { type: Number, default: 0 }
  }

  connect() {
    console.log("✅ Stimulus Conectado! Iniciando LeadSwipeController...")
    
    this.slideCountValue = this.slideTargets.length
    this.isDragging = false
    this.startX = 0
    
    // Bindings
    this.handleStart = this.handleStart.bind(this)
    this.handleMove = this.handleMove.bind(this)
    this.handleEnd = this.handleEnd.bind(this)

    if (this.hasCardTarget) {
      console.log("✅ Card Target encontrado. Adicionando listeners...")
      
      // Mouse e Touch Events
      this.cardTarget.addEventListener('mousedown', this.handleStart)
      this.cardTarget.addEventListener('touchstart', this.handleStart, { passive: false })
      
      // Bloqueia o 'arrastar imagem' nativo do navegador
      this.cardTarget.addEventListener('dragstart', (e) => e.preventDefault())
    } else {
      console.error("❌ ERRO: Target 'card' não encontrado no HTML")
    }

    // Listeners Globais
    window.addEventListener('mousemove', this.handleMove)
    window.addEventListener('touchmove', this.handleMove, { passive: false })
    window.addEventListener('mouseup', this.handleEnd)
    window.addEventListener('touchend', this.handleEnd)
    
    this.updateGallery()
  }

  disconnect() {
    // Limpeza ao sair da página
    if (this.hasCardTarget) {
      this.cardTarget.removeEventListener('mousedown', this.handleStart)
      this.cardTarget.removeEventListener('touchstart', this.handleStart)
    }
    window.removeEventListener('mousemove', this.handleMove)
    window.removeEventListener('touchmove', this.handleMove)
    window.removeEventListener('mouseup', this.handleEnd)
    window.removeEventListener('touchend', this.handleEnd)
  }

  // ========================================
  // INÍCIO DO SWIPE
  // ========================================
  handleStart(event) {
    // Se clicar no botão ou seta, NÃO faz swipe
    if (event.target.closest('button') || event.target.closest('.gallery-nav') || event.target.closest('.indicator')) {
      console.log("🖱 Clique detectado em botão/navegação. Ignorando Swipe.")
      return
    }

    console.log("🖱 Swipe Iniciado!")
    this.isDragging = true
    this.startTime = Date.now()
    
    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY
    
    this.startX = clientX
    this.startY = clientY
    this.currentX = clientX
    
    if (this.hasCardTarget) {
      this.cardTarget.style.transition = 'none'
    }
  }

  // ========================================
  // MOVIMENTO
  // ========================================
  handleMove(event) {
    if (!this.isDragging) return

    const clientX = event.type.includes('touch') ? event.touches[0].clientX : event.clientX
    const clientY = event.type.includes('touch') ? event.touches[0].clientY : event.clientY
    
    const deltaX = clientX - this.startX
    const deltaY = clientY - this.startY

    // Bloqueia scroll da tela no celular enquanto arrasta pro lado
    if (event.type.includes('touch') && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (event.cancelable) event.preventDefault()
    }

    this.currentX = clientX
    this.updateVisuals(deltaX)
  }

  // ========================================
  // FIM DO SWIPE
  // ========================================
  handleEnd(event) {
    if (!this.isDragging) return
    this.isDragging = false
    console.log("🛑 Swipe Finalizado")

    const deltaX = this.currentX - this.startX
    const threshold = 100 // Pixel distance to trigger action

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        this.performAction('like')
      } else {
        this.performAction('reject')
      }
    } else {
      this.resetCard()
    }
  }

  // ========================================
  // VISUAL E GALERIA
  // ========================================
  updateVisuals(deltaX) {
    if (!this.hasCardTarget) return
    const rotation = deltaX / 20
    this.cardTarget.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`
    
    if (this.hasSwipeIndicatorTarget) {
      const opacity = Math.min(1, Math.abs(deltaX) / 100)
      this.swipeIndicatorTarget.style.opacity = opacity
      
      // Mostra ícone esquerda/direita
      this.swipeIndicatorTarget.classList.toggle('show-left', deltaX < 0)
      this.swipeIndicatorTarget.classList.toggle('show-right', deltaX > 0)
    }
  }

  resetCard() {
    if (!this.hasCardTarget) return
    console.log("↩️ Resetando posição do card")
    this.cardTarget.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
    this.cardTarget.style.transform = 'translateX(0) rotate(0deg)'
    
    if (this.hasSwipeIndicatorTarget) {
      this.swipeIndicatorTarget.style.opacity = 0
    }
  }

  // --- NAVEGAÇÃO DA GALERIA ---
  nextSlide(event) {
    console.log("➡️ Próxima foto")
    event.preventDefault()
    event.stopPropagation() // Impede que o clique ative o swipe
    if (this.slideCountValue <= 1) return
    this.currentSlideValue = (this.currentSlideValue + 1) % this.slideCountValue
  }

  prevSlide(event) {
    console.log("⬅️ Foto anterior")
    event.preventDefault()
    event.stopPropagation()
    if (this.slideCountValue <= 1) return
    this.currentSlideValue = (this.currentSlideValue - 1 + this.slideCountValue) % this.slideCountValue
  }

  goToSlide(event) {
    event.preventDefault()
    event.stopPropagation()
    const index = parseInt(event.currentTarget.dataset.index)
    this.currentSlideValue = index
  }

  currentSlideValueChanged() {
    this.updateGallery()
  }

  updateGallery() {
    this.slideTargets.forEach((slide, index) => {
      slide.classList.toggle('active', index === this.currentSlideValue)
    })
    this.indicatorTargets.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentSlideValue)
    })
  }

  // ========================================
  // AÇÕES (LIKE/REJECT)
  // ========================================
  performAction(type) {
    console.log(`⚡ Ação disparada: ${type.toUpperCase()}`)
    const isLike = type === 'like'
    const endX = isLike ? window.innerWidth : -window.innerWidth
    
    this.cardTarget.style.transition = 'transform 0.5s ease-in'
    this.cardTarget.style.transform = `translateX(${endX}px) rotate(${isLike ? 30 : -30}deg)`

    const buttonSelector = isLike ? '.like-button' : '.reject-button'
    const button = document.querySelector(buttonSelector)
    
    if (button) {
      setTimeout(() => button.click(), 200)
    } else {
      console.warn("⚠️ Botão de ação não encontrado no DOM")
      setTimeout(() => location.reload(), 500)
    }
  }
}