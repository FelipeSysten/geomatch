# app/controllers/users_controller.rb
class UsersController < ApplicationController
  before_action :authenticate_user!

  # Página principal de descoberta (renderiza o mapa)
  def discover
    @nearby_users = DiscoveryService.new(current_user).find_nearby_users
  end

  # Endpoint JSON para o mapa buscar usuários próximos
  def nearby
    # Atualiza coordenadas do usuário, se vierem no request
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
  
   # Ação para exibir o formulário de edição de perfil
  def edit
    @user = current_user
  end
  
  # Atualização de perfil
  def update
    @user = current_user

    if @user.update(user_params)
      redirect_to edit_profile_path, notice: "Perfil atualizado com sucesso."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  # Strong params
  def user_params
    params.require(:user).permit(:username, :bio, :avatar)
  end
end