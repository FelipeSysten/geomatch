class Message < ApplicationRecord
  belongs_to :match
  belongs_to :sender, class_name: "User"

  validates :content, presence: true

  after_create_commit :broadcast_message

  Rails.logger.error "BROADCAST_DEBUG: sender=#{sender&.id}, avatar=#{sender&.avatar_url.inspect}"


  private

def broadcast_message
MatchChannel.broadcast_to(match, {
  message: {
    id: id,
    content: content,
    sender_id: sender_id,
    created_at: created_at.iso8601,
    display_name: sender.display_name,
    avatar_url: sender.avatar_url # se usar ActiveStorage, gere url como fez
  }
})
end
end