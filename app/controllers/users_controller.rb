# app/controllers/users_controller.rb
class UsersController < ApplicationController
  before_action :authenticate_user!

  # Página do mapa
  def discover
    @nearby_users = DiscoveryService.new(current_user).find_nearby_users
  end

   # Perfil Público
  def show
    # Busca o usuário pelo ID passado na URL (params[:id])
    @user = User.find(params[:id])

    # Se você quiser que apenas usuários logados vejam perfis:
    # before_action :authenticate_user! já deve estar no topo da classe.

  rescue ActiveRecord::RecordNotFound
    # Trata o caso de um ID inválido ou usuário inexistente
    redirect_to discover_path, alert: "Usuário não encontrado."
  end

  # Nova tela de Descoberta (Lead/Swipe)
  def lead
    # 🚨 1. CASO SEJA POPUP DE MATCH
    # Exemplo de rota: /lead?match=true&match_id=27
    if params[:match] == "true" && params[:match_id].present?
      @match = Match.find(params[:match_id])

      # Descobre quem é o outro usuário para mostrar no popup
      @next_user =
        if @match.user_id == current_user.id
          @match.matched_user
        else
          @match.user
        end

      # Não continua buscando novos usuários — somente exibe o popup
      return
    end

    # 🚀 2. CASO NORMAL (busca próximo usuário elegível)
    liked_ids = current_user.likes.pluck(:liked_id)

    @next_user, @distance =
      AdvancedDiscoveryService.new(current_user).find_next_eligible_user(liked_ids)

    # Renderiza a view normalmente
  end

  # Endpoint JSON para retornar usuários próximos
  def nearby
    if params[:latitude].present? && params[:longitude].present?
      current_user.update(
        latitude: params[:latitude],
        longitude: params[:longitude]
      )
    end

    users = DiscoveryService.new(current_user).find_nearby_users(10)

    render json: users.as_json(
      only: [:id, :username, :latitude, :longitude, :avatar_url, :distance_km]
    )
  rescue => e
    Rails.logger.error "Erro em /users/nearby: #{e.message}"
    render json: { error: "Erro interno ao buscar usuários próximos" },
           status: :internal_server_error
  end

  # Editar perfil
  def edit
    @user = current_user
  end

  def update
    @user = current_user

    # 1. Lida com o upload de novas fotos separadamente
    # Se o parâmetro album_photos estiver presente, anexa as novas fotos ao álbum.
    if params[:user][:album_photos].present?
      @user.album_photos.attach(params[:user][:album_photos])
    end

    # 2. Prepara os parâmetros para o update do restante do usuário
    # Remove o parâmetro album_photos para evitar que o Rails tente
    # processá-lo novamente no update, o que pode causar erros ou
    # comportamento inesperado (como tentar substituir em vez de adicionar).
    user_update_params = user_params.except(:album_photos)

    # 3. Atualiza o restante dos atributos do usuário
    if @user.update(user_update_params)
      redirect_to edit_profile_path, notice: "Perfil atualizado com sucesso!"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def user_params
    # O parâmetro album_photos: [] já está correto para permitir o array de arquivos
    params.require(:user).permit(
      :avatar,
      :username,
      :bio,
      :birthdate,
      :gender,
      :share_location,
      :interested_in,
      { hobbies_list: [] }, # RECEBE ARRAY
      album_photos: []      # <--- CORRETO: Permite o array de arquivos
    )
  end
end