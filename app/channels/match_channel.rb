class MatchChannel < ApplicationCable::Channel
  def subscribed
    @match = Match.find_by(id: params[:match_id])
    user = connection.current_user
    
    unless @match && user && @match.participant?(user)
      reject
      return
    end

    # CORRETO: Mantém o stream_for para escutar o canal
    stream_from "match:#{@match.to_gid_param}"
  end

  def unsubscribed
    # cleanup se necessário
  end

  # Recebe dados do frontend (typing)
  def receive(data)
    user = connection.current_user
    return unless @match && user && @match.participant?(user)

    # CORRETO: Use o objeto GID para o broadcast.
    # O ActionCable/SolidCable deve ser capaz de resolver isso,
    # e é a forma correta de se alinhar com o `stream_for`.
       ActionCable.server.broadcast("match:#{@match.to_gid_param}", {
      typing: !!data['typing'],
      user_id: user.id,
      user_name: user.display_name || "Usuário",
      user_avatar: user.avatar_url
    })
  end
end