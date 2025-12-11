class Message < ApplicationRecord  
  include GlobalID::Identification
  belongs_to :match
  belongs_to :sender, class_name: "User"

  validates :content, presence: true

  after_create_commit :broadcast_message

  private

  def broadcast_message
    Rails.logger.info "BROADCAST_DEBUG: id=#{id}, sender=#{sender_id}, avatar=#{sender.avatar_url.inspect}"

    MatchChannel.broadcast_to(match.to_gid_param, {
      message: {
       id: id,
       content: content,
       sender_id: sender_id,
       created_at: created_at.iso8601,
       user_name: sender.display_name || "Usuário Desconhecido", # Use user_name para consistência com o JS
       avatar_url: sender.avatar_url || "/assets/avatarfoto.jpg"
      }
    })
  end
end