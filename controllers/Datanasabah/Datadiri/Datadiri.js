import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../models/Datanasabah/Datadiri/Datausaha/DatausahaModel.js";
import Datajaminan from "../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import DataPermohonan from "../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js";
import Users from "../../../models/UserModel/UserModel.js";
import db from "../../../config/Database.js";
import { decrypt, encrypt } from "../../../middleware/cryptoUtils.js";

const secretKey = process.env.CRYPTO_SECRET_KEY;
const datadiriAttributes = Datadiri.rawAttributes || {};
const NON_ENCRYPTED_FIELDS = new Set([
  "nik",
  "no_permohonan",
  "kdpegawai",
  "createdAt",
  "updatedAt",
]);
const ENCRYPTION_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;
const NON_ENCRYPTED_TYPE_KEYS = new Set(["INTEGER", "DATE", "DATEONLY"]);

const hasDatadiriAttribute = (field) =>
  Object.prototype.hasOwnProperty.call(datadiriAttributes, field);
const isNonEncryptedType = (field) =>
  NON_ENCRYPTED_TYPE_KEYS.has(datadiriAttributes[field]?.type?.key);
const isEncryptableField = (field) =>
  hasDatadiriAttribute(field) &&
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
    console.error("Failed to decrypt data diri field:", error);
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

const normalizeDatadiri = (record) => {
  const plain = record?.get ? record.get({ plain: true }) : record;
  if (!plain) return plain;

  const normalized = { ...plain };
  Object.entries(plain).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value;
    }
  });

  if (!("nohp" in normalized)) {
    normalized.nohp = plain.kontakPribadi ?? plain.nohp;
  }

  const nikPenanggungJawabValue = plain.nikPenanggungJawab ?? plain.nikPasangan;
  if (nikPenanggungJawabValue !== undefined) {
    normalized.nikPenanggungJawab = nikPenanggungJawabValue;
    normalized.nikPasangan = nikPenanggungJawabValue;
  }

  const namaPenanggungJawabValue = plain.namaPenanggungJawab ?? plain.namaPasangan;
  if (namaPenanggungJawabValue !== undefined) {
    normalized.namaPenanggungJawab = namaPenanggungJawabValue;
    normalized.namaPasangan = namaPenanggungJawabValue;
  }

  const pekerjaanPenanggungJawabValue =
    plain.pekerjaanPenanggungJawab ?? plain.pekerjaanPasangan;
  if (pekerjaanPenanggungJawabValue !== undefined) {
    normalized.pekerjaanPenanggungJawab = pekerjaanPenanggungJawabValue;
    normalized.pekerjaanPasangan = pekerjaanPenanggungJawabValue;
  }

  const noHPPenanggungJawabValue =
    plain.noHPPenanggungJawab ?? plain.kontakPasangan;
  if (noHPPenanggungJawabValue !== undefined) {
    normalized.noHPPenanggungJawab = noHPPenanggungJawabValue;
    normalized.kontakPasangan = noHPPenanggungJawabValue;
  }

  const fotoKTPPenanggungJawabValue =
    plain.fotoKTPPenanggungJawab ?? plain.fotoKTPPasangan;
  if (fotoKTPPenanggungJawabValue !== undefined) {
    normalized.fotoKTPPenanggungJawab = fotoKTPPenanggungJawabValue;
    normalized.fotoKTPPasangan = fotoKTPPenanggungJawabValue;
  }

  return normalized;
};

const resolveNoPermohonan = async (body, userKdpegawai) => {
  let noPermohonan = body.no_permohonan || body.noPermohonan;
  if (!noPermohonan && userKdpegawai) {
    const latest = await Permohonan.findOne({
      where: { kdpegawai: userKdpegawai },
      attributes: ["no_permohonan"],
      order: [["createdAt", "DESC"]],
    });
    noPermohonan = latest?.no_permohonan;
  }
  return noPermohonan;
};

const resolveDatadiriWhere = (paramValue) => {
  if (!paramValue) return null;
  const value = String(paramValue);
  if (value.includes("/")) {
    return { no_permohonan: value };
  }
  return { nik: value };
};

export const getDatadiriAll = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    if (!["officer", "superadmin", "ketuacabang", "komitecabang"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

    const whereUser = {};

    // 🔐 FILTER KANTOR (KECUALI SUPERADMIN & DIRUT)
    if (!["superadmin", "dirut"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const data = await Datadiri.findAll({
      include: [
        {
          model: Permohonan,
          attributes: ["no_permohonan", "kdpegawai"],
          include: [
            {
              model: Users,
              attributes: ["kdpegawai", "namalengkap", "kdkantor"],
              ...(Object.keys(whereUser).length ? { where: whereUser } : {}),
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Data nasabah sesuai kantor",
      Data: data.map((item) =>
        normalizeDatadiri(decryptPayload(item.get({ plain: true })))
      ),
    });
  } catch (error) {
    console.error("Error getDatadiriAll:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getDataDiriByNIK = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const paramValue = req.params.no_permohonan || req.params.nik;
    const where = resolveDatadiriWhere(paramValue);
    if (!where) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const whereUser = {};
    if (!["superadmin", "dirut"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const datadiri = await Datadiri.findOne({
      where,
      include: [
        {
          model: Permohonan,
          attributes: ["no_permohonan", "kdpegawai"],
          include: [
            {
              model: Users,
              attributes: ["kdpegawai", "namalengkap", "kdkantor"],
              ...(Object.keys(whereUser).length ? { where: whereUser } : {}),
            },
          ],
        },
      ],
    });

    if (!datadiri) {
      return res.status(404).json({ msg: "Data tidak ditemukan" });
    }

    const userInfo = datadiri.Permohonan?.User;
    if (
      !["officer", "superadmin", "ketuacabang", "komitecabang"].includes(req.role) &&
      userInfo?.kdkantor !== req.kdkantor
    ) {
      return res.status(403).json({ msg: "Akses lintas kantor ditolak" });
    }

    res.status(200).json({
      message: "Detail data nasabah",
      Data: normalizeDatadiri(decryptPayload(datadiri.get({ plain: true }))),
    });
  } catch (error) {
    console.error("Error getDataDiriByNIK:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const createDataDiri = async (req, res) => {
  
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const {
      nik,
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      statusPerkawinan,
      agama,
      kewarganegaraan,
      kontakPribadi,
      anakTanggungan,
      alamatLengkap,
      rt,
      rw,
      desaKelurahan,
      kecamatan,
      kabupaten,
      provinsi,
      titikmaps,
      jenispekerjaan,
      namaIbuKandung,

      // DATA PENANGGUNG JAWAB
      nikPenanggungJawab,
      namaPenanggungJawab,
      pekerjaanPenanggungJawab,
      tempatLahirPenanggungJawab,
      tanggalLahirPenanggungJawab,
      noHPPenanggungJawab,
      hubunganDenganPemohon,

      // LEGACY (PASANGAN)
      nikPasangan,
      namaPasangan,
      kontakPasangan,
      pekerjaanPasangan,
    } = req.body;

    const fotoKTPFile = req.files?.fotoKTP?.[0]?.filename;
    const selfieKTPFile = req.files?.selfieKTP?.[0]?.filename;
    const fotoKTPPenanggungJawabFile =
      req.files?.fotoKTPPenanggungJawab?.[0]?.filename ??
      req.files?.fotoKTPPasangan?.[0]?.filename;

    if (!fotoKTPFile || !selfieKTPFile || !fotoKTPPenanggungJawabFile) {
      return res.status(400).json({
        msg: "Foto KTP, Selfie KTP, dan KTP Penanggung Jawab wajib diupload",
      });
    }

    const noPermohonan = await resolveNoPermohonan(req.body, req.userKdpegawai);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const payload = {
      nik: nik,
      namaLengkap: namaLengkap,
      tempatLahir: tempatLahir,
      tanggalLahir: tanggalLahir,
      jenisKelamin: jenisKelamin,
      statusPerkawinan: statusPerkawinan,
      agama: agama,
      kewarganegaraan: kewarganegaraan,
      kontakPribadi: kontakPribadi,
      anakTanggungan: anakTanggungan,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      alamatLengkap:alamatLengkap,
      rt: rt,
      rw: rw,
      desaKelurahan: desaKelurahan,
      kecamatan: kecamatan,
      kabupaten: kabupaten,
      provinsi: provinsi,
      titikmaps: titikmaps,
      jenispekerjaan: jenispekerjaan,
      namaIbuKandung: namaIbuKandung,

      // DATA PENANGGUNG JAWAB
      nikPenanggungJawab: nikPenanggungJawab ?? nikPasangan,
      namaPenanggungJawab: namaPenanggungJawab ?? namaPasangan,
      pekerjaanPenanggungJawab: pekerjaanPenanggungJawab ?? pekerjaanPasangan,
      tempatLahirPenanggungJawab: tempatLahirPenanggungJawab,
      tanggalLahirPenanggungJawab: tanggalLahirPenanggungJawab,
      noHPPenanggungJawab: noHPPenanggungJawab ?? kontakPasangan,
      hubunganDenganPemohon: hubunganDenganPemohon,
      fotoKTPPenanggungJawab: fotoKTPPenanggungJawabFile,

      role: "nasabah",
      kdpegawai: req.userKdpegawai,
      no_permohonan: noPermohonan,
    };

    await Datadiri.create(encryptPayload(payload));

    res.status(201).json({
      msg: "Data diri nasabah berhasil disimpan",
      no_permohonan: noPermohonan,
    });

  } catch (error) {
    console.error("CREATE DATA DIRI ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
};


export const updateDataDiriNasabah = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const paramValue = req.params.no_permohonan || req.params.nik;
    const where = resolveDatadiriWhere(paramValue);
    if (!where) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({ where });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data nasabah tidak ditemukan!" });
    }

    const plainDatadiri = decryptPayload(datadiri.get({ plain: true }));

    const fotoKTPFile = req.files?.fotoKTP
      ? req.files.fotoKTP[0].filename
      : plainDatadiri.fotoKTP;
    const fotoKTPPenanggungJawabFile =
      req.files?.fotoKTPPenanggungJawab?.[0]?.filename ??
      req.files?.fotoKTPPasangan?.[0]?.filename ??
      plainDatadiri.fotoKTPPenanggungJawab ??
      plainDatadiri.fotoKTPPasangan;
    const selfieKTPFile = req.files?.selfieKTP
      ? req.files.selfieKTP[0].filename
      : plainDatadiri.selfieKTP;

    const updateFields = {
      namaLengkap: req.body.namaLengkap,
      tempatLahir: req.body.tempatLahir,
      tanggalLahir: req.body.tanggalLahir ?? req.body.tanggallahir,
      jenisKelamin: req.body.jenisKelamin ?? req.body.jeniskelamin,
      statusPerkawinan: req.body.statusPerkawinan ?? req.body.statusperkawinan,
      agama: req.body.agama,
      kewarganegaraan: req.body.kewarganegaraan,
      kontakPribadi: req.body.kontakPribadi ?? req.body.nohp,
      anakTanggungan: req.body.anakTanggungan,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      alamatLengkap: req.body.alamatLengkap ?? req.body.alamatlengkap,
      rt: req.body.rt,
      rw: req.body.rw,
      desaKelurahan: req.body.desaKelurahan ?? req.body.desakelurahan,
      kecamatan: req.body.kecamatan,
      kabupaten: req.body.kabupaten,
      provinsi: req.body.provinsi,
      titikmaps: req.body.titikmaps ?? req.body.titikMaps,
      jenispekerjaan: req.body.jenispekerjaan ?? req.body.jenisPekerjaan,
      namaIbuKandung: req.body.namaIbuKandung,

      nikPenanggungJawab: req.body.nikPenanggungJawab ?? req.body.nikPasangan,
      namaPenanggungJawab: req.body.namaPenanggungJawab ?? req.body.namaPasangan,
      pekerjaanPenanggungJawab: req.body.pekerjaanPenanggungJawab ?? req.body.pekerjaanPasangan,
      tempatLahirPenanggungJawab: req.body.tempatLahirPenanggungJawab,
      tanggalLahirPenanggungJawab: req.body.tanggalLahirPenanggungJawab,
      noHPPenanggungJawab: req.body.noHPPenanggungJawab ?? req.body.kontakPasangan,
      hubunganDenganPemohon: req.body.hubunganDenganPemohon,
      fotoKTPPenanggungJawab: fotoKTPPenanggungJawabFile,

    };

    // Hanya officer atau superadmin yang bisa update
if (
  !["superadmin", "komitecabang", "officer"].includes(req.role) &&
  datadiri.kdpegawai !== req.userKdpegawai
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
    await Datadiri.update(encryptedUpdateFields, { where });

    res.status(200).json({ msg: "Data nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deleteDataDiriNasabah = async (req, res) => {
  const t = await db.transaction();
  try {
    const paramValue = req.params.no_permohonan || req.params.nik;
    const where = resolveDatadiriWhere(paramValue);

    if (!where) {
      await t.rollback(); // penting biar transaksi tidak menggantung
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({ where, transaction: t });
    if (!datadiri) {
      await t.rollback();
      return res.status(404).json({ msg: "Data NIK nasabah tidak ditemukan!" });
    }

    if (req.role !== "superadmin" && datadiri.kdpegawai !== req.userKdpegawai) {
      await t.rollback();
      return res.status(403).json({ msg: "Tidak boleh hapus data kantor lain" });
    }

    const noPermohonan = datadiri.no_permohonan;

    await db.query("SET innodb_lock_wait_timeout = 120", { transaction: t });

    // Hapus tabel terkait
    await Datausaha.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });
    await Datajaminan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });
    await DataPermohonan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });

    // ✅ FIX error disini (transaction harus di dalam object)
    await Datadiri.destroy({ where, transaction: t });

    await t.commit();
    return res.status(200).json({ msg: "Data Nasabah beserta data terkait berhasil dihapus!" });

  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data nasabah:", error);
    return res.status(500).json({ msg: "Terjadi kesalahan server", error: error.message });
  }
};
