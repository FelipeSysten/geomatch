class AddFieldsToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :username, :string
    add_index :users, :username, unique: true
    add_column :users, :bio, :text
    add_column :users, :gender, :string
    add_column :users, :birthdate, :date
    add_column :users, :latitude, :decimal, precision: 10, scale: 6
    add_column :users, :longitude, :decimal, precision: 10, scale: 6
    add_column :users, :share_location, :boolean
  end
end
