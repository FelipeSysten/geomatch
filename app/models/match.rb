class Match < ApplicationRecord
  belongs_to :user
  belongs_to :matched_user, class_name: "User"

  has_many :messages, dependent: :destroy

  def other_user(current_user)
    current_user == user ? matched_user : user
  end

  scope :for_user, ->(user_id) { where("user_id = ? OR matched_user_id = ?", user_id, user_id) }
end
