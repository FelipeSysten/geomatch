class MatchChannel < ApplicationCable::Channel
  def subscribed
    @match = Match.find_by(id: params[:match_id])
    user = connection.current_user
    # rejeita se não existir match ou se user não for participante
    reject unless @match && user && @match.participant?(user)

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

    MatchChannel.broadcast_to(@match.to_gid_param, {
      typing: !!data['typing'],
      user_id: user.id,
      user_name: user.display_name,
      user_avatar: user.avatar_url # opcional
    })
  end
end
