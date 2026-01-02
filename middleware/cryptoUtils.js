import crypto from "crypto";

export function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(encryptedData, key) {
  const [iv, encryptedText] = encryptedData.split(":");
  const ivBuffer = Buffer.from(iv, "hex");
  const encryptedTextBuffer = Buffer.from(encryptedText, "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    ivBuffer
  );
  let decrypted = decipher.update(encryptedTextBuffer);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}