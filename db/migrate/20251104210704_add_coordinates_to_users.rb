class AddCoordinatesToUsers < ActiveRecord::Migration[8.1]
  def change
  add_column :users, :latitude, :float unless column_exists?(:users, :latitude)
  add_column :users, :longitude, :float unless column_exists?(:users, :longitude)
  end
end
