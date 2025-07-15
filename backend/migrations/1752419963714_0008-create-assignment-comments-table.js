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
    pgm.createTable('assignment_comments', {
    id:             'id',
    assignment_id:  {
      type: 'integer',
      notNull: true,
      references: 'assignments(id)',
      onDelete: 'cascade'
    },
    user_id:        {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    text:           { type: 'text', notNull: true },
    private:        { type: 'boolean', notNull: true, default: false },
    deleted_at:     { type: 'timestamptz' },
    created_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  })

  pgm.createIndex('assignment_comments', 'assignment_id')
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('assignment_comments')
};
