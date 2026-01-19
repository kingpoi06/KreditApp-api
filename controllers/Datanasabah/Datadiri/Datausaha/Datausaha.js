import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../../models/Datanasabah/Datadiri/Datausaha/DatausahaModel.js";
import db from "../../../../config/Database.js";
import { decrypt, encrypt } from "../../../../middleware/cryptoUtils.js";

const secretKey = process.env.CRYPTO_SECRET_KEY;
const datausahaAttributes = Datausaha.rawAttributes || {};
const NON_ENCRYPTED_FIELDS = new Set([
  "idDataUsahaNasabah",
  "no_permohonan",
  "createdAt",
  "updatedAt",
]);
const ENCRYPTION_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;
const NON_ENCRYPTED_TYPE_KEYS = new Set(["INTEGER", "DATE", "DATEONLY"]);

const hasDatausahaAttribute = (field) =>
  Object.prototype.hasOwnProperty.call(datausahaAttributes, field);
const isNonEncryptedType = (field) =>
  NON_ENCRYPTED_TYPE_KEYS.has(datausahaAttributes[field]?.type?.key);
const isEncryptableField = (field) =>
  hasDatausahaAttribute(field) &&
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
    console.error("Failed to decrypt data usaha field:", error);
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

const normalizeDataUsaha = (record) => {
  const plain = record?.get ? record.get({ plain: true }) : record;
  if (!plain) return plain;

  const normalized = { ...plain };
  Object.entries(plain).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value;
    }
  });

  if (!("bentukusaha" in normalized)) {
    normalized.bentukusaha = plain.statusUsaha ?? plain.bentukusaha;
  }
  if (!("alamatlengkap" in normalized)) {
    normalized.alamatlengkap = plain.alamatUsaha ?? plain.alamatlengkap;
  }
  if (!("jenisalamatusaha" in normalized)) {
    normalized.jenisalamatusaha = plain.statusAlamatUsaha ?? plain.jenisalamatusaha;
  }

  return normalized;
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

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getDataUsaha = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    let response;
    if (["superadmin", "officer", "ketuacabang", "komitecabang"].includes(req.role)) {
      response = await Datausaha.findAll();
    } else {
      response = [];
    }
    res.status(200).json({
      message: "Data Usaha Nasabah",
      Data: [response.map((item) =>
        normalizeDataUsaha(decryptPayload(item.get({ plain: true })))
      )],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDatausahaByID = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan =
      req.params.no_permohonan || req.params.idDataUsahaNasabah || req.params.uuid;
    const usaha = await Datausaha.findOne({
      where: {
        no_permohonan: noPermohonan,
      },
    });
    if (!usaha) return res.status(404).json({ msg: "Data Tidak Ditemukan!" });
    let response;
    if (req.role === "superadmin" || req.role === "officer" ||  req.role === "komitecabang" ) {
      response = await Datausaha.findOne({
        where: {
          no_permohonan: usaha.no_permohonan,
        },
      });
    } else {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }
    res.status(200).json({
      message: `Data NASABAH Dengan No Permohonan ${noPermohonan}`,
      Data: [normalizeDataUsaha(decryptPayload(response.get({ plain: true })))],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataUsaha = async (req, res) => {
  const { 
    namaUsaha,
    jenisUsaha,
    bidangUsaha,
    statusUsaha,
    statusKepemilikan,
    npwp,
    plafonPinjaman,

    omsetPerbulan,
    omsetPerhari,
    lamaUsahaSebulan,

    pengeluaranUsaha,
    pengeluaranKeluarga,

    alamatUsaha,
    desaKelurahan,
    kecamatan,
    kabupatenKota,
    provinsi,
    titikmaps,
    statusAlamatUsaha,

    nib,
    tglNIB,
    siup,
    tglSIUP,
    sku,
    tglSKU,
    izinKhusus,
    
  } = req.body;

  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const fotoNIBFile = req.files?.fotoNIB ? req.files.fotoNIB[0].filename : null;
    const fotoNPWPFile = req.files?.fotoNPWP ? req.files.fotoNPWP[0].filename : null;
    const fotoSIUPFile = req.files?.fotoSIUP ? req.files.fotoSIUP[0].filename : null;
    const fotoSKUFile = req.files?.fotoSKU ? req.files.fotoSKU[0].filename : null;
    const fotodepanFile = req.files?.fotodepan ? req.files.fotodepan[0].filename : null;

    const omsetPerhariValue = toNumber(omsetPerhari);
    const lamaUsahaSebulanValue = toNumber(lamaUsahaSebulan);
    const pengeluaranUsahaValue = toNumber(pengeluaranUsaha);
    const pengeluaranKeluargaValue = toNumber(pengeluaranKeluarga);

    const totalPenghasilanPerbulan =
      omsetPerhariValue !== null && lamaUsahaSebulanValue !== null
        ? omsetPerhariValue * lamaUsahaSebulanValue
        : null;
    const hppValue =
      totalPenghasilanPerbulan !== null ? (totalPenghasilanPerbulan * 60) / 100 : null;
    const grossProfitValue =
      totalPenghasilanPerbulan !== null && hppValue !== null
        ? totalPenghasilanPerbulan - hppValue
        : null;
    const netProfitValue =
      grossProfitValue !== null &&
      pengeluaranUsahaValue !== null &&
      pengeluaranKeluargaValue !== null
        ? grossProfitValue - (pengeluaranUsahaValue + pengeluaranKeluargaValue)
        : null;

    const payload = {
      namaUsaha: namaUsaha,
      jenisUsaha: jenisUsaha,
      bidangUsaha: bidangUsaha,
      statusUsaha: statusUsaha,
      statusKepemilikan: statusKepemilikan,
      npwp: npwp,
      plafonPinjaman: plafonPinjaman,

      omsetPerbulan: omsetPerbulan ?? totalPenghasilanPerbulan,
      omsetPerhari: omsetPerhari,
      lamaUsahaSebulan: lamaUsahaSebulan,
      pengeluaranKeluarga: pengeluaranKeluarga,
      pengeluaranUsaha: pengeluaranUsaha,
      totalPenghasilanPerbulan: totalPenghasilanPerbulan,
      HPP: hppValue,
      grossProfit: grossProfitValue,
      netProfit: netProfitValue,

      alamatUsaha: alamatUsaha,
      desaKelurahan: desaKelurahan,
      kecamatan: kecamatan,
      kabupatenKota: kabupatenKota,
      provinsi: provinsi,
      titikmaps: titikmaps,
      statusAlamatUsaha: statusAlamatUsaha,
      nib: nib,
      tglNIB: tglNIB,
      siup: siup,
      tglSIUP: tglSIUP,
      sku: sku,
      tglSKU: tglSKU,
      izinKhusus: izinKhusus,
      fotoNIB: fotoNIBFile,
      fotoNPWP: fotoNPWPFile,
      fotoSIUP: fotoSIUPFile,
      fotoSKU: fotoSKUFile,
      fotodepan: fotodepanFile,
      no_permohonan: noPermohonan,
    };

    await Datausaha.create(encryptPayload(payload));
    res.status(201).json({ msg: "Data Usaha Nasabah Berhasil Ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Usaha:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataUsaha = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan =
      req.params.no_permohonan || req.params.idDataUsahaNasabah || req.params.uuid;
    if (!noPermohonan) return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });

    const datausaha = await Datausaha.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datausaha) return res.status(404).json({ msg: "Data Usaha tidak ditemukan!" });

    const plainDatausaha = decryptPayload(datausaha.get({ plain: true }));

    const updateFields = {
      namaUsaha: req.body.namaUsaha,
      jenisUsaha: req.body.jenisUsaha,
      bidangUsaha: req.body.bidangUsaha,
      statusUsaha: req.body.statusUsaha,
      statusKepemilikan: req.body.statusKepemilikan,
      npwp: req.body.npwp,
      plafonPinjaman: req.body.plafonPinjaman,

      omsetPerbulan: req.body.omsetPerbulan,
      omsetPerhari: req.body.omsetPerhari,
      lamaUsahaSebulan: req.body.lamaUsahaSebulan,

      alamatUsaha: req.body.alamatUsaha ?? req.body.alamatlengkap,
      desaKelurahan: req.body.desaKelurahan ?? req.body.desakelurahan,
      kecamatan: req.body.kecamatan,
      kabupatenKota: req.body.kabupatenKota ?? req.body.kabupatenkota,
      provinsi: req.body.provinsi,
      titikmaps: req.body.titikmaps,
      statusAlamatUsaha: req.body.statusAlamatUsaha ?? req.body.jenisalamatusaha,
      nib: req.body.nib,
      tglNIB: req.body.tglNIB,
      siup: req.body.siup,
      tglSIUP: req.body.tglSIUP,
      sku: req.body.sku,
      tglSKU: req.body.tglSKU,
      izinKhusus: req.body.izinKhusus ?? req.body.izinkhusus,

      // Field foto, ambil dari upload jika ada, jika tidak pakai data lama
      fotoSKU: req.files?.fotoSKU ? req.files.fotoSKU[0].filename : plainDatausaha.fotoSKU,
      fotoNIB: req.files?.fotoNIB ? req.files.fotoNIB[0].filename : plainDatausaha.fotoNIB,
      fotoNPWP: req.files?.fotoNPWP ? req.files.fotoNPWP[0].filename : plainDatausaha.fotoNPWP,
      fotoSIUP: req.files?.fotoSIUP ? req.files.fotoSIUP[0].filename : plainDatausaha.fotoSIUP,
      fotodepan: req.files?.fotodepan ? req.files.fotodepan[0].filename : plainDatausaha.fotodepan,
    };

    // Update sesuai role
    if (!["superadmin", "officer", "komitecabang"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    const encryptedUpdateFields = encryptPayload(updateFields);
    await Datausaha.update(encryptedUpdateFields, { where: { no_permohonan: noPermohonan } });

    res.status(200).json({ msg: "Data Usaha Nasabah Berhasil Di Perbaharui!" });
  } catch (error) {
    console.error("Error saat update:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deleteDataUsaha = async (req, res) => {
  const t = await db.transaction();
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.idDataUsahaNasabah || req.params.uuid;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datausaha = await Datausaha.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datausaha) {
      return res.status(404).json({ msg: "Data Usaha Nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datausaha.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Usaha Nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data Usaha:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
