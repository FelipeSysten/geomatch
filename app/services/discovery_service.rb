class DiscoveryService
  def initialize(user)
    @user = user
  end

  def find_nearby_users(radius_km = 10)
    return [] unless @user.latitude && @user.longitude

    User.near([@user.latitude, @user.longitude], radius_km)
        .where.not(id: @user.id)
        .select(:id, :username, :latitude, :longitude)
        .map do |u|
          distance = Geocoder::Calculations.distance_between(
            [@user.latitude, @user.longitude],
            [u.latitude, u.longitude]
          ).round(2)
          u.attributes.merge(distance_km: distance)
        end
  end
end
