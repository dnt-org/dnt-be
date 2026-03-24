'use strict';

module.exports = {
  async up(knex) {
    // Create businesses table
    const hasTable = await knex.schema.hasTable('businesses');
    if (!hasTable) {
      await knex.raw(`
        CREATE TABLE businesses (
            id SERIAL PRIMARY KEY,
            business_fullname VARCHAR(255),
            user_id INTEGER NOT NULL,
            tax_code VARCHAR(100),
            headquarters_address VARCHAR(500),
            headquarters_address_province_code VARCHAR(50),
            headquarters_address_nation_code VARCHAR(50),
            current_address VARCHAR(500),
            current_address_province_code VARCHAR(50),
            current_address_nation_code VARCHAR(50),
            current_address_map VARCHAR(500),
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await knex.raw(`CREATE INDEX idx_businesses_user_id ON businesses(user_id);`);
    }

    // Add business_id column to up_users (nullable)
    const hasColumn = await knex.schema.hasColumn('up_users', 'business_id');
    if (!hasColumn) {
      await knex.raw(`ALTER TABLE up_users ADD COLUMN business_id INTEGER;`);
    }
  },

  async down(knex) {
    // Remove business_id column from up_users
    const hasColumn = await knex.schema.hasColumn('up_users', 'business_id');
    if (hasColumn) {
      await knex.raw(`ALTER TABLE up_users DROP COLUMN business_id;`);
    }

    await knex.schema.dropTableIfExists('businesses');
  },
};
