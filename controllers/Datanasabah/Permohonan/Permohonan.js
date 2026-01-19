import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../models/Datanasabah/Datadiri/Datausaha/DatausahaModel.js";
import Datajaminan from "../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import DataPermohonan from "../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js"
import Users from "../../../models/UserModel/UserModel.js";
import db from "../../../config/Database.js";
import { decrypt, encrypt } from "../../../middleware/cryptoUtils.js";

const secretKey = process.env.CRYPTO_SECRET_KEY;
const permohonanAttributes = Permohonan.rawAttributes || {};
const NON_ENCRYPTED_FIELDS = new Set([
  "no_permohonan",
  "kdpegawai",
  "statusPengajuan",
  "statusPermohonan",
  "createdAt",
  "updatedAt",
]);
const ENCRYPTION_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;

const NON_ENCRYPTED_TYPE_KEYS = new Set(["INTEGER", "DATE", "DATEONLY"]);
const hasPermohonanAttribute = (field) =>
  Object.prototype.hasOwnProperty.call(permohonanAttributes, field);
const isNonEncryptedType = (field) =>
  NON_ENCRYPTED_TYPE_KEYS.has(permohonanAttributes[field]?.type?.key);
const isEncryptableField = (field) =>
  hasPermohonanAttribute(field) &&
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
  return encrypt(String(value), secretKey);
};

const decryptValue = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== "string" || !ENCRYPTION_PATTERN.test(value)) return value;
  try {
    return decrypt(value, secretKey);
  } catch (error) {
    console.error("Failed to decrypt permohonan field:", error);
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

export const getPermohonanALL = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    if (!["officer", "superadmin", "ketuacabang", "komitecabang"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

    const whereUser = {};

    if (!["superadmin", "dirut"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const data = await Permohonan.findAll({
      include: [
        {
          model: Users,
          attributes: ["kdpegawai", "namalengkap", "kdkantor"],
          where: { kdkantor: req.kdkantor }
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Data nasabah sesuai kantor",
      Data: data.map((item) =>
        decryptPayload(item.get({ plain: true }))
      ),
    });
  } catch (error) {
    console.error("Error get No-Permohonan ALL:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getPermohonanByNoPermohonan = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const { no_permohonan } = req.params;

    const permohonan = await Permohonan.findOne({
      where: { no_permohonan },
      include: [
        {
          model: Users,
          attributes: ["kdpegawai", "namalengkap", "kdkantor"],
          where: { kdkantor: req.kdkantor }
        },
      ],
    });

    if (!permohonan) {
      return res.status(404).json({ msg: "Data tidak ditemukan" });
    }

    if (
      !["officer", "superadmin", "ketuacabang", "komitecabang"].includes(req.role) &&
      permohonan.User.kdkantor !== req.kdkantor
    ) {
      return res.status(403).json({ msg: "Akses lintas kantor ditolak" });
    }

    res.status(200).json({
      message: "Detail data nasabah",
      Data: decryptPayload(permohonan.get({ plain: true })),
    });
  } catch (error) {
    console.error("Error getpermohonanByNoPermohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const createPermohonan = async (req, res) => {
  
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const {
      jenisKredit,
      tglInput,
    } = req.body;

    const created = await Permohonan.create({
      jenisKredit: jenisKredit,
      tglInput: tglInput,
      role: "nasabah",
      kdpegawai: req.userKdpegawai,
    });

    const encryptedUpdates = {};
    const plainCreated = created.get({ plain: true });
    Object.keys(plainCreated).forEach((field) => {
      if (!isEncryptableField(field)) return;
      if (plainCreated[field] === undefined || plainCreated[field] === null) return;
      encryptedUpdates[field] = encryptValue(plainCreated[field]);
    });

    if (Object.keys(encryptedUpdates).length > 0) {
      await created.update(encryptedUpdates);
    }

    res.status(201).json({
      msg: "Data Permohonan Berhasil Di Simpan",
    });

  } catch (error) {
    console.error("CREATE DATA DIRI ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
};


export const updatePermohonanNasabah = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const { no_permohonan } = req.params;
    if (!no_permohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datadiri = await Permohonan.findOne({ where: { no_permohonan } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data No PErmohonan tidak ditemukan!" });
    }

    const normalizeStatusPengajuan = (status) => {
      if (status === undefined || status === null) return undefined;
      const normalized = String(status).trim().toUpperCase();
      if (normalized === "DITERIMA" || normalized === "APPROVE") return "Approve";
      if (normalized === "DITOLAK" || normalized === "REJECT") return "Reject";
      if (normalized === "PROSES PENGAJUAN" || normalized === "PENDING") return "Pending";
      return status;
    };

    const updateFields = {
      jenisKredit: req.body.jenisKredit,
      tglInput: req.body.tglInput,
      statusPengajuan: normalizeStatusPengajuan(req.body.statusPengajuan),
      keteranganPengajuan: req.body.keteranganPengajuan ?? req.body.keterangan,
      statusPermohonan: req.body.statusPermohonan,
      plafonPermohonan: req.body.plafonPermohonan,
      sukuBunga: req.body.sukuBunga ?? req.body.sukuBungaTahun,
      jenisPerhitungan: req.body.jenisPerhitungan ?? req.body.perhitunganBunga,
      namaAsuransi: req.body.namaAsuransi,
      premi: req.body.premi,
      namaNotaris: req.body.namaNotaris,
      biayaAPHT: req.body.biayaAPHT,
      caraPengembalianKredit: req.body.caraPengembalianKredit,
    };

    if (
    !["superadmin", "komitecabang", "officer"].includes(req.role) &&
    datadiri.kdpegawai !== req.kdpegawai
    ) {
    return res.status(403).json({ msg: "Tidak boleh update data kantor lain" });
    }

    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    const encryptedUpdateFields = encryptPayload(updateFields);
    await Permohonan.update(encryptedUpdateFields, { where: { no_permohonan } });

    res.status(200).json({ msg: "Data nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deletePermohonanNasabah = async (req, res) => {
  const t = await db.transaction(); 
  try {
    const { no_permohonan } = req.params;

    if (!no_permohonan) {
      return res.status(400).json({ msg: "Parameter no permohonan tidak ditemukan!" });
    }

    const datadiri = await Permohonan.findOne({ where: { no_permohonan } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data no permohonan nasabah tidak ditemukan!" });
    }

    if ( req.role !== "superadmin" && datadiri.kdpegawai !== req.kdpegawai
    ) {
      return res.status(403).json({ msg: "Tidak boleh hapus data kantor lain" });
    }


    await db.query("SET innodb_lock_wait_timeout = 120", { transaction: t });

    await Datausaha.destroy({ where: { no_permohonan }, transaction: t });
    await Datajaminan.destroy({ where: { no_permohonan }, transaction: t });
    await DataPermohonan.destroy({ where: { no_permohonan }, transaction: t });

    await Permohonan.destroy({ where: { no_permohonan }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Nasabah beserta data terkait berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

