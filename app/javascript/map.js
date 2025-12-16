import L from "leaflet";
import "leaflet.markercluster"; // Importa a biblioteca de clusterização

// Garante compatibilidade com Turbo e DOM normal
["DOMContentLoaded", "turbo:load"].forEach((evt) => {
  document.addEventListener(evt, async () => {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.error("❌ Elemento #map não encontrado no DOM.");
      return;
    }

    // ========================================
    // CONFIGURAÇÃO INICIAL DO MAPA
    // ========================================
    const defaultLat = -14.788;
    const defaultLng = -39.278;
    const defaultZoom = 13;

    const map = L.map("map").setView([defaultLat, defaultLng], defaultZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    let userMarker = null;
    let radarOverlay = document.getElementById("radar-overlay");
    let currentUserLat = defaultLat;
    let currentUserLng = defaultLng;

    // ========================================
    // GEOLOCALIZAÇÃO E CENTRALIZAÇÃO DO MAPA
    // ========================================
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        currentUserLat = latitude;
        currentUserLng = longitude;

        // Centraliza o mapa na localização do usuário
        map.setView([latitude, longitude], 13);

        // Adiciona marcador do usuário atual
        addUserMarker(latitude, longitude);

        // Mostra o radar visual
        showRadar(latitude, longitude);

        // Atualiza backend com localização
        await updateUserLocation(latitude, longitude);

        // Carrega usuários próximos
        loadNearbyUsers();
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        addUserMarker(defaultLat, defaultLng);
        showRadar(defaultLat, defaultLng);
        loadNearbyUsers();
      }
    );

    // ========================================
    // ADICIONAR MARCADOR DO USUÁRIO ATUAL
    // ========================================
    function addUserMarker(lat, lng) {
      if (userMarker) {
        map.removeLayer(userMarker);
      }

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
    // MOSTRAR RADAR VISUAL
    // ========================================
    function showRadar(lat, lng) {
      if (!radarOverlay) return;

      radarOverlay.classList.remove("hidden");

      // Atualizar posição do radar para o centro do mapa
      const radarRadius = 50; // pixels

      // Usar a posição do container do mapa
      const mapRect = mapContainer.getBoundingClientRect();
      const radarX = mapRect.width / 2;
      const radarY = mapRect.height / 2;

      radarOverlay.style.left = `${radarX - radarRadius}px`;
      radarOverlay.style.top = `${radarY - radarRadius}px`;
    }

    // ========================================
    // ATUALIZAR LOCALIZAÇÃO NO BACKEND
    // ========================================
    async function updateUserLocation(latitude, longitude) {
      try {
        const token = document
          .querySelector('meta[name="csrf-token"]')
          .getAttribute("content");

        await fetch("/users/update_location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": token,
          },
          body: JSON.stringify({ latitude, longitude }),
        });
      } catch (error) {
        console.error("Erro ao atualizar localização:", error);
      }
    }

    // ========================================
    // CARREGAR USUÁRIOS PRÓXIMOS
    // ========================================
    async function loadNearbyUsers() {
      try {
        const response = await fetch("/users/nearby");
        const users = await response.json();

        // Atualizar contagem de usuários próximos
        const nearbyCount = document.getElementById("nearby-count");
        if (nearbyCount) {
          nearbyCount.textContent = users.length;
        }

        // Implementar Marker Clustering
        const markers = L.markerClusterGroup();

        users.forEach((user) => {
          const icon = L.divIcon({
            html: `<img src="${
              user.avatar_url || "/default-avatar.png"
            }" class="marker-avatar" alt="${user.username}">`,
            className: "custom-marker",
            iconSize: [40, 40],
          });

          const marker = L.marker([user.latitude, user.longitude], { icon });

          marker.bindPopup(`<b>${user.username}</b><br>${user.city}`);

          marker.on("click", () => {
            showUserPopup(user);
          });

          markers.addLayer(marker);
        });

        map.addLayer(markers);

        // ========================================
        // ATUALIZAR LISTA LATERAL DE USUÁRIOS
        // ========================================
        const listContainer = document.getElementById("users-list");
        if (listContainer) {
          listContainer.innerHTML = "";

          if (users.length === 0) {
            listContainer.innerHTML =
              '<li class="text-center loading-text">Nenhum usuário próximo</li>';
            return;
          }

          users.forEach((user) => {
            const li = document.createElement("li");
            li.className = "user-list-item";
            li.innerHTML = `
              <img src="${
                user.avatar_url || "/default-avatar.png"
              }" alt="${user.username}" class="avatar">
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

            listContainer.appendChild(li);
          });
        }

        document.dispatchEvent(
          new CustomEvent("usersLoaded", { detail: users })
        );
      } catch (error) {
        console.error("Erro ao carregar usuários próximos:", error);
      }
    }

    // ========================================
    // MOSTRAR POPUP DO USUÁRIO
    // ========================================
    function showUserPopup(user) {
      const popup = document.getElementById("user-popup");
      const avatar = document.getElementById("popup-avatar");
      const username = document.getElementById("popup-username");
      const location = document.getElementById("popup-location");
      const distance = document.getElementById("popup-distance");

      popup.dataset.userId = user.id;

      avatar.src = user.avatar_url || "/default-avatar.png";
      username.textContent = user.username || "Usuário desconhecido";
      location.textContent = user.city || "Localização não informada";
      distance.textContent = user.distance_km
        ? `a ~${user.distance_km} km de você`
        : "";

      popup.classList.remove("hidden");
      popup.classList.add("show");
    }

    // ========================================
    // FECHAR POPUP
    // ========================================
    const closePopupBtn = document.getElementById("close-popup-btn");
    if (closePopupBtn) {
      closePopupBtn.addEventListener("click", () => {
        const popup = document.getElementById("user-popup");
        popup.classList.add("hidden");
        popup.classList.remove("show");
      });
    }

    // ========================================
    // BOTÃO DE CURTIR
    // ========================================
    document.addEventListener("click", async (e) => {
      if (e.target && e.target.id === "like-btn") {
        const popup = document.getElementById("user-popup");
        const likedUserId = popup.dataset.userId;

        if (!likedUserId) return;

        try {
          const token = document
            .querySelector('meta[name="csrf-token"]')
            .getAttribute("content");

          const response = await fetch("/likes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": token,
            },
            body: JSON.stringify({ user_id: likedUserId }),
          });

          if (response.ok) {
            const data = await response.json();

            if (data.status === "already_liked") {
              alert("Você já curtiu este usuário.");
              return;
            }

            if (data.message === "💘 Deu match!") {
              alert("🎉 MATCH! Vocês se curtiram!");

              if (data.match_id) {
                window.location.href = `/matches/${data.match_id}`;
              }

              return;
            }

            alert("❤️ Curtida enviada!");
          } else {
            const data = await response.json().catch(() => ({}));
            alert(`Erro: ${data.error || response.statusText}`);
          }
        } catch (error) {
          console.error("Erro ao enviar curtida:", error);
          alert("⚠️ Falha ao enviar curtida.");
        }
      }
    });

    // ========================================
    // BOTÃO DE MENSAGEM
    // ========================================
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "message-btn") {
        const popup = document.getElementById("user-popup");
        const userId = popup.dataset.userId;

        if (userId) {
          window.location.href = `/conversations?user_id=${userId}`;
        }
      }
    });

    // ========================================
    // BOTÃO DE IR ATÉ
    // ========================================
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "goto-btn") {
        const popup = document.getElementById("user-popup");
        const userId = popup.dataset.userId;

        if (userId) {
          window.location.href = `/users/${userId}`;
        }
      }
    });
  });
});

// ========================================
// ESTILOS DINÂMICOS DO MARCADOR
// ========================================
const style = document.createElement("style");
style.textContent = `
  .marker-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid #d4af37;
    object-fit: cover;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease, box-shadow 0.3s ease;
  }

  .marker-avatar:hover {
    transform: scale(1.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  }

  .user-marker {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .user-location-marker {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .user-location-dot {
    width: 12px;
    height: 12px;
    background: #d4af37;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 0 3px #d4af37;
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
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(2);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);