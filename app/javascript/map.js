import L from "leaflet";
window.L = L;
import "leaflet.markercluster";

// Constantes
const INITIAL_RANGE_KM = 50;
const MAX_RANGE_KM = 2000;

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
    let userLatitude = null;
    let userLongitude = null;

    const markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);

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

    // ========================================
    // CONTROLE DO SLIDER
    // ========================================
    if (rangeSlider && rangeValueSpan) {
      rangeSlider.value = INITIAL_RANGE_KM;
      rangeValueSpan.textContent = INITIAL_RANGE_KM;

      rangeSlider.addEventListener("input", (e) => {
        currentRangeKm = parseInt(e.target.value, 10);
        rangeValueSpan.textContent = currentRangeKm;
        updateRadarCircle();
      });

      rangeSlider.addEventListener("change", () => {
        if (userLatitude && userLongitude) {
          loadNearbyUsers(userLatitude, userLongitude, currentRangeKm);
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
    // GEOLOCALIZAÇÃO
    // ========================================
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLatitude = position.coords.latitude;
        userLongitude = position.coords.longitude;

        map.setView([userLatitude, userLongitude], 13);
        addUserMarker(userLatitude, userLongitude);
        updateRadarCircle(userLatitude, userLongitude);
        loadNearbyUsers(userLatitude, userLongitude, currentRangeKm);
        updateHeaderLocation(userLatitude, userLongitude);
      },
      () => {
        userLatitude = defaultLat;
        userLongitude = defaultLng;

        addUserMarker(defaultLat, defaultLng);
        updateRadarCircle(defaultLat, defaultLng);
        loadNearbyUsers(defaultLat, defaultLng, currentRangeKm);
        updateHeaderLocation(defaultLat, defaultLng);
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
    async function loadNearbyUsers(latitude = null, longitude = null, range = INITIAL_RANGE_KM) {
      try {
        let url = "/users/nearby";
        if (latitude && longitude) {
          url += `?latitude=${latitude}&longitude=${longitude}&range=${range}`;
        }

        const response = await fetch(url);
        const users = await response.json();

        const nearbyCount = document.getElementById("nearby-count");
        if (nearbyCount) nearbyCount.textContent = users.length;

        const usersTotalText = document.getElementById("users-total-text");
        if (usersTotalText) {
          usersTotalText.textContent = `${users.length} ${users.length === 1 ? "usuário" : "usuários"} próximo${users.length === 1 ? "" : "s"}`;
        }

        markerCluster.clearLayers();

        users.forEach((user) => {
          if (!user.latitude || !user.longitude) return;

          const icon = L.divIcon({
            html: `<img src="${user.avatar_url || "/default-avatar.png"}" class="marker-avatar">`,
            className: "custom-marker",
            iconSize: [40, 40],
          });

          const marker = L.marker([user.latitude, user.longitude], { icon });
          marker.on("click", () => showUserPopup(user));
          markerCluster.addLayer(marker);
        });

        updateUserList(users);

        document.dispatchEvent(
          new CustomEvent("usersLoaded", { detail: users })
        );
      } catch (error) {
        console.error("Erro ao carregar usuários próximos:", error);
      }
    }

    // ========================================
    // LISTA LATERAL (Bottom Sheet)
    // ========================================
    function updateUserList(users) {
      const list = document.getElementById("users-list");
      if (!list) return;

      list.innerHTML = "";

      if (users.length === 0) {
        list.innerHTML =
          '<li class="text-center loading-text">Nenhum usuário próximo</li>';
        return;
      }

      users.forEach((user) => {
        const li = document.createElement("li");
        li.className = "user-list-item";
        li.innerHTML = `
          <img src="${user.avatar_url || "/default-avatar.png"}" class="avatar">
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

        list.appendChild(li);
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
      // Função para expandir/contrair
      function toggleStoriesExpansion() {
        console.log("Expandindo/contraindo stories");
        storiesSection.classList.toggle("expanded");
      }

      // Clique no botão de expansão
      storiesToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Botão de stories clicado");
        toggleStoriesExpansion();
      });

      // Clique no botão de adicionar story não fecha a seção
      if (addStoryBtn) {
        addStoryBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Adicionar story clicado");
        });
      }

      // Clique fora da seção a fecha
      document.addEventListener("click", (e) => {
        if (!storiesSection.contains(e.target) && storiesSection.classList.contains("expanded")) {
          console.log("Clique fora, fechando stories");
          storiesSection.classList.remove("expanded");
        }
      });

      // Previne que cliques dentro da seção a fechem
      storiesSection.addEventListener("click", (e) => {
        e.stopPropagation();
      });
    }

    // ========================================
    // ESTILOS DOS MARCADORES
    // ========================================
    const style = document.createElement("style");
    style.textContent = `
    .marker-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid #d4af37;
      object-fit: cover;
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
    `;
    document.head.appendChild(style);
  });
});
