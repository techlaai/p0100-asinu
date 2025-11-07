import crypto from "crypto";

const ALGORITHM = "scrypt";
const SALT_BYTES = 16;
const KEY_LENGTH = 64;

function scrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) {
        reject(err);
      } else {
        resolve(derivedKey as Buffer);
      }
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_BYTES).toString("hex");
  const derived = await scrypt(password, salt);
  return `${ALGORITHM}:${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  const [algorithm, salt, hash] = stored.split(":");
  if (algorithm !== ALGORITHM || !salt || !hash) {
    return false;
  }

  const derived = await scrypt(password, salt);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== derived.length) {
    return false;
  }
  return crypto.timingSafeEqual(expected, derived);
}
