const { pool } = require("../config/db");

async function findByEmail(email) {
  const { rows } = await pool.query(
    "SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = $1 LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(
    "SELECT id, email, name, role, created_at FROM users WHERE id = $1 LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function create({ id, email, passwordHash, name, role = "user" }) {
  await pool.query(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)",
    [id, email, passwordHash, name, role]
  );
  return findById(id);
}

// Supabase owns credentials. The local row exists to satisfy the Postgres
// project foreign key and must never be used for password authentication.
async function upsertSupabaseUser({ id, email, name, role = "user" }) {
  if (!id || !email) throw new Error("Supabase user is missing an id or email");
  await pool.query(
    `INSERT INTO users (id, email, password_hash, name, role)
     VALUES ($1, $2, 'SUPABASE_MANAGED', $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, name = EXCLUDED.name, role = EXCLUDED.role`,
    [id, email, name || email.split("@")[0], role]
  );
  return findById(id);
}

module.exports = { findByEmail, findById, create, upsertSupabaseUser };
