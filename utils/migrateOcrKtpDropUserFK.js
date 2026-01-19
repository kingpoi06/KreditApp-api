import db from "../config/Database.js";

const qi = db.getQueryInterface();
const tableName = "datanasabah/ocr-ktp";

const quoteTable = (table) => qi.queryGenerator.quoteTable(table);
const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const getForeignKeys = async () => {
  try {
    const [rows] = await db.query(
      `SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, COLUMN_NAME
       FROM information_schema.KEY_COLUMN_USAGE
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = :tableName
         AND REFERENCED_TABLE_NAME IS NOT NULL`,
      { replacements: { tableName } }
    );
    return rows;
  } catch (error) {
    return null;
  }
};

const dropForeignKey = async (constraintName) => {
  const table = quoteTable(tableName);
  await db.query(
    `ALTER TABLE ${table} DROP FOREIGN KEY ${quoteIdentifier(constraintName)}`
  );
};

export default async function migrateOcrKtpDropUserFK() {
  const keys = await getForeignKeys();
  if (!keys || keys.length === 0) return;

  const targets = keys.filter(
    (item) =>
      item?.REFERENCED_TABLE_NAME === "users" ||
      item?.COLUMN_NAME === "kdpegawai"
  );

  for (const key of targets) {
    if (key?.CONSTRAINT_NAME) {
      await dropForeignKey(key.CONSTRAINT_NAME);
    }
  }
}
