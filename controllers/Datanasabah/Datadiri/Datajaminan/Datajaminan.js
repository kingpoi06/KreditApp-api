import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datajaminan from "../../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import db from "../../../../config/Database.js";
import fs from "fs/promises";
import path from "path";
import { decrypt, encrypt } from "../../../../middleware/cryptoUtils.js";

const secretKey = process.env.CRYPTO_SECRET_KEY;
const datajaminanAttributes = Datajaminan.rawAttributes || {};
const NON_ENCRYPTED_FIELDS = new Set([
  "idDataJaminan",
  "no_permohonan",
  "createdAt",
  "updatedAt",
]);
const ENCRYPTION_PATTERN = /^[0-9a-f]{32}:[0-9a-f]+$/i;
const NON_ENCRYPTED_TYPE_KEYS = new Set(["INTEGER", "DATE", "DATEONLY"]);

const hasDatajaminanAttribute = (field) =>
  Object.prototype.hasOwnProperty.call(datajaminanAttributes, field);
const isNonEncryptedType = (field) =>
  NON_ENCRYPTED_TYPE_KEYS.has(datajaminanAttributes[field]?.type?.key);
const isEncryptableField = (field) =>
  hasDatajaminanAttribute(field) &&
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
    console.error("Failed to decrypt data jaminan field:", error);
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

const looksLikeTxtFileName = (value) =>
  typeof value === "string" && value.trim().toLowerCase().endsWith(".txt");

const extractSlikText = (body, fallback) => {
  const candidates = [body?.slikText, body?.slik_text, body?.slikTxt];
  const direct = candidates.find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  if (direct) return direct;
  if (
    typeof fallback === "string" &&
    fallback.trim() !== "" &&
    !looksLikeTxtFileName(fallback)
  ) {
    return fallback;
  }
  return null;
};

const readSlikFileContent = async (filename) => {
  if (!filename) return null;
  const filePath = path.join(process.cwd(), "uploads", filename);
  return fs.readFile(filePath, "utf8");
};

const normalizeDataJaminan = (record) => {
  const plain = record?.get ? record.get({ plain: true }) : record;
  if (!plain) return plain;

  const normalized = { ...plain };
  Object.entries(plain).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value;
    }
  });

  const nilaiAgunanValue = plain.nilaiAgunan ?? plain.nilaiHargaPasar;
  if (nilaiAgunanValue !== undefined) {
    if (normalized.nilaiAgunan === undefined) {
      normalized.nilaiAgunan = nilaiAgunanValue;
    }
    if (normalized.nilaiagunan === undefined) {
      normalized.nilaiagunan = nilaiAgunanValue;
    }
  }

  const jenisSertifikatValue =
    plain.jenisSertifikat ?? plain.jenisJaminanSertifikat;
  if (jenisSertifikatValue !== undefined) {
    if (normalized.jenisSertifikat === undefined) {
      normalized.jenisSertifikat = jenisSertifikatValue;
    }
    if (normalized.jenisJaminanSertifikat === undefined) {
      normalized.jenisJaminanSertifikat = jenisSertifikatValue;
    }
  }

  const pengikatanJaminanValue =
    plain.pengikatanJaminan ?? plain.statusPengikatanJaminan;
  if (pengikatanJaminanValue !== undefined) {
    if (normalized.pengikatanJaminan === undefined) {
      normalized.pengikatanJaminan = pengikatanJaminanValue;
    }
    if (normalized.statusPengikatanJaminan === undefined) {
      normalized.statusPengikatanJaminan = pengikatanJaminanValue;
    }
  }

  return normalized;
};

const resolveNoPermohonan = async (body) => {
  let noPermohonan = body.no_permohonan || body.noPermohonan;
  const nik = body.nik;

  if (!noPermohonan && nik && String(nik).includes("/")) {
    noPermohonan = nik;
  }

  if (!noPermohonan && nik) {
    const datadiri = await Datadiri.findOne({
      where: { nik },
      attributes: ["no_permohonan"],
    });
    noPermohonan = datadiri?.no_permohonan;
  }

  return noPermohonan;
};

export const getDataJaminan = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role == "ketuacabang" || req.role === "komitecabang" ) {
      response = await Datajaminan.findAll();
    } else {
      response = [];
    }
    res.status(200).json({
      message: "Data Jaminan Nasabah",
      Data: [response.map((item) =>
        normalizeDataJaminan(decryptPayload(item.get({ plain: true })))
      )],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataJaminanByUUID = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;
    const jaminan = await Datajaminan.findOne({
      where: {
        no_permohonan: noPermohonan,
      },
    });
    if (!jaminan) return res.status(404).json({ msg: "Data Tidak Ditemukan!" });
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role === "ketuacabang" || req.role === "komitecabang" ) {
      response = await Datajaminan.findOne({
        where: {
          no_permohonan: jaminan.no_permohonan,
        },
      });
    } else {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }
    res.status(200).json({
      message: `Data NASABAH Dengan No Permohonan ${noPermohonan}`,
      Data: [normalizeDataJaminan(decryptPayload(response.get({ plain: true })))],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataJaminan = async (req, res) => {
  const { 
    jenisjaminan,
    hubungandengannasabah,
    noidAgunan,
    deskripsiAgunan,
    nilaiHargaPasar,
    statusPengikatan,
    statusAgunan,
    hubDgnBPR,
    jenisHub,
    sejakTahun,
    sisaSaldoDana,
    statusHubBankLain,
    totalJaminan,
    jenisJaminanSertifikat,
    jenisSertifikat,
    noSertifikat,
    letak,
    luas,
    taksiranPasar,
    nilaiPPAP,
    nilaiNJOP,
    nilaiNJOPTanah,
    nilaiNJOPBangunan,
    nilaiTaksiranKelurahan,
    nilaiLikuidasiBank,
    jumlahNilaiDigunakan,
    plafonDiajukan,
    pengikatanJaminan,
    namaPemilikBPKB,
    tipeBPKB,
    pengikatan,
    rerataNilaiPasar,
    safetyMargin,
    nilaiLikuidasi,
    noBPKB,
    merek,
    noMesin,
    noSTNK,
    noRangka,
    masaLakuSTNK,
    namaDebitur,
    buktiHakMilik,
    noBilyet,
    tanggalDeposito,
    tipeDeposito,
    nilaiPasarDeposit,
    bungaSimpanan,
    bungaTambahan,
    tipeTabungan,
    lokasiJaminan,
    saldoTabunganDiblokirSebesarPlafon,
    noRekening,
    statusPengikatanJaminan,
    slik: slikTextInput,
  } = req.body;

  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No Permohonan wajib diisi!" });
    }

    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan
      ? req.files.dokumentasiAgunan[0].filename
      : null;
    const fallbackSlikFileName =
      typeof slikTextInput === "string" && looksLikeTxtFileName(slikTextInput)
        ? slikTextInput
        : null;
    const slikFileName =
      req.files?.slik?.[0]?.filename ?? fallbackSlikFileName;
    const bodySlikText = extractSlikText(req.body, slikTextInput);
    let resolvedSlikText = null;
    if (req.files?.slik?.[0]?.filename) {
      resolvedSlikText = await readSlikFileContent(
        req.files.slik[0].filename
      );
    } else if (bodySlikText) {
      resolvedSlikText = bodySlikText;
    }
    const resolvedJenisSertifikat = jenisJaminanSertifikat ?? jenisSertifikat;
    const resolvedPengikatanJaminan =
      statusPengikatanJaminan ?? pengikatanJaminan;
    const payload = {
      jenisjaminan: jenisjaminan,
      hubungandengannasabah: hubungandengannasabah,
      noidAgunan: noidAgunan,
      deskripsiAgunan: deskripsiAgunan,
      totalJaminan: totalJaminan,
      nilaiHargaPasar: nilaiHargaPasar,
      statusPengikatan: statusPengikatan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan: statusAgunan,
      hubDgnBPR: hubDgnBPR,
      jenisHub: jenisHub,
      sejakTahun: sejakTahun,
      sisaSaldoDana: sisaSaldoDana,
      statusHubBankLain: statusHubBankLain,
      slik: slikFileName,
      slikText: resolvedSlikText,
      jenisJaminanSertifikat: resolvedJenisSertifikat,
      jenisSertifikat: resolvedJenisSertifikat,
      noSertifikat: noSertifikat,
      letak: letak,
      luas: luas,
      taksiranPasar: taksiranPasar,
      nilaiPPAP: nilaiPPAP,
      nilaiNJOP: nilaiNJOP,
      nilaiNJOPTanah: nilaiNJOPTanah,
      nilaiNJOPBangunan: nilaiNJOPBangunan,
      nilaiTaksiranKelurahan: nilaiTaksiranKelurahan,
      nilaiLikuidasiBank: nilaiLikuidasiBank,
      jumlahNilaiDigunakan: jumlahNilaiDigunakan,
      plafonDiajukan: plafonDiajukan,
      pengikatanJaminan: resolvedPengikatanJaminan,
      namaPemilikBPKB: namaPemilikBPKB,
      tipeBPKB: tipeBPKB,
      pengikatan: pengikatan,
      rerataNilaiPasar: rerataNilaiPasar,
      safetyMargin: safetyMargin,
      nilaiLikuidasi: nilaiLikuidasi,
      noBPKB: noBPKB,
      merek: merek,
      noMesin: noMesin,
      noSTNK: noSTNK,
      noRangka: noRangka,
      masaLakuSTNK: masaLakuSTNK,
      namaDebitur: namaDebitur,
      buktiHakMilik: buktiHakMilik,
      noBilyet: noBilyet,
      tanggalDeposito: tanggalDeposito,
      tipeDeposito: tipeDeposito,
      nilaiPasarDeposit: nilaiPasarDeposit,
      bungaSimpanan: bungaSimpanan,
      bungaTambahan: bungaTambahan,
      tipeTabungan: tipeTabungan,
      lokasiJaminan: lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon: saldoTabunganDiblokirSebesarPlafon,
      noRekening: noRekening,
      no_permohonan: noPermohonan,
    };

    await Datajaminan.create(encryptPayload(payload));
    res.status(201).json({ msg: "Data Jaminan Nasabah Berhasil Ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Jaminan:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataJaminan = async (req, res) => {
  try {
    if (!ensureSecretKey(res)) {
      return;
    }

    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;
    if (!noPermohonan) return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });

    const datajaminan = await Datajaminan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datajaminan) return res.status(404).json({ msg: "Data Jaminan tidak ditemukan!" });

    const plainDatajaminan = decryptPayload(datajaminan.get({ plain: true }));

    const {
      jenisjaminan,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      nilaiHargaPasar,
      statusPengikatan,
      statusAgunan,
      hubDgnBPR,
      jenisHub,
      sejakTahun,
      sisaSaldoDana,
      statusHubBankLain,
      totalJaminan,
      jenisJaminanSertifikat,
      jenisSertifikat,
      noSertifikat,
      letak,
      luas,
      taksiranPasar,
      nilaiPPAP,
      nilaiNJOP,
      nilaiNJOPTanah,
      nilaiNJOPBangunan,
      nilaiTaksiranKelurahan,
      nilaiLikuidasiBank,
      jumlahNilaiDigunakan,
      plafonDiajukan,
      pengikatanJaminan,
      namaPemilikBPKB,
      tipeBPKB,
      pengikatan,
      rerataNilaiPasar,
      safetyMargin,
      nilaiLikuidasi,
      noBPKB,
      merek,
      noMesin,
      noSTNK,
      noRangka,
      masaLakuSTNK,
      namaDebitur,
      buktiHakMilik,
      noBilyet,
      tanggalDeposito,
      tipeDeposito,
      nilaiPasarDeposit,
      bungaSimpanan,
      bungaTambahan,
      tipeTabungan,
      lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon,
      noRekening,
      statusPengikatanJaminan,
      slik: slikTextInput,
    } = req.body;

    // Ambil file baru dari multer, jika tidak ada pakai file lama
    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan
      ? req.files.dokumentasiAgunan[0].filename
      : plainDatajaminan.dokumentasiAgunan;
    let resolvedSlikFileName = plainDatajaminan.slik;
    if (typeof slikTextInput === "string" && looksLikeTxtFileName(slikTextInput)) {
      resolvedSlikFileName = slikTextInput;
    }
    if (req.files?.slik?.[0]?.filename) {
      resolvedSlikFileName = req.files.slik[0].filename;
    }
    const bodySlikText = extractSlikText(req.body, slikTextInput);
    let resolvedSlikText = plainDatajaminan.slikText;
    if (req.files?.slik?.[0]?.filename) {
      resolvedSlikText = await readSlikFileContent(
        req.files.slik[0].filename
      );
    } else if (bodySlikText) {
      resolvedSlikText = bodySlikText;
    }
    const resolvedJenisSertifikat = jenisJaminanSertifikat ?? jenisSertifikat;
    const resolvedPengikatanJaminan =
      statusPengikatanJaminan ?? pengikatanJaminan;

    const updateFields = {
      jenisjaminan,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      totalJaminan,
      nilaiHargaPasar,
      statusPengikatan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan,
      hubDgnBPR,
      jenisHub,
      sejakTahun,
      sisaSaldoDana,
      statusHubBankLain,
      slik: resolvedSlikFileName,
      slikText: resolvedSlikText,
      jenisJaminanSertifikat: resolvedJenisSertifikat,
      jenisSertifikat: resolvedJenisSertifikat,
      noSertifikat,
      letak,
      luas,
      taksiranPasar,
      nilaiPPAP,
      nilaiNJOP,
      nilaiNJOPTanah,
      nilaiNJOPBangunan,
      nilaiTaksiranKelurahan,
      nilaiLikuidasiBank,
      jumlahNilaiDigunakan,
      plafonDiajukan,
      pengikatanJaminan: resolvedPengikatanJaminan,
      namaPemilikBPKB,
      tipeBPKB,
      pengikatan,
      rerataNilaiPasar,
      safetyMargin,
      nilaiLikuidasi,
      noBPKB,
      merek,
      noMesin,
      noSTNK,
      noRangka,
      masaLakuSTNK,
      namaDebitur,
      buktiHakMilik,
      noBilyet,
      tanggalDeposito,
      tipeDeposito,
      nilaiPasarDeposit,
      bungaSimpanan,
      bungaTambahan,
      tipeTabungan,
      lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon,
      noRekening,
    };

    if (!["superadmin", "officer"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }
    const encryptedUpdateFields = encryptPayload(updateFields);
    await Datajaminan.update(encryptedUpdateFields, { where: { no_permohonan: noPermohonan } });

    res.status(200).json({ msg: "Data Jaminan Nasabah Berhasil Diperbaharui!" });
  } catch (error) {
    console.error("Error saat update:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataJaminan = async (req, res) => {
  const t = await db.transaction();
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan jaminan tidak ditemukan!" });
    }

    const datajaminan = await Datajaminan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datajaminan) {
      return res.status(404).json({ msg: "Data Jaminan Nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datajaminan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Jaminan Nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data jaminan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
