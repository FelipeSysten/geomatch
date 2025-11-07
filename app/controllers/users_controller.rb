class UsersController < ApplicationController
  before_action :authenticate_user!
  # before_action :set_user, only: [:show, :update_location]

  # Página principal de descoberta
  def discover
  end

  # Endpoint JSON para o mapa buscar usuários próximos
  def nearby
    # Atualiza coordenadas do usuário, se vierem por parâmetro
    if params[:latitude].present? && params[:longitude].present?
      current_user.update(latitude: params[:latitude], longitude: params[:longitude])
    end

    # Chama o service que faz a busca via Geocoder
    service = DiscoveryService.new(current_user)
    nearby_users = service.find_nearby_users(10) # raio de 10 km

    render json: nearby_users
  rescue => e
    Rails.logger.error "Erro no endpoint /users/nearby: #{e.message}"
    render json: { error: "Erro interno ao buscar usuários próximos" }, status: :internal_server_error
  end

  private

  def set_user
    @user = User.find(params[:id])
  end
end
