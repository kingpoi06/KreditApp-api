import db from "../config/Database.js";
import DataPermohonan from "../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";

const qi = db.getQueryInterface();
const tableName = "datanasabah/data-permohonan";

const quoteTable = (table) => qi.queryGenerator.quoteTable(table);
const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;

const getColumns = async () => {
  try {
    return await qi.describeTable(tableName);
  } catch (error) {
    return null;
  }
};

const getAllowedColumns = () => {
  const attributes = DataPermohonan.rawAttributes || {};
  const allowed = new Set();
  Object.entries(attributes).forEach(([key, attribute]) => {
    const fieldName = attribute?.field || key;
    allowed.add(fieldName);
  });
  allowed.add("createdAt");
  allowed.add("updatedAt");
  return allowed;
};

const dropColumn = async (column) => {
  const table = quoteTable(tableName);
  await db.query(
    `ALTER TABLE ${table} DROP COLUMN ${quoteIdentifier(column)}`
  );
};

export default async function migrateDataPermohonanColumns() {
  const columns = await getColumns();
  if (!columns) return;

  const allowed = getAllowedColumns();
  for (const column of Object.keys(columns)) {
    if (!allowed.has(column)) {
      await dropColumn(column);
    }
  }
}
