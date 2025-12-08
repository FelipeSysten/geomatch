class MessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_match

  Rails.logger.error "MSG_DEBUG: match=#{@match&.id}, user=#{current_user&.id}, params=#{params.inspect}"


  def index
    @messages = @match.messages.order(created_at: :asc)
    # Apenas para garantir que o frontend tenha os dados iniciais
    render json: @messages.map { |m| { id: m.id, content: m.content, sender_id: m.sender_id, created_at: m.created_at.iso8601 } }
  end

  def create
     unless @match.participant?(current_user)
     return head :forbidden
     end
    
    @message = @match.messages.build(message_params)
    @message.sender = current_user

    if @message.save
      # Retorna um status de sucesso.
      head :ok
    else
      render json: { errors: @message.errors.full_messages }, status: :unprocessable_entity
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