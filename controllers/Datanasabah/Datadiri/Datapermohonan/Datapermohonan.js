import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import DataPermohonan from "../../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import db from "../../../../config/Database.js";
import { decrypt, encrypt } from "../../../../middleware/cryptoUtils.js";

const secretKey = process.env.CRYPTO_SECRET_KEY;
const datapermohonanAttributes = DataPermohonan.rawAttributes || {};
const NON_ENCRYPTED_FIELDS = new Set([
  "idDataPermohonan",
  "no_permohonan",
  "createdAt",
  "updatedAt",
]);
const ENCRYPTION_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;
const NON_ENCRYPTED_TYPE_KEYS = new Set(["INTEGER", "DATE", "DATEONLY"]);

const hasDatapermohonanAttribute = (field) =>
  Object.prototype.hasOwnProperty.call(datapermohonanAttributes, field);
const isNonEncryptedType = (field) =>
  NON_ENCRYPTED_TYPE_KEYS.has(datapermohonanAttributes[field]?.type?.key);
const isEncryptableField = (field) =>
  hasDatapermohonanAttribute(field) &&
  !NON_ENCRYPTED_FIELDS.has(field) &&
  !isNonEncryptedType(field);

const ensureSecretKey = (res) => {
  if (!secretKey) {
    console.error("CRYPTO_SECRET_KEY is not configured");
    res.status(500).json({ msg: "Konfigurasi enkripsi tidak tersedia" });
    return false;
  }
  return true;
};

const encryptValue = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value === "string" && ENCRYPTION_PATTERN.test(value)) return value;
  return encrypt(String(value), secretKey);
};

const decryptValue = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string" || !ENCRYPTION_PATTERN.test(value)) return value;
  try {
    return decrypt(value, secretKey);
  } catch (error) {
    console.error("Failed to decrypt data permohonan field:", error);
    return value;
  }
};

const encryptPayload = (payload) => {
  const result = { ...payload };
  Object.keys(result).forEach((field) => {
    if (!isEncryptableField(field)) return;
    result[field] = encryptValue(result[field]);
  });
  return result;
};

const decryptPayload = (payload) => {
  const result = { ...payload };
  Object.keys(result).forEach((field) => {
    if (!isEncryptableField(field)) return;
    result[field] = decryptValue(result[field]);
  });
  return result;
};

const normalizePayload = (body) => ({
  jenisKredit: body.jenisKredit,
  tujuanPenggunaanKredit: body.tujuanPenggunaanKredit,
  plafonPermohonan: body.plafonPermohonan,
  jangkaWaktuKredit: body.jangkaWaktuKredit,
  sukuBungaTahun: body.sukuBungaTahun,
  sukuBungaBulan: body.sukuBungaBulan,
  perhitunganBunga: body.perhitunganBunga,
  sumberPengembalian: body.sumberPengembalian,
  caraAngsuranKredit: body.caraAngsuranKredit,
  keteranganUmum: body.keteranganUmum,
});

const stripUndefined = (payload) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
};

const resolveNoPermohonan = async (body) => {
  let noPermohonan = body.no_permohonan || body.noPermohonan;
  if (!noPermohonan && body.nik) {
    const rawNik = String(body.nik);
    if (rawNik.includes("/")) {
      noPermohonan = rawNik;
    } else {
      const datadiri = await Datadiri.findOne({
        where: { nik: rawNik },
        attributes: ["no_permohonan"],
      });
      noPermohonan = datadiri?.no_permohonan;
    }
  }
  return noPermohonan;
};

export const getDatapermohonanALL = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const response = await DataPermohonan.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Data Permohonan Nasabah",
      Data: response.map((item) => decryptPayload(item.get({ plain: true }))),
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataPermohonanByUUID = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;
    const permohonan = await DataPermohonan.findOne({
      where: { no_permohonan: noPermohonan },
    });

    if (!permohonan) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    res.status(200).json({
      message: `Data permohonan dengan No Permohonan ${noPermohonan}`,
      Data: decryptPayload(permohonan.get({ plain: true })),
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataPermohonan = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const payload = stripUndefined({
      no_permohonan: noPermohonan,
      ...normalizePayload(req.body),
    });

    await DataPermohonan.create(encryptPayload(payload));
    res.status(201).json({ msg: "Data permohonan nasabah berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Permohonan:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataPermohonan = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;
    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datapermohonan = await DataPermohonan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datapermohonan) {
      return res.status(404).json({ msg: "Data permohonan tidak ditemukan!" });
    }

    const updateFields = stripUndefined(normalizePayload(req.body));
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    const encryptedUpdateFields = encryptPayload(updateFields);
    await DataPermohonan.update(encryptedUpdateFields, { where: { no_permohonan: noPermohonan } });

    res.status(200).json({ msg: "Data permohonan nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data permohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataPermohonan = async (req, res) => {
  const t = await db.transaction();
  try {
    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datapermohonan = await DataPermohonan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datapermohonan) {
      return res.status(404).json({ msg: "Data permohonan tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await DataPermohonan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });
    await t.commit();

    res.status(200).json({ msg: "Data permohonan nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data permohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
