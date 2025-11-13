class LikesController < ApplicationController
  before_action :authenticate_user!

  def create
    liked_user = User.find(params[:user_id])

    # 1. Verifica se o like já existe para evitar erro de duplicidade
    if Like.exists?(liker_id: current_user.id, liked_id: liked_user.id)
      return render json: { message: "Você já curtiu este usuário.", status: "already_liked" }, status: :ok
    end

    @like = Like.new(
      liker_id: current_user.id,
      liked_id: liked_user.id
    )

    if @like.save
      if Like.exists?(liker_id: liked_user.id, liked_id: current_user.id)
        Match.create(user_id: current_user.id, matched_user_id: liked_user.id, status: "matched")
        Match.create(user_id: liked_user.id, matched_user_id: current_user.id, status: "matched")

        render json: { message: "💘 Deu match!" }, status: :ok
      else
        render json: { message: "Curtida enviada!" }, status: :ok
      end
    else
      # 2. Se o save falhar por outro motivo (ex: validação), retorna erro genérico
      render json: { error: "Não foi possível registrar a curtida. Tente novamente." }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Usuário não encontrado" }, status: :not_found
  rescue => e
    Rails.logger.error("Erro ao curtir: #{e.message}")
    render json: { error: "Erro interno no servidor" }, status: :internal_server_error
  end
end
