import bcrypt from "bcrypt";

const SALT_ROUNDS = 10; // jitna zyada, utna secure but slow (10 industry-standard hai)

// Password ko hash karne ke liye
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Login ke time compare karne ke liye — plain password vs stored hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}