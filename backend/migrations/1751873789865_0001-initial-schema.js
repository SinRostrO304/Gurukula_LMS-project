// backend/migrations/1751873789865_0001-initial-schema.js
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
    pgm.sql(`
    -- users table
    CREATE TABLE IF NOT EXISTS public.users (
      id            SERIAL PRIMARY KEY,
      email         VARCHAR(255)    NOT NULL UNIQUE,
      password      VARCHAR(255)    NOT NULL,
      metadata      JSONB           NOT NULL DEFAULT '{}'::jsonb,
      created_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
      verified      BOOLEAN         NOT NULL DEFAULT FALSE,
      verify_token  VARCHAR(64),
      reset_token   VARCHAR(64),
      reset_expires TIMESTAMP
    );

    -- classes table
    CREATE TABLE IF NOT EXISTS public.classes (
      id          SERIAL         PRIMARY KEY,
      code        VARCHAR(8)     NOT NULL UNIQUE,
      name        TEXT           NOT NULL,
      section     TEXT,
      subject     TEXT,
      room        TEXT,
      description TEXT,
      cover_url   TEXT,
      owner_id    INTEGER        NOT NULL
                     REFERENCES public.users(id) ON DELETE CASCADE,
      created_at  TIMESTAMP      NOT NULL DEFAULT now()
    );

    -- class_enrollments table
    CREATE TABLE IF NOT EXISTS public.class_enrollments (
      id         SERIAL    PRIMARY KEY,
      user_id    INTEGER   NOT NULL
                    REFERENCES public.users(id)   ON DELETE CASCADE,
      class_id   INTEGER   NOT NULL
                    REFERENCES public.classes(id) ON DELETE CASCADE,
      role       TEXT      NOT NULL DEFAULT 'student',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(user_id, class_id)
    );

    CREATE INDEX IF NOT EXISTS idx_enroll_user
      ON public.class_enrollments(user_id);

    CREATE INDEX IF NOT EXISTS idx_enroll_class
      ON public.class_enrollments(class_id);
  `)
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
    pgm.dropTable('class_enrollments')
  pgm.dropTable('classes')
  pgm.dropTable('users')
};
