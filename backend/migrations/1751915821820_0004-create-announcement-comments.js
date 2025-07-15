/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
    pgm.createTable('announcement_comments', {
    id:              'id',         // serial primary key
    announcement_id: {
      type: 'integer',
      notNull: true,
      references: 'announcements(id)',
      onDelete: 'cascade'
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    text:            { type: 'text', notNull: true },
    created_at:      { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createIndex('announcement_comments', 'announcement_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('announcement_comments');
};
