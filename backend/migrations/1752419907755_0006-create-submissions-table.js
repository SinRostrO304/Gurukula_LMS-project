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
    pgm.createTable('submissions', {
    id:            'id',
    assignment_id: {
      type: 'integer',
      notNull: true,
      references: 'assignments(id)',
      onDelete: 'cascade'
    },
    user_id: {
      type: 'integer',
      notNull: true,
      references: 'users(id)',
      onDelete: 'cascade'
    },
    submitted_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    graded:        { type: 'boolean', notNull: true, default: false },
    grade:         { type: 'numeric(5,2)' },
    feedback:      { type: 'text' },
    deleted_at:    { type: 'timestamptz' },
    created_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at:    { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  })

  pgm.addConstraint('submissions', 'submissions_unique_assignment_user', {
    unique: ['assignment_id', 'user_id']
  })
  pgm.createIndex('submissions', 'assignment_id')
  pgm.createIndex('submissions', 'user_id')
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('submissions')
};
