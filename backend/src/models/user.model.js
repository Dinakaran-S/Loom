const { pool } = require("../config/db");

async function findByEmail(email) {
  const [rows] = await pool.execute(
    "SELECT id, email, password_hash, name, role, created_at FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    "SELECT id, email, name, role, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function create({ id, email, passwordHash, name, role = "user" }) {
  await pool.execute(
    "INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)",
    [id, email, passwordHash, name, role]
  );
  return findById(id);
}

// Supabase owns credentials. The local row exists to satisfy the MySQL
// project foreign key and must never be used for password authentication.
async function upsertSupabaseUser({ id, email, name, role = "user" }) {
  if (!id || !email) throw new Error("Supabase user is missing an id or email");
  await pool.execute(
    `INSERT INTO users (id, email, password_hash, name, role)
     VALUES (?, ?, 'SUPABASE_MANAGED', ?, ?)
     ON DUPLICATE KEY UPDATE email = VALUES(email), name = VALUES(name), role = VALUES(role)`,
    [id, email, name || email.split("@")[0], role]
  );
  return findById(id);
}

module.exports = { findByEmail, findById, create, upsertSupabaseUser };
