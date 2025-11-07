import L from "leaflet";

document.addEventListener("DOMContentLoaded", async () => {
  const map = L.map("map").setView([-14.788, -39.278], 13); // Itabuna como base

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap",
  }).addTo(map);

  // Obtém localização atual e envia para backend
  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;

    // Atualiza backend
    await fetch(`/users/nearby?latitude=${latitude}&longitude=${longitude}`);
    loadNearbyUsers();
  });

  async function loadNearbyUsers() {
    const response = await fetch("/users/nearby");
    const users = await response.json();

    users.forEach((user) => {
      const icon = L.divIcon({
        html: `<img src="${user.avatar_url || '/default-avatar.png'}" class="marker-avatar">`,
        className: "custom-marker",
        iconSize: [40, 40],
      });

      const marker = L.marker([user.latitude, user.longitude], { icon }).addTo(map);

      marker.on("click", () => {
        showUserPopup(user);
      });
    });
  }

function showUserPopup(user) {
  const popup = document.getElementById("user-popup");
  const avatar = document.getElementById("popup-avatar");
  const username = document.getElementById("popup-username");
  const location = document.getElementById("popup-location");
  const distance = document.getElementById("popup-distance");

  // Armazena o ID do usuário atual no popup
  popup.dataset.userId = user.id;

  // Atualiza informações
  avatar.src = user.avatar_url || "/default-avatar.png";
  username.textContent = user.username || "Usuário desconhecido";
  location.textContent = user.city || "Localização não informada";
  distance.textContent = user.distance_km
    ? `a ~${user.distance_km} km de você`
    : "";

  popup.classList.remove("hidden");
  popup.classList.add("show");
}

// === Listener do botão de curtir ===
document.addEventListener("click", async (e) => {
  if (e.target && e.target.id === "like-btn") {
    const popup = document.getElementById("user-popup");
    const likedUserId = popup.dataset.userId;

    if (!likedUserId) return;

    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

      const response = await fetch("/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ user_id: likedUserId }),
      });

      if (response.ok) {
        alert("❤️ Você curtiu esse usuário!");
      } else {
        const data = await response.json().catch(() => ({}));
        alert(`Erro ao curtir: ${data.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao enviar curtida:", error);
      alert("⚠️ Falha ao enviar curtida. Verifique o console.");
    }
  }
});
});

// Estilo do marcador com avatar circular
const style = document.createElement("style");
style.textContent = `
  .marker-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid #00aaff;
    object-fit: cover;
  }
`;
document.head.appendChild(style);
