import { QueryTypes } from "sequelize";
import db from "../config/Database.js";

const qi = db.getQueryInterface();
const databaseName = db.config?.database;

const quoteTable = (table) => qi.queryGenerator.quoteTable(table);
const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, "``")}\``;
const escapeValue = (value) => db.escape(value);

const getColumns = async (table) => {
  try {
    return await qi.describeTable(table);
  } catch (error) {
    return null;
  }
};

const getForeignKeysForColumn = async (table, column) => {
  if (!databaseName) return [];
  const rows = await db.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ${escapeValue(
      databaseName
    )} AND TABLE_NAME = ${escapeValue(table)} AND COLUMN_NAME = ${escapeValue(
      column
    )} AND REFERENCED_TABLE_NAME IS NOT NULL`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((row) => row.CONSTRAINT_NAME);
};

const dropForeignKeys = async (table, column) => {
  const constraints = await getForeignKeysForColumn(table, column);
  if (!constraints.length) return;
  const tableName = quoteTable(table);
  for (const constraint of constraints) {
    await db.query(
      `ALTER TABLE ${tableName} DROP FOREIGN KEY ${quoteIdentifier(constraint)}`
    );
  }
};

const getUniqueIndexesForColumn = async (table, column) => {
  if (!databaseName) return [];
  const rows = await db.query(
    `SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ${escapeValue(
      databaseName
    )} AND TABLE_NAME = ${escapeValue(table)} AND COLUMN_NAME = ${escapeValue(
      column
    )} AND NON_UNIQUE = 0 AND INDEX_NAME <> 'PRIMARY'`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((row) => row.INDEX_NAME);
};

const dropIndexes = async (table, indexes) => {
  if (!indexes.length) return;
  const tableName = quoteTable(table);
  for (const indexName of indexes) {
    await db.query(
      `ALTER TABLE ${tableName} DROP INDEX ${quoteIdentifier(indexName)}`
    );
  }
};

const dropUniqueIndexesForColumn = async (table, column) => {
  const indexes = await getUniqueIndexesForColumn(table, column);
  await dropIndexes(table, indexes);
};

const ensureColumn = async (table, columns, column, definition) => {
  if (columns?.[column]) return false;
  const tableName = quoteTable(table);
  await db.query(
    `ALTER TABLE ${tableName} ADD COLUMN ${quoteIdentifier(column)} ${definition}`
  );
  return true;
};

const dropColumnIfExists = async (table, columns, column) => {
  if (!columns?.[column]) return false;
  const tableName = quoteTable(table);
  await db.query(
    `ALTER TABLE ${tableName} DROP COLUMN ${quoteIdentifier(column)}`
  );
  return true;
};

const ensureNoNull = async (table, column) => {
  const tableName = quoteTable(table);
  const columnName = quoteIdentifier(column);
  const rows = await db.query(
    `SELECT COUNT(*) AS cnt FROM ${tableName} WHERE ${columnName} IS NULL OR ${columnName} = ''`,
    { type: QueryTypes.SELECT }
  );
  const count = Number(rows?.[0]?.cnt ?? 0);
  if (count > 0) {
    throw new Error(
      `Kolom ${table}.${column} masih memiliki ${count} data kosong. Lengkapi dulu sebelum ubah primary key.`
    );
  }
};

const ensureNoDuplicates = async (table, column) => {
  const tableName = quoteTable(table);
  const columnName = quoteIdentifier(column);
  const rows = await db.query(
    `SELECT ${columnName} AS value, COUNT(*) AS cnt FROM ${tableName} GROUP BY ${columnName} HAVING cnt > 1`,
    { type: QueryTypes.SELECT }
  );
  if (rows.length > 0) {
    throw new Error(
      `Duplicate ${column} ditemukan di ${table}: ${rows
        .map((row) => row.value)
        .join(", ")}`
    );
  }
};

const ensurePrimaryKey = async (table, columns, column) => {
  if (!columns?.[column]) {
    throw new Error(`Kolom ${table}.${column} belum tersedia.`);
  }
  const tableName = quoteTable(table);
  const pkColumns = Object.entries(columns)
    .filter(([, meta]) => meta.primaryKey)
    .map(([name]) => name);

  if (pkColumns.length === 1 && pkColumns[0] === column) return;

  if (pkColumns.length > 0) {
    await db.query(`ALTER TABLE ${tableName} DROP PRIMARY KEY`);
  }
  await db.query(
    `ALTER TABLE ${tableName} ADD PRIMARY KEY (${quoteIdentifier(column)})`
  );
};

const ensureColumnNullable = async (table, columns, column) => {
  const meta = columns?.[column];
  if (!meta || meta.allowNull) return;
  const tableName = quoteTable(table);
  await db.query(
    `ALTER TABLE ${tableName} MODIFY COLUMN ${quoteIdentifier(column)} ${meta.type} NULL`
  );
};

const ensureColumnNotNull = async (table, columns, column, fallbackType) => {
  const meta = columns?.[column];
  if (!meta || meta.allowNull === false) return;
  const tableName = quoteTable(table);
  const type = meta?.type ?? fallbackType;
  await db.query(
    `ALTER TABLE ${tableName} MODIFY COLUMN ${quoteIdentifier(column)} ${type} NOT NULL`
  );
};

export default async function migrateNoPermohonanPrimaryKey() {
  const dataDiriTable = "datanasabah-data-diri";
  const dataUsahaTable = "datanasabah/data-usaha";
  const dataJaminanTable = "datanasabah/data-jaminan";
  const dataPermohonanTable = "datanasabah/data-permohonan";

  let dataUsahaColumns = await getColumns(dataUsahaTable);
  if (dataUsahaColumns) {
    const addedNoPermohonan = await ensureColumn(
      dataUsahaTable,
      dataUsahaColumns,
      "no_permohonan",
      "VARCHAR(50) NULL"
    );
    if (addedNoPermohonan) {
      dataUsahaColumns = await getColumns(dataUsahaTable);
    }

    if (dataUsahaColumns?.nik) {
      const usahaTableName = quoteTable(dataUsahaTable);
      const diriTableName = quoteTable(dataDiriTable);
      await db.query(
        `UPDATE ${usahaTableName} du JOIN ${diriTableName} dd ON du.nik = dd.nik SET du.no_permohonan = dd.no_permohonan WHERE du.no_permohonan IS NULL OR du.no_permohonan = ''`
      );
      await ensureColumnNullable(dataUsahaTable, dataUsahaColumns, "nik");
    }

    await dropForeignKeys(dataUsahaTable, "nik");
    await dropForeignKeys(dataUsahaTable, "datanasabah/dataDiriNik");

    await ensureNoNull(dataUsahaTable, "no_permohonan");
    await ensureNoDuplicates(dataUsahaTable, "no_permohonan");
    await ensureColumnNotNull(dataUsahaTable, dataUsahaColumns, "no_permohonan", "VARCHAR(50)");
    dataUsahaColumns = await getColumns(dataUsahaTable);
    await ensurePrimaryKey(dataUsahaTable, dataUsahaColumns, "no_permohonan");
  }

  let dataDiriColumns = await getColumns(dataDiriTable);
  if (dataDiriColumns) {
    const addedId = await ensureColumn(
      dataDiriTable,
      dataDiriColumns,
      "idDataDiriNasabah",
      "CHAR(36) NULL"
    );
    if (addedId) {
      dataDiriColumns = await getColumns(dataDiriTable);
    }

    await dropUniqueIndexesForColumn(dataDiriTable, "nik");

    const dataDiriTableName = quoteTable(dataDiriTable);
    const idColumn = quoteIdentifier("idDataDiriNasabah");
    await db.query(
      `UPDATE ${dataDiriTableName} SET ${idColumn} = UUID() WHERE ${idColumn} IS NULL OR ${idColumn} = ''`
    );

    await ensureNoNull(dataDiriTable, "idDataDiriNasabah");
    await ensureColumnNotNull(
      dataDiriTable,
      dataDiriColumns,
      "idDataDiriNasabah",
      "CHAR(36)"
    );
    dataDiriColumns = await getColumns(dataDiriTable);

    await ensureNoNull(dataDiriTable, "no_permohonan");
    await ensureNoDuplicates(dataDiriTable, "no_permohonan");
    await ensurePrimaryKey(dataDiriTable, dataDiriColumns, "idDataDiriNasabah");
  }

  let dataJaminanColumns = await getColumns(dataJaminanTable);
  if (dataJaminanColumns) {
    const droppedNamaPemilik = await dropColumnIfExists(
      dataJaminanTable,
      dataJaminanColumns,
      "namapemilik"
    );
    if (droppedNamaPemilik) {
      dataJaminanColumns = await getColumns(dataJaminanTable);
    }

    await ensureNoNull(dataJaminanTable, "no_permohonan");
    await ensureNoDuplicates(dataJaminanTable, "no_permohonan");
    await ensureColumnNotNull(
      dataJaminanTable,
      dataJaminanColumns,
      "no_permohonan",
      "VARCHAR(50)"
    );
    const refreshedColumns = await getColumns(dataJaminanTable);
    await ensurePrimaryKey(dataJaminanTable, refreshedColumns, "no_permohonan");
  }

  const dataPermohonanColumns = await getColumns(dataPermohonanTable);
  if (dataPermohonanColumns) {
    await ensureNoNull(dataPermohonanTable, "no_permohonan");
    await ensureNoDuplicates(dataPermohonanTable, "no_permohonan");
    await ensureColumnNotNull(
      dataPermohonanTable,
      dataPermohonanColumns,
      "no_permohonan",
      "VARCHAR(50)"
    );
    const refreshedColumns = await getColumns(dataPermohonanTable);
    await ensurePrimaryKey(
      dataPermohonanTable,
      refreshedColumns,
      "no_permohonan"
    );
  }
}
