class CreateMatches < ActiveRecord::Migration[8.1]
  def change
    create_table :matches do |t|
      t.references :user, null: false, foreign_key: true
      t.references :matched_user, null: false, foreign_key: { to_table: :users }
      t.string :status

      t.timestamps
    end
  end
end
