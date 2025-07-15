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
    pgm.createTable('materials', {
    id:             'id',
    assignment_id:  {
      type: 'integer',
      notNull: true,
      references: 'assignments(id)',
      onDelete: 'cascade'
    },
    filename:       { type: 'text', notNull: true },
    url:            { type: 'text', notNull: true },
    deleted_at:     { type: 'timestamptz' },
    created_at:     { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  })

  pgm.createIndex('materials', 'assignment_id')
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('materials')
};
