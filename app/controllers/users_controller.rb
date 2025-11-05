class UsersController < ApplicationController
  def nearby
    # Valida se os parâmetros latitude e longitude foram fornecidos
    if params[:latitude].blank? || params[:longitude].blank?
      render json: { error: "Parâmetros 'latitude' e 'longitude' são obrigatórios." }, status: :unprocessable_entity
      return
    end

    # Lê os parâmetros recebidos
    latitude = params[:latitude].to_f
    longitude = params[:longitude].to_f
    distance = params[:distance].to_f || 10 # Usa 10 km como padrão

    # Garante que o usuário atual esteja autenticado
    if current_user.nil?
      render json: { error: "Usuário não autenticado." }, status: :unauthorized
      return
    end

    # Busca os usuários próximos
    users = User.where.not(id: current_user.id) # Exclui o próprio usuário
                .where(share_location: true) # Apenas quem compartilha sua localização
                .where.not(latitude: nil, longitude: nil) # Ignora coordenadas nulas
                .near([latitude, longitude], distance) # Busca num raio especificado

    # Retorna os resultados como JSON
    render json: users.map { |user|
      {
        id: user.id,
        username: user.username,
        latitude: user.latitude,
        longitude: user.longitude,
        address: user.address || "Endereço não informado"
      }
    }
  rescue => e
    # Tratar possíveis erros
    render json: { error: "Erro interno: #{e.message}" }, status: :internal_server_error
  end
end