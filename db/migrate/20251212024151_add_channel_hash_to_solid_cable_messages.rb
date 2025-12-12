class AddChannelHashToSolidCableMessages < ActiveRecord::Migration[8.1]
   def change
    add_column :solid_cable_messages, :channel_hash, :string, null: false, default: ""
    add_index :solid_cable_messages, :channel_hash
  end
end
