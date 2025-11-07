class MessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match

  def index
    @messages = @match.messages.order(created_at: :asc)
    render json: @messages
  end

  def create
    @message = @match.messages.build(message_params)
    @message.sender = current_user

    if @message.save
      redirect_to match_path(@match)
    else
      render "matches/show", alert: "Erro ao enviar mensagem."
    end
  end

  private

  def set_match
    @match = Match.find(params[:match_id])
  end

  def message_params
    params.require(:message).permit(:content)
  end
end
