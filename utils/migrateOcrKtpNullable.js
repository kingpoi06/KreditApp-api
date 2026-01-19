import db from "../config/Database.js";

const qi = db.getQueryInterface();
const tableName = "datanasabah/ocr-ktp";

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

const ensureNullable = async (columns, column, fallbackType) => {
  const meta = columns?.[column];
  if (!meta || meta.allowNull) return false;
  const table = quoteTable(tableName);
  const type = meta?.type ?? fallbackType;
  await db.query(
    `ALTER TABLE ${table} MODIFY COLUMN ${quoteIdentifier(column)} ${type} NULL`
  );
  return true;
};

export default async function migrateOcrKtpNullable() {
  let columns = await getColumns();
  if (!columns) return;

  const addConfidence = await ensureColumn(columns, "confidence", "FLOAT NULL");
  const addRawJson = await ensureColumn(columns, "rawJson", "LONGTEXT NULL");
  if (addConfidence || addRawJson) {
    columns = await getColumns();
  }

  const nullableColumns = {
    namaLengkap: "VARCHAR(100)",
    tempatLahir: "VARCHAR(50)",
    tanggalLahir: "DATE",
    jenisKelamin: "VARCHAR(20)",
    statusPerkawinan: "VARCHAR(100)",
    agama: "VARCHAR(10)",
    kewarganegaraan: "VARCHAR(100)",
    alamatLengkap: "LONGTEXT",
    rt: "VARCHAR(10)",
    rw: "VARCHAR(10)",
    desaKelurahan: "VARCHAR(100)",
    kecamatan: "VARCHAR(100)",
    kabupaten: "VARCHAR(100)",
    provinsi: "VARCHAR(100)",
    jenispekerjaan: "VARCHAR(100)",
  };

  for (const [column, fallbackType] of Object.entries(nullableColumns)) {
    await ensureNullable(columns, column, fallbackType);
  }
}
