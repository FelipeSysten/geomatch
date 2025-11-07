document.addEventListener("DOMContentLoaded", () => {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Inicializa o mapa
        const map = L.map("map").setView([userLat, userLng], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        // Marcador do usuário atual
        L.marker([userLat, userLng])
          .addTo(map)
          .bindPopup("<b>Você está aqui</b>")
          .openPopup();

        // Buscar usuários próximos
        fetch(`/users/nearby?latitude=${userLat}&longitude=${userLng}`)
          .then((response) => {
            if (!response.ok) throw new Error("Erro ao buscar usuários");
            return response.json();
          })
          .then((data) => {
            data.forEach((user) => {
              if (user.latitude && user.longitude) {
                L.marker([user.latitude, user.longitude])
                  .addTo(map)
                  .bindPopup(
                    `<b>${user.username || "Usuário"}</b><br>Distância: ${user.distance_km} km`
                  );
              }
            });
          })
          .catch((error) => {
            console.error("Erro ao buscar usuários próximos:", error);
          });
      },
      (error) => {
        alert("Não foi possível acessar sua localização.");
        console.error(error);
      }
    );
  } else {
    alert("Seu navegador não suporta geolocalização.");
  }
});
