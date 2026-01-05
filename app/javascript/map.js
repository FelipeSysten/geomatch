import L from "leaflet";
window.L = L;

// Constantes
const INITIAL_RANGE_KM = 5;
const MAX_RANGE_KM = 500;
  const STORAGE_KEYS = {
    RANGE: "geomatch_range",
    GENDER_FILTER: "geomatch_gender_filter",
    INVISIBLE_MODE: "geomatch_invisible_mode",
  };

["DOMContentLoaded", "turbo:load"].forEach((evt) => {
  document.addEventListener(evt, () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) return;

    // ========================================
    // CONFIGURAÇÃO INICIAL
    // ========================================
    const defaultLat = -14.788;
    const defaultLng = -39.278;
    const defaultZoom = 13;

    const map = L.map("map").setView([defaultLat, defaultLng], defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    let userMarker = null;
    let radarCircle = null;
    let currentRangeKm = INITIAL_RANGE_KM;
    let currentGenderFilter = "all"; // "all", "male", "female"
    let userLatitude = null;
    let userLongitude = null;
    let isLoadingUsers = false;

    // Recuperar preferências do localStorage
    const savedRange = localStorage.getItem(STORAGE_KEYS.RANGE);
    const savedGender = localStorage.getItem(STORAGE_KEYS.GENDER_FILTER);

    if (savedRange) currentRangeKm = parseInt(savedRange, 10);
    if (savedGender) currentGenderFilter = savedGender;

    // Usar um grupo de marcadores simples (sem clustering)
    const userMarkersGroup = L.featureGroup();
    map.addLayer(userMarkersGroup);

    // ========================================
    // ELEMENTOS DO DOM
    // ========================================
    const rangeSlider = document.getElementById("radar-range");
    const rangeValueSpan = document.getElementById("range-value-floating");
    const headerLocation = document.getElementById("header-location");
    const headerDistanceInfo = document.getElementById("header-distance-info");
    const fabCenterMap = document.getElementById("fab-center-map");
    const userPopup = document.getElementById("user-popup");
    const closePopupBtn = document.getElementById("close-popup-btn");
    const usersBottomSheet = document.querySelector(".users-bottom-sheet");
    const bottomSheetHandle = document.querySelector(".bottom-sheet-handle");
    const usersList = document.getElementById("users-list");
    const usersCountElement = document.getElementById("nearby-count");
    const usersTotalText = document.getElementById("users-total-text");
    const toggleVisibilityBtn = document.getElementById("toggle-visibility-btn");

    // ========================================
    // FILTROS DE GÊNERO
    // ========================================
    const genderFilterContainer = document.getElementById("gender-filter-container");
    if (genderFilterContainer) {
      // Criar botões de filtro se não existirem
      if (!document.getElementById("filter-all")) {
        genderFilterContainer.innerHTML = `
          <button id="filter-all" class="gender-filter-btn active" data-filter="all">
            <span class="filter-icon">👥</span> Ambos
          </button>
          <button id="filter-male" class="gender-filter-btn" data-filter="male">
            <span class="filter-icon">♂️</span> Homem
          </button>
          <button id="filter-female" class="gender-filter-btn" data-filter="female">
            <span class="filter-icon">♀️</span> Mulher
          </button>
        `;
      }

      // Atualizar estado dos botões
      updateGenderFilterUI();

      // Adicionar listeners aos botões
      document.querySelectorAll(".gender-filter-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          currentGenderFilter = e.currentTarget.dataset.filter;
          localStorage.setItem(STORAGE_KEYS.GENDER_FILTER, currentGenderFilter);
          updateGenderFilterUI();

          // Recarregar usuários com novo filtro
          if (userLatitude && userLongitude) {
            loadNearbyUsers(userLatitude, userLongitude, currentRangeKm, currentGenderFilter);
          }
        });
      });
    }

    function updateGenderFilterUI() {
      document.querySelectorAll(".gender-filter-btn").forEach((btn) => {
        if (btn.dataset.filter === currentGenderFilter) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
    }

    // ========================================
    // ANIMAÇÃO DE CARREGAMENTO
    // ========================================
    function showLoadingAnimation() {
      isLoadingUsers = true;
      if (usersList) {
        usersList.innerHTML = `
          <li class="loading-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </li>
          <li class="loading-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </li>
          <li class="loading-skeleton">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-text">
              <div class="skeleton-line"></div>
              <div class="skeleton-line short"></div>
            </div>
          </li>
        `;
      }

      if (usersCountElement) {
        usersCountElement.innerHTML = `
          <span class="loading-spinner"></span>
        `;
      }

      if (usersTotalText) {
        usersTotalText.textContent = "Carregando usuários...";
      }
    }

    function hideLoadingAnimation() {
      isLoadingUsers = false;
    }

    // ========================================
    // CONTROLE DO SLIDER
    // ========================================
    if (rangeSlider && rangeValueSpan) {
      rangeSlider.value = currentRangeKm;
      rangeSlider.max = MAX_RANGE_KM;
      rangeValueSpan.textContent = currentRangeKm;

      rangeSlider.addEventListener("input", (e) => {
        currentRangeKm = parseInt(e.target.value, 10);
        rangeValueSpan.textContent = currentRangeKm;
        updateRadarCircle();
      });

      rangeSlider.addEventListener("change", () => {
        localStorage.setItem(STORAGE_KEYS.RANGE, currentRangeKm);
        if (userLatitude && userLongitude) {
          showLoadingAnimation();
          loadNearbyUsers(userLatitude, userLongitude, currentRangeKm, currentGenderFilter);
        }
      });
    }

    // ========================================
    // BOTÃO FAB - CENTRALIZAR NO MAPA
    // ========================================
    if (fabCenterMap) {
      fabCenterMap.addEventListener("click", () => {
        if (userLatitude && userLongitude) {
          map.setView([userLatitude, userLongitude], 13);
          map.flyTo([userLatitude, userLongitude], 13, { duration: 1 });
        }
      });
    }

    // ========================================
    // MODO INVISÍVEL
    // ========================================
    if (toggleVisibilityBtn) {
      let isInvisible = localStorage.getItem(STORAGE_KEYS.INVISIBLE_MODE) === "true";
      
      const updateVisibilityUI = () => {
        const eyeOpen = toggleVisibilityBtn.querySelector(".eye-open");
        const eyeClosed = toggleVisibilityBtn.querySelector(".eye-closed");
        
        if (isInvisible) {
          toggleVisibilityBtn.classList.add("active");
          eyeOpen.classList.add("hidden");
          eyeClosed.classList.remove("hidden");
          toggleVisibilityBtn.title = "Modo Invisível: Ativado";
        } else {
          toggleVisibilityBtn.classList.remove("active");
          eyeOpen.classList.remove("hidden");
          eyeClosed.classList.add("hidden");
          toggleVisibilityBtn.title = "Modo Invisível: Desativado";
        }
      };

      // Inicializar UI
      updateVisibilityUI();

      toggleVisibilityBtn.addEventListener("click", () => {
        isInvisible = !isInvisible;
        localStorage.setItem(STORAGE_KEYS.INVISIBLE_MODE, isInvisible);
        updateVisibilityUI();
        
        // Aqui você pode adicionar uma chamada de API para atualizar o status no servidor
        // fetch('/users/update_visibility', { method: 'POST', body: JSON.stringify({ invisible: isInvisible }) });
        
        console.log(`Modo invisível: ${isInvisible ? 'Ativado' : 'Desativado'}`);
      });
    }

    // ========================================
    // GEOLOCALIZAÇÃO
    // ========================================
    function initializeMap(lat, lng) {
      userLatitude = lat;
      userLongitude = lng;

      map.setView([lat, lng], 13);
      addUserMarker(lat, lng);
      updateRadarCircle(lat, lng);
      updateHeaderLocation(lat, lng);

      // Mostrar animação de carregamento
      showLoadingAnimation();

      // Carregar usuários
      loadNearbyUsers(lat, lng, currentRangeKm, currentGenderFilter);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        initializeMap(position.coords.latitude, position.coords.longitude);
      },
      () => {
        // Fallback para localização padrão
        initializeMap(defaultLat, defaultLng);
      }
    );

    // ========================================
    // ATUALIZAR HEADER COM LOCALIZAÇÃO
    // ========================================
    function updateHeaderLocation(lat, lng) {
      if (headerLocation) {
        headerLocation.textContent = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      }
      if (headerDistanceInfo) {
        headerDistanceInfo.textContent = `Raio: ${currentRangeKm} km`;
      }
    }

    // ========================================
    // MARCADOR DO USUÁRIO ATUAL
    // ========================================
    function addUserMarker(lat, lng) {
      if (userMarker) map.removeLayer(userMarker);

      const userIcon = L.divIcon({
        html: `
          <div class="user-location-marker">
            <div class="user-location-pulse"></div>
            <div class="user-location-dot"></div>
          </div>
        `,
        className: "user-marker",
        iconSize: [40, 40],
      });

      userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
    }

    // ========================================
    // RADAR GEOGRÁFICO (L.Circle)
    // ========================================
    function updateRadarCircle(lat = null, lng = null) {
      const centerLat = lat || userLatitude || defaultLat;
      const centerLng = lng || userLongitude || defaultLng;
      const radiusInMeters = currentRangeKm * 1000;

      if (radarCircle) {
        radarCircle.setRadius(radiusInMeters);
        radarCircle.setLatLng([centerLat, centerLng]);
      } else {
        radarCircle = L.circle([centerLat, centerLng], {
          radius: radiusInMeters,
          className: "radar-circle-dynamic",
          interactive: false,
        }).addTo(map);
      }

      if (currentRangeKm > 100) {
        map.fitBounds(radarCircle.getBounds(), { padding: [50, 50] });
      }
    }

    // ========================================
    // BUSCAR USUÁRIOS PRÓXIMOS
    // ========================================
    async function loadNearbyUsers(latitude = null, longitude = null, range = INITIAL_RANGE_KM, genderFilter = "all") {
      try {
        let url = "/users/nearby";
        if (latitude && longitude) {
          url += `?latitude=${latitude}&longitude=${longitude}&range=${range}`;
          if (genderFilter !== "all") {
            url += `&gender=${genderFilter}`;
          }
        }

        const response = await fetch(url);
        const users = await response.json();

        // Filtrar por gênero no frontend como backup
        let filteredUsers = users;
        if (genderFilter !== "all") {
          filteredUsers = users.filter((user) => {
            if (genderFilter === "male") return user.gender === "male" || user.gender === "m";
            if (genderFilter === "female") return user.gender === "female" || user.gender === "f";
            return true;
          });
        }

        // Atualizar contadores
        if (usersCountElement) {
          usersCountElement.textContent = filteredUsers.length;
        }

        if (usersTotalText) {
          usersTotalText.textContent = `${filteredUsers.length} ${filteredUsers.length === 1 ? "usuário" : "usuários"} próximo${filteredUsers.length === 1 ? "" : "s"}`;
        }

        // Limpar marcadores antigos
        userMarkersGroup.clearLayers();

        // Adicionar novos marcadores sem clustering
        filteredUsers.forEach((user) => {
          if (!user.latitude || !user.longitude) return;

          const icon = L.divIcon({
            html: `<img src="${user.avatar_url || "/default-avatar.png"}" class="marker-avatar" alt="${user.username}">`,
            className: "custom-marker",
            iconSize: [40, 40],
            popupAnchor: [0, -20],
          });

          const marker = L.marker([user.latitude, user.longitude], { icon });
          marker.on("click", () => showUserPopup(user));
          userMarkersGroup.addLayer(marker);
        });

        // Atualizar lista lateral
        updateUserList(filteredUsers);

        // Disparar evento customizado
        document.dispatchEvent(
          new CustomEvent("usersLoaded", { detail: filteredUsers })
        );

        hideLoadingAnimation();
      } catch (error) {
        console.error("Erro ao carregar usuários próximos:", error);
        hideLoadingAnimation();
        if (usersList) {
          usersList.innerHTML = '<li class="text-center loading-text">Erro ao carregar usuários</li>';
        }
      }
    }

    // ========================================
    // LISTA LATERAL (Bottom Sheet)
    // ========================================
    function updateUserList(users) {
      if (!usersList) return;

      usersList.innerHTML = "";

      if (users.length === 0) {
        usersList.innerHTML =
          '<li class="text-center loading-text">Nenhum usuário próximo</li>';
        return;
      }

      users.forEach((user) => {
        const li = document.createElement("li");
        li.className = "user-list-item";
        li.innerHTML = `
          <img src="${user.avatar_url || "/default-avatar.png"}" class="avatar" alt="${user.username}">
          <div class="user-list-info">
            <span class="user-list-name">${user.username || "Usuário"}</span>
            <span class="user-list-distance">${
              user.distance_km ? `${user.distance_km} km` : "Próximo"
            }</span>
          </div>
        `;

        li.addEventListener("click", () => {
          map.setView([user.latitude, user.longitude], 15);
          map.flyTo([user.latitude, user.longitude], 15, { duration: 1 });
          showUserPopup(user);
        });

        usersList.appendChild(li);
      });
    }

    // ========================================
    // POPUP DO USUÁRIO
    // ========================================
    function showUserPopup(user) {
      if (!userPopup) return;

      userPopup.dataset.userId = user.id;
      userPopup.querySelector("#popup-avatar").src =
        user.avatar_url || "/default-avatar.png";
      userPopup.querySelector("#popup-username").textContent =
        user.username || "Usuário";
      userPopup.querySelector("#popup-location").textContent =
        user.city || "Localização não informada";

      const distanceBadge = userPopup.querySelector("#popup-distance");
      if (distanceBadge) {
        distanceBadge.textContent = user.distance_km
          ? `${user.distance_km} km`
          : "Próximo";
      }

      userPopup.classList.remove("hidden");
      userPopup.classList.add("show");
    }

    // ========================================
    // FECHAR POPUP
    // ========================================
    if (closePopupBtn) {
      closePopupBtn.addEventListener("click", () => {
        if (userPopup) {
          userPopup.classList.add("hidden");
          userPopup.classList.remove("show");
        }
      });
    }

    const popupOverlay = document.querySelector(".popup-overlay");
    if (popupOverlay) {
      popupOverlay.addEventListener("click", () => {
        if (userPopup) {
          userPopup.classList.add("hidden");
          userPopup.classList.remove("show");
        }
      });
    }

    // ========================================
    // DRAG DO BOTTOM SHEET (Opcional)
    // ========================================
    if (bottomSheetHandle && usersBottomSheet) {
      let startY = 0;
      let currentY = 0;

      bottomSheetHandle.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY;
      });

      bottomSheetHandle.addEventListener("touchmove", (e) => {
        currentY = e.touches[0].clientY - startY;
        usersBottomSheet.style.transform = `translateY(${Math.max(0, currentY)}px)`;
      });

      bottomSheetHandle.addEventListener("touchend", () => {
        if (currentY > 50) {
          usersBottomSheet.style.transform = "translateY(100%)";
        } else {
          usersBottomSheet.style.transform = "translateY(0)";
        }
        currentY = 0;
      });
    }

    // ========================================
    // AÇÕES DO POPUP
    // ========================================
    const likeBtn = document.getElementById("like-btn");
    const messageBtn = document.getElementById("message-btn");
    const rejectBtn = document.getElementById("reject-btn");

    if (likeBtn) {
      likeBtn.addEventListener("click", () => {
        const userId = userPopup?.dataset.userId;
        if (userId) {
          console.log("Curtir usuário:", userId);
        }
      });
    }

    if (messageBtn) {
      messageBtn.addEventListener("click", () => {
        const userId = userPopup?.dataset.userId;
        if (userId) {
          console.log("Enviar mensagem para:", userId);
        }
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", () => {
        if (userPopup) {
          userPopup.classList.add("hidden");
          userPopup.classList.remove("show");
        }
      });
    }

    // ========================================
    // CONTROLE DE EXPANSÃO DAS STORIES
    // ========================================
    const storiesSection = document.getElementById("stories-section");
    const storiesToggleBtn = document.getElementById("stories-toggle-btn");
    const addStoryBtn = document.getElementById("add-story-btn");

    if (storiesSection && storiesToggleBtn) {
      function toggleStoriesExpansion() {
        storiesSection.classList.toggle("expanded");
      }

      storiesToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleStoriesExpansion();
      });

      if (addStoryBtn) {
        addStoryBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
        });
      }

      document.addEventListener("click", (e) => {
        if (!storiesSection.contains(e.target) && storiesSection.classList.contains("expanded")) {
          storiesSection.classList.remove("expanded");
        }
      });

      storiesSection.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    // ========================================
    // ESTILOS DOS MARCADORES E ANIMAÇÕES
    // ========================================
    const style = document.createElement("style");
    style.textContent = `
    .marker-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #d4af37;
      object-fit: cover;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    .user-location-marker {
      position: relative;
      width: 40px;
      height: 40px;
    }
    .user-location-dot {
      width: 12px;
      height: 12px;
      background: #d4af37;
      border-radius: 50%;
      border: 3px solid white;
      position: relative;
      z-index: 10;
    }
    .user-location-pulse {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid #d4af37;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(2); opacity: 0; }
    }

    /* Animações de Carregamento */
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #d4af37;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-skeleton {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      animation: pulse-skeleton 1.5s ease-in-out infinite;
    }

    .skeleton-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #e0e0e0;
      flex-shrink: 0;
    }

    .skeleton-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-line {
      height: 10px;
      background: #e0e0e0;
      border-radius: 4px;
    }

    .skeleton-line.short {
      width: 60%;
    }

    @keyframes pulse-skeleton {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Filtros de Gênero */
    #gender-filter-container {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .gender-filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #e0e0e0;
      background: white;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
    }

    .gender-filter-btn:hover {
      border-color: #d4af37;
      color: #d4af37;
    }

    .gender-filter-btn.active {
      background: #d4af37;
      border-color: #d4af37;
      color: white;
      box-shadow: 0 2px 8px rgba(212, 175, 55, 0.3);
    }

    .filter-icon {
      font-size: 1.1rem;
    }
    `;
    document.head.appendChild(style);
  });
});
