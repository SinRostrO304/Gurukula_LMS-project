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
    pgm.createTable('assignments', {
    id:          'id',
    class_id:    {
      type: 'integer', notNull: true,
      references: 'classes(id)', onDelete: 'cascade'
    },
    type:        { type: 'text', notNull: true },
    title:       { type: 'text', notNull: true },
    description: { type: 'jsonb' },
    due:         { type: 'timestamptz' },
    schedule:    { type: 'timestamptz' },
    assign_to:   { type: 'text[]' },
    points:      { type: 'integer' },
    quiz_link:   { type: 'text' },
    question_type: { type: 'text' },
    question_opts: { type: 'text[]' },
    reuse:       { type: 'jsonb' },
    created_at:  { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });
  pgm.createIndex('assignments', 'class_id');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('assignments');
};
