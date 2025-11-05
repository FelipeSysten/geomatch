// Aguarde a DOM ser carregada antes de executar o script
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se o navegador suporta Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Inicializa o mapa na localização do usuário
        const map = L.map("map").setView([userLat, userLng], 13);

        // Configuração da camada TileLayer do OpenStreetMap
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        // Faz a requisição para buscar usuários próximos (API backend)
        fetch(`/users/nearby?latitude=${userLat}&longitude=${userLng}`)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Erro ao carregar usuários próximos");
            }
            return response.json();
          })
          .then((data) => {
            // Adiciona marcadores no mapa para cada usuário retornado
            data.forEach((user) => {
              L.marker([user.latitude, user.longitude])
                .bindPopup(
                  `<b>${user.name || "Usuário"}</b><br>${user.address || "Sem endereço"}`
                )
                .addTo(map);
            });
          })
          .catch((error) => {
            console.error("Erro ao buscar usuários próximos:", error.message);
          });
      },
      // Caso não seja possível acessar a localização
      (error) => {
        console.error("Erro ao obter localização:", error.message);
        alert(
          "Não foi possível acessar sua localização. Verifique as permissões do navegador."
        );
      }
    );
  } else {
    console.error("Geolocation não é suportado pelo navegador.");
    alert("Seu navegador não suporta Geolocalização. Atualize para um navegador mais moderno.");
  }
});