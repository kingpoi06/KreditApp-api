import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../models/Datanasabah/Datadiri/Datausaha/DatausahaModel.js";
import Datajaminan from "../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import DataPermohonan from "../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js";
import Users from "../../../models/UserModel/UserModel.js";
import db from "../../../config/Database.js";
import fs from "fs/promises";
import path from "path";

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

const looksLikeTxtFileName = (value) =>
  typeof value === "string" && value.trim().toLowerCase().endsWith(".txt");

const isTruthy = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return ["1", "true", "yes", "y"].includes(normalized);
};

const hasMeaningfulValue = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.some((item) => hasMeaningfulValue(item));
  if (typeof value === "object") return Object.keys(value).length > 0;
  return false;
};

const getBodyTextValue = (body, keys) => {
  for (const key of keys) {
    const value = body?.[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return "";
};

const readSlikFileContent = async (filename) => {
  if (!filename) return null;
  const filePath = path.join(process.cwd(), "uploads", filename);
  return fs.readFile(filePath, "utf8");
};

const deleteSlikFileIfExists = async (filename) => {
  if (!looksLikeTxtFileName(filename)) return;
  const filePath = path.join(process.cwd(), "uploads", filename);
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }
};

const resolveSlikPayload = async ({
  body,
  files,
  fileField,
  textKeys,
  clearKeys,
  existingFileName,
  existingText,
}) => {
  const clearRequested = clearKeys.some((key) => isTruthy(body?.[key]));
  let resolvedFileName = existingFileName ?? null;
  let resolvedText = existingText ?? null;

  const directText = getBodyTextValue(body, textKeys);
  if (directText) {
    resolvedText = directText;
  }

  const bodyFallback = body?.[fileField];
  if (typeof bodyFallback === "string" && bodyFallback.trim() !== "") {
    if (looksLikeTxtFileName(bodyFallback)) {
      resolvedFileName = bodyFallback.trim();
    } else if (!directText) {
      resolvedText = bodyFallback.trim();
    }
  }

  const fileUpload = files?.[fileField]?.[0]?.filename;
  if (fileUpload) {
    resolvedFileName = fileUpload;
    resolvedText = await readSlikFileContent(fileUpload);
  }

  if (clearRequested) {
    await deleteSlikFileIfExists(existingFileName);
    resolvedFileName = null;
    resolvedText = null;
  }

  return { resolvedFileName, resolvedText, clearRequested };
};

const isAdminSlikOnlyRequest = (req) => {
  const role = String(req.role || "").toLowerCase();
  if (role !== "admin") return false;

  const allowedBodyKeys = new Set([
    "slik",
    "sliktext",
    "slik_text",
    "sliktxt",
    "slikpenanggungjawab",
    "slik_penanggung_jawab",
    "sliktextpenanggungjawab",
    "slik_text_penanggung_jawab",
    "sliktxtpenanggungjawab",
    "clear_slik",
    "clearslik",
    "clear_slik_penanggung_jawab",
    "clearslikpenanggungjawab",
    "no_permohonan",
    "nopermohonan",
    "nik",
  ]);
  const bodyEntries = Object.entries(req.body || {});
  const bodyKeysWithValue = bodyEntries
    .filter(([, value]) => hasMeaningfulValue(value))
    .map(([key]) => key.toLowerCase());
  const hasDisallowedBody = bodyKeysWithValue.some((key) => !allowedBodyKeys.has(key));

  const allowedFileKeys = new Set(["slik", "slikpenanggungjawab"]);
  const fileKeys = Object.keys(req.files || {}).map((key) => key.toLowerCase());
  const hasOtherFiles = fileKeys.some((key) => !allowedFileKeys.has(key));

  const hasBodyInput = bodyEntries.some(
    ([key, value]) =>
      allowedBodyKeys.has(key.toLowerCase()) &&
      hasMeaningfulValue(value)
  );
  const hasFileInput = Boolean(
    req.files?.slik?.length || req.files?.slikPenanggungJawab?.length
  );
  const hasClearInput =
    isTruthy(req.body?.clearSlik ?? req.body?.clear_slik) ||
    isTruthy(
      req.body?.clearSlikPenanggungJawab ?? req.body?.clear_slik_penanggung_jawab
    );

  return (hasBodyInput || hasFileInput || hasClearInput) && !hasDisallowedBody && !hasOtherFiles;
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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
  if (value.includes("/")) {
    return { no_permohonan: value };
  }
  if (isUuid) {
    return { idDataDiriNasabah: value };
  }
  return { nik: value };
};

export const getDatadiriAll = async (req, res) => {
  try {
    if (!["officer", "superadmin", "ketuacabang", "komitecabang", "admin", "penyelia", "headofficer"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

    const wherePermohonan = {};
    const whereUser = {};

    // 🔐 FILTER KANTOR (KECUALI SUPERADMIN & DIRUT)
    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut", "headofficer"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const data = await Datadiri.findAll({
      include: [
        {
          model: Permohonan,
          attributes: ["no_permohonan", "kdpegawai"],
          ...(Object.keys(wherePermohonan).length ? { where: wherePermohonan } : {}),
          required: Object.keys(wherePermohonan).length || Object.keys(whereUser).length,
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
        normalizeDatadiri(item.get({ plain: true }))
      ),
    });
  } catch (error) {
    console.error("Error getDatadiriAll:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getDataDiriByNIK = async (req, res) => {
  try {
    const paramValue = req.params.no_permohonan || req.params.nik;
    const where = resolveDatadiriWhere(paramValue);
    if (!where) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const wherePermohonan = {};
    const whereUser = {};
    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut", "headofficer"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const datadiri = await Datadiri.findOne({
      where,
      include: [
        {
          model: Permohonan,
          attributes: ["no_permohonan", "kdpegawai"],
          ...(Object.keys(wherePermohonan).length ? { where: wherePermohonan } : {}),
          required: Object.keys(wherePermohonan).length || Object.keys(whereUser).length,
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
      !["officer", "superadmin", "ketuacabang", "komitecabang", "penyelia", "headofficer"].includes(req.role) &&
      userInfo?.kdkantor !== req.kdkantor
    ) {
      return res.status(403).json({ msg: "Akses lintas kantor ditolak" });
    }

    res.status(200).json({
      message: "Detail data nasabah",
      Data: normalizeDatadiri(datadiri.get({ plain: true })),
    });
  } catch (error) {
    console.error("Error getDataDiriByNIK:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const createDataDiri = async (req, res) => {
  
  try {
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
    const { resolvedFileName: slikFileName, resolvedText: slikText } =
      await resolveSlikPayload({
        body: req.body,
        files: req.files,
        fileField: "slik",
        textKeys: ["slikText", "slik_text", "slikTxt", "sliktext"],
        clearKeys: [],
        existingFileName: null,
        existingText: null,
      });
    const {
      resolvedFileName: slikPenanggungJawabFileName,
      resolvedText: slikPenanggungJawabText,
    } = await resolveSlikPayload({
      body: req.body,
      files: req.files,
      fileField: "slikPenanggungJawab",
      textKeys: [
        "slikTextPenanggungJawab",
        "slik_text_penanggung_jawab",
        "slikTxtPenanggungJawab",
        "slik_txt_penanggung_jawab",
      ],
      clearKeys: [],
      existingFileName: null,
      existingText: null,
    });

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
      slik: slikFileName,
      slikText: slikText,
      slikPenanggungJawab: slikPenanggungJawabFileName,
      slikTextPenanggungJawab: slikPenanggungJawabText,

      role: "nasabah",
      kdpegawai: req.userKdpegawai,
      no_permohonan: noPermohonan,
    };

    await Datadiri.create(payload);

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
    const paramValue = req.params.no_permohonan || req.params.nik;
    const where = resolveDatadiriWhere(paramValue);
    if (!where) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({ where });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data nasabah tidak ditemukan!" });
    }

    const plainDatadiri = datadiri.get({ plain: true });

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
    const { resolvedFileName: resolvedSlikFileName, resolvedText: resolvedSlikText } =
      await resolveSlikPayload({
        body: req.body,
        files: req.files,
        fileField: "slik",
        textKeys: ["slikText", "slik_text", "slikTxt", "sliktext"],
        clearKeys: ["clearSlik", "clear_slik"],
        existingFileName: plainDatadiri.slik,
        existingText: plainDatadiri.slikText,
      });
    const {
      resolvedFileName: resolvedSlikPenanggungFileName,
      resolvedText: resolvedSlikPenanggungText,
    } = await resolveSlikPayload({
      body: req.body,
      files: req.files,
      fileField: "slikPenanggungJawab",
      textKeys: [
        "slikTextPenanggungJawab",
        "slik_text_penanggung_jawab",
        "slikTxtPenanggungJawab",
        "slik_txt_penanggung_jawab",
      ],
      clearKeys: ["clearSlikPenanggungJawab", "clear_slik_penanggung_jawab"],
      existingFileName: plainDatadiri.slikPenanggungJawab,
      existingText: plainDatadiri.slikTextPenanggungJawab,
    });

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
      slik: resolvedSlikFileName,
      slikText: resolvedSlikText,
      slikPenanggungJawab: resolvedSlikPenanggungFileName,
      slikTextPenanggungJawab: resolvedSlikPenanggungText,

    };

    const adminSlikOnly = isAdminSlikOnlyRequest(req);
    if (req.role === "admin" && !adminSlikOnly) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }
    if (
      !["superadmin", "komitecabang", "officer"].includes(req.role) &&
      !adminSlikOnly &&
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

    await Datadiri.update(updateFields, { where });

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

