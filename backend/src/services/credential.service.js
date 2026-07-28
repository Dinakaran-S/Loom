const crypto = require("crypto");
const env = require("../config/env");
const credentialModel = require("../models/providerCredential.model");
const { ServiceUnavailableError } = require("../utils/errors");

function key() {
  if (!env.credentialEncryptionKey) {
    throw new ServiceUnavailableError("Provider key storage is unavailable: configure CREDENTIAL_ENCRYPTION_KEY");
  }
  return crypto.createHash("sha256").update(env.credentialEncryptionKey).digest();
}

function encrypt(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}

function decrypt(value) {
  const [iv, tag, ciphertext] = String(value).split(".");
  if (!iv || !tag || !ciphertext) throw new ServiceUnavailableError("Stored provider credential is invalid");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

async function saveGroqKey(userId, apiKey) {
  await credentialModel.upsert({ userId, provider: "groq", encryptedSecret: encrypt(apiKey) });
}

async function getGroqKey(userId) {
  const record = await credentialModel.findByUserAndProvider(userId, "groq");
  return record ? decrypt(record.encrypted_secret) : "";
}

async function hasGroqKey(userId) {
  return Boolean(await credentialModel.findByUserAndProvider(userId, "groq"));
}

module.exports = { saveGroqKey, getGroqKey, hasGroqKey };
