class AddTriggersForChannelHash < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      CREATE OR REPLACE FUNCTION solid_cable_hash_channel()
      RETURNS trigger AS $$
      BEGIN
        NEW.channel_hash := encode(digest(NEW.channel, 'sha256'), 'hex');
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER solid_cable_messages_hash_trigger
      BEFORE INSERT ON solid_cable_messages
      FOR EACH ROW
      EXECUTE FUNCTION solid_cable_hash_channel();
    SQL
  end

  def down
    execute <<~SQL
      DROP TRIGGER IF EXISTS solid_cable_messages_hash_trigger ON solid_cable_messages;
      DROP FUNCTION IF EXISTS solid_cable_hash_channel();
    SQL
  end
end
