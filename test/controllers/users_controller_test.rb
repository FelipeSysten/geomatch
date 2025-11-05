require "test_helper"

class UsersControllerTest < ActionDispatch::IntegrationTest
  test "should get nearby" do
    get users_nearby_url
    assert_response :success
  end
end
