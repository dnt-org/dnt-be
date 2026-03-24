'use strict';

module.exports = {
  async up(knex) {
    // Drop user_devices if it was accidentally created by previous mistaken migration
    const hasDevices = await knex.schema.hasTable('user_devices');
    if (hasDevices) {
      await knex.schema.dropTableIfExists('user_devices');
    }

    const hasTable = await knex.schema.hasTable('user_sessions');
    if (!hasTable) {
      await knex.raw(`
        CREATE TABLE user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES up_users(id) ON DELETE CASCADE,
            
            -- Thông tin thiết bị & vị trí
            device_name VARCHAR(255),
            location TEXT,
            
            -- Trạng thái
            is_familiar BOOLEAN DEFAULT TRUE,
            login_type VARCHAR(50) DEFAULT 'password',
            status VARCHAR(20) DEFAULT 'login',
            
            -- Thời gian
            last_login_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      await knex.raw(`CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);`);
    }
  },

  async down(knex) {
    await knex.schema.dropTableIfExists('user_sessions');
  },
};
