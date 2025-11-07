class MatchesController < ApplicationController
  before_action :authenticate_user!

  def index
    # Usa o escopo for_user em vez de current_user.matches (ficará mais limpo e confiável)
    @matches = Match.for_user(current_user.id).page(params[:page]).per(10)
  end

  def show
    @match = Match.find(params[:id])
    @messages = @match.messages.order(created_at: :asc)
    @message = Message.new
  end
end
