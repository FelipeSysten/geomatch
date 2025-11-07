# app/controllers/discover_controller.rb
class DiscoverController < ApplicationController

    before_action :authenticate_user! 
    def index
  # Service Object para buscar usuários próximos
  @nearby_users = DiscoveryService.new(current_user).find_nearby_users
  # Não paginar aqui, pois a busca é por proximidade e o mapa deve carregar todos os marcadores relevantes.
    end
end