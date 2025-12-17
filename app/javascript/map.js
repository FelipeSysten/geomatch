import L from "leaflet";
window.L = L; // 🔥 NECESSÁRIO para o markercluster
import "leaflet.markercluster";

// Compatível com Turbo e DOM normal
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
    let markerCluster = L.markerClusterGroup();
    map.addLayer(markerCluster);

    let radarOverlay = document.getElementById("radar-overlay");

    // ========================================
    // GEOLOCALIZAÇÃO
    // ========================================
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        map.setView([latitude, longitude], 13);
        addUserMarker(latitude, longitude);
        showRadar();

        loadNearbyUsers(latitude, longitude);
      },
      () => {
        addUserMarker(defaultLat, defaultLng);
        showRadar();
        loadNearbyUsers();
      }
    );

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
    // RADAR VISUAL
    // ========================================
    function showRadar() {
      if (!radarOverlay) return;

      radarOverlay.classList.remove("hidden");

      const mapRect = mapContainer.getBoundingClientRect();
      const radius = 50;

      radarOverlay.style.left = `${mapRect.width / 2 - radius}px`;
      radarOverlay.style.top = `${mapRect.height / 2 - radius}px`;
    }

    // ========================================
    // BUSCAR USUÁRIOS PRÓXIMOS (Opção A)
    // ========================================
    async function loadNearbyUsers(latitude = null, longitude = null) {
      try {
        let url = "/users/nearby";
        if (latitude && longitude) {
          url += `?latitude=${latitude}&longitude=${longitude}`;
        }

        const response = await fetch(url);
        const users = await response.json();

        // Atualiza contador
        const nearbyCount = document.getElementById("nearby-count");
        if (nearbyCount) nearbyCount.textContent = users.length;

        // Limpa clusters antigos
        markerCluster.clearLayers();

        users.forEach((user) => {
          if (!user.latitude || !user.longitude) return;

          const icon = L.divIcon({
            html: `<img src="${
              user.avatar_url || "/default-avatar.png"
            }" class="marker-avatar">`,
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
    // LISTA LATERAL
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
          <img src="${
            user.avatar_url || "/default-avatar.png"
          }" class="avatar">
          <div class="user-list-info">
            <span class="user-list-name">${user.username || "Usuário"}</span>
            <span class="user-list-distance">${
              user.distance_km ? `${user.distance_km} km` : "Próximo"
            }</span>
          </div>
        `;

        li.addEventListener("click", () => {
          map.setView([user.latitude, user.longitude], 15);
          showUserPopup(user);
        });

        list.appendChild(li);
      });
    }

    // ========================================
    // POPUP DO USUÁRIO
    // ========================================
    function showUserPopup(user) {
      const popup = document.getElementById("user-popup");
      if (!popup) return;

      popup.dataset.userId = user.id;
      popup.querySelector("#popup-avatar").src =
        user.avatar_url || "/default-avatar.png";
      popup.querySelector("#popup-username").textContent =
        user.username || "Usuário";
      popup.querySelector("#popup-location").textContent =
        user.city || "Localização não informada";
      popup.querySelector("#popup-distance").textContent = user.distance_km
        ? `a ~${user.distance_km} km de você`
        : "";

      popup.classList.remove("hidden");
      popup.classList.add("show");
    }

    // ========================================
    // FECHAR POPUP
    // ========================================
    document
      .getElementById("close-popup-btn")
      ?.addEventListener("click", () => {
        const popup = document.getElementById("user-popup");
        popup.classList.add("hidden");
        popup.classList.remove("show");
      });
  });
});

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
