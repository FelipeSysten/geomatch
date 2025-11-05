class User < ApplicationRecord
  has_one_attached :avatar

  # Devise (autenticação)
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Geocoding functionalities
  geocoded_by :address
  after_validation :geocode, if: :will_save_change_to_address?

  # Buscar usuários num raio de distância específico (em km)
  scope :nearby, ->(latitude, longitude, distance = 10) {
    near([ latitude, longitude ], distance)
  }
end
