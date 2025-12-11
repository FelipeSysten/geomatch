class MatchChannel < ApplicationCable::Channel
  def subscribed
  @match = Match.find_by(id: params[:match_id])
  user = connection.current_user
  
  # rejeita se não existir match ou se user não for participante
  unless @match && user && @match.participant?(user)
    reject
    return # <--- INTERROMPE A EXECUÇÃO DO MÉTODO
  end

  # use stream_for para ficar alinhado com broadcast_to
  stream_for @match.to_gid_param
end

  def unsubscribed
    # cleanup se necessário
  end

  # Recebe dados do frontend (typing)
  def receive(data)
    user = connection.current_user
    return unless @match && user && @match.participant?(user)

    # Mude MatchChannel.broadcast_to(@match.to_gid_param, ...) para ActionCable.server.broadcast(stream_name, ...)
    stream_name = "match:#{@match.to_gid_param}" # O nome do stream que você está usando
    
    ActionCable.server.broadcast(stream_name, {
      typing: !!data['typing'],
      user_id: user.id,
      user_name: user.display_name || "Usuário",
      user_avatar: user.avatar_url
    })
  end
end
