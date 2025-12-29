# app/services/discovery_service.rb
class DiscoveryService
  include Rails.application.routes.url_helpers
  def initialize(user)
    @user = user
  end

  # O método agora aceita o raio dinâmico enviado pelo UsersController
  def find_nearby_users(radius_km = 10)
    return [] unless @user.latitude && @user.longitude

    # 1. Busca usuários próximos dentro do raio definido
    # User.near é o método da gem Geocoder que faz a busca no banco de dados
    User.near([@user.latitude, @user.longitude], radius_km)
        .where.not(id: @user.id)
        .map do |u|
          # 2. Recalcula a distância para garantir precisão e formato (round(1))
          # Nota: Se o User.near já estiver retornando a distância, você pode usar u.distance
          # em vez de recalcular. Manteremos o cálculo manual por segurança.
          distance = Geocoder::Calculations.distance_between(
            [@user.latitude, @user.longitude],
            [u.latitude, u.longitude]
          ).round(1)

          {
            id: u.id,
            username: u.username,
            latitude: u.latitude,
            longitude: u.longitude,
            # 3. Adiciona o campo 'city' para exibição no popup do mapa
            city: u.city, 
            avatar_url: (u.avatar.attached? ? Rails.application.routes.url_helpers.rails_blob_url(u.avatar, only_path: true) : nil),
            distance_km: distance
          }
        end
  end
end
