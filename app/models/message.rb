class Message < ApplicationRecord

  self.primary_key = 'id' 
  
  belongs_to :match
  belongs_to :sender, class_name: "User"

  validates :content, presence: true

  after_create_commit :broadcast_message

  private

  def broadcast_message
    Rails.logger.info "BROADCAST_DEBUG: id=#{id}, sender=#{sender_id}, avatar=#{sender.avatar_url.inspect}"

    MatchChannel.broadcast_to(match, {
      message: {
        id: id,
        content: content,
        sender_id: sender_id,
        created_at: created_at.iso8601,
        display_name: sender.display_name,
        avatar_url: sender.avatar_url
      }
    })
  end
end
