import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;
const qi = db.getQueryInterface();
const tableName = "datanasabah-data-diri";

const getColumns = async () => {
  try {
    return await qi.describeTable(tableName);
  } catch (error) {
    return null;
  }
};

const addColumnIfMissing = async (columns, columnName, definition) => {
  if (columns && columns[columnName]) return;
  await qi.addColumn(tableName, columnName, definition);
};

export default async function migrateDatadiriSlikColumns() {
  const columns = await getColumns();
  if (!columns) return;

  await addColumnIfMissing(columns, "slik", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await addColumnIfMissing(columns, "slikText", {
    type: DataTypes.TEXT("long"),
    allowNull: true,
  });
  await addColumnIfMissing(columns, "slikPenanggungJawab", {
    type: DataTypes.STRING(255),
    allowNull: true,
  });
  await addColumnIfMissing(columns, "slikTextPenanggungJawab", {
    type: DataTypes.TEXT("long"),
    allowNull: true,
  });
}
