class LikesController < ApplicationController
  before_action :authenticate_user!

  def create
    liked_user = User.find(params[:user_id])

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
      render json: { error: "Erro ao curtir" }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Usuário não encontrado" }, status: :not_found
  rescue => e
    Rails.logger.error("Erro ao curtir: #{e.message}")
    render json: { error: "Erro interno no servidor" }, status: :internal_server_error
  end
end
