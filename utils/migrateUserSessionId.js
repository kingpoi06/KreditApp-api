import db from "../config/Database.js";

const qi = db.getQueryInterface();
const tableName = "users";

const quoteTable = (table) => qi.queryGenerator.quoteTable(table);
const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const getColumns = async () => {
  try {
    return await qi.describeTable(tableName);
  } catch (error) {
    return null;
  }
};

const ensureColumn = async (columns, column, definition) => {
  if (columns?.[column]) return false;
  const table = quoteTable(tableName);
  await db.query(
    `ALTER TABLE ${table} ADD COLUMN ${quoteIdentifier(column)} ${definition}`
  );
  return true;
};

export default async function migrateUserSessionId() {
  const columns = await getColumns();
  if (!columns) return;
  await ensureColumn(columns, "sessionId", "VARCHAR(64) NULL");
}
