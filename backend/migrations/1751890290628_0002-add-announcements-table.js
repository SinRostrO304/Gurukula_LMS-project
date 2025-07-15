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
    pgm.createTable('announcements', {
    id:         'id',  // serial primary key
    class_id:   {
      type: 'integer',
      notNull: true,
      references: 'classes(id)',
      onDelete: 'cascade'
    },
    // JSON blob of Draft.js raw content
    content:    { type: 'jsonb', notNull: true },
    // optional tag list
    tags:       { type: 'text[]' },
    // optional scheduled publish time
    schedule:   { type: 'timestamptz' },
    // pin this announcement to top?
    pinned:     { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('announcements', 'class_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('announcements');
};
