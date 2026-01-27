import ocrKTP from "../../../models/Datanasabah/OCRktp/OcrKTPModel.js";
import db from "../../../config/Database.js";
import { scanKTP } from "../../../utils/ktpOcr.js";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

const KTP_TARGET_WIDTH = 1500;
const KTP_TARGET_HEIGHT = 1000;


const resizeKtpIfNeeded = async (imageBuffer) => {
  const metadata = await sharp(imageBuffer).metadata();
  if (!metadata.width || !metadata.height) return imageBuffer;

  const shouldResize =
    metadata.width > KTP_TARGET_WIDTH || metadata.height > KTP_TARGET_HEIGHT;
  if (!shouldResize) return imageBuffer;

  const resizedBuffer = await sharp(imageBuffer)
    .rotate()
    .resize(KTP_TARGET_WIDTH, KTP_TARGET_HEIGHT, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .toBuffer();

  return resizedBuffer;
};

const normalizeDate = (tgl) => {
  if (!tgl) return null;

  const parts = tgl.split("-");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};

const OCR_LOG_ENABLED = process.env.OCR_LOG === "1";
const OCR_DETAIL_ENABLED = process.env.OCR_DETAILED_OUTPUT !== "0";
const logOcr = (...args) => {
  if (OCR_LOG_ENABLED) {
    console.log("[OCR]", ...args);
  }
};

const OCR_REQUIRED_FIELDS = [
  "nikKTP",
  "namaLengkap",
  "tempatLahir",
  "tanggalLahir",
  "jenisKelamin",
  "alamatLengkap",
  "rt",
  "rw",
  "desaKelurahan",
  "kecamatan",
  "kabupaten",
  "provinsi",
  "agama",
  "statusPerkawinan",
  "jenispekerjaan",
  "kewarganegaraan",
];

const OCR_RESPONSE_FIELDS = [
  "nikKTP",
  "namaLengkap",
  "tempatLahir",
  "tanggalLahir",
  "jenisKelamin",
  "agama",
  "statusPerkawinan",
  "alamatLengkap",
  "rt",
  "rw",
  "desaKelurahan",
  "kecamatan",
  "kabupaten",
  "provinsi",
  "jenispekerjaan",
  "kewarganegaraan",
];

const RELIGION_VALUES = [
  "ISLAM",
  "KRISTEN",
  "KATOLIK",
  "KATHOLIK",
  "HINDU",
  "BUDDHA",
  "BUDHA",
  "KONGHUCU",
  "KHONGHUCU",
];

const MARITAL_STATUS_VALUES = [
  "BELUM KAWIN",
  "CERAI HIDUP",
  "CERAI MATI",
  "KAWIN",
  "DUDA",
  "JANDA",
];

const DATE_REGEX = /\b\d{2}[-/]\d{2}[-/]\d{4}\b/;
const LABEL_WORD_REGEX = /(NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS|KELAMIN|GOL|DARAH|ALAMAT|KELURAHAN|DESA|KECAMATAN|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)/i;
const ADDRESS_BLOCKLIST_REGEX = /(NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS|KELAMIN|GOL|DARAH|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)/i;

const cleanTextValue = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value)
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length ? cleaned : null;
};

const countLetters = (value) =>
  (value.match(/[A-Z]/g) || []).length;

const countDigits = (value) =>
  (value.match(/[0-9]/g) || []).length;

const letterRatio = (value) => {
  const letters = countLetters(value);
  const digits = countDigits(value);
  const total = letters + digits;
  if (!total) return 0;
  return letters / total;
};

const isMostlyLetters = (value, ratio = 0.6, minLetters = 3) => {
  const upper = value.toUpperCase();
  return (
    countLetters(upper) >= minLetters &&
    letterRatio(upper) >= ratio
  );
};

const normalizeEnumValue = (value, candidates) => {
  if (!value) return null;
  const upper = value.toUpperCase();
  const match = candidates.find((item) => upper.includes(item));
  return match || null;
};

const normalizeKewarganegaraan = (value) => {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper.includes("WNI")) return "WNI";
  if (upper.includes("WNA")) return "WNA";
  return null;
};

const normalizeGender = (value) => {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper.includes("LAKI")) return "LAKI-LAKI";
  if (upper.includes("PEREMPUAN")) return "PEREMPUAN";
  return null;
};

const normalizeNik = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (digits.length < 16) return null;
  return digits.slice(0, 16);
};

const normalizeRtRw = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits || digits.length > 3) return null;
  return digits;
};

const normalizeTanggalLahir = (value) => {
  if (!value) return null;
  const cleaned = cleanTextValue(value);
  if (!cleaned) return null;

  let day;
  let month;
  let year;

  const match = cleaned.match(/(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (match) {
    day = Number(match[1]);
    month = Number(match[2]);
    year = Number(match[3]);
  } else {
    const altMatch = cleaned.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (!altMatch) return null;
    year = Number(altMatch[1]);
    month = Number(altMatch[2]);
    day = Number(altMatch[3]);
  }

  const currentYear = new Date().getFullYear();
  if (!day || !month || !year) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 1900 || year > currentYear) return null;
  const probe = new Date(year, month - 1, day);
  if (
    probe.getFullYear() !== year ||
    probe.getMonth() + 1 !== month ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
};

const normalizeAlamat = (value) => {
  const cleaned = cleanTextValue(value);
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  if (ADDRESS_BLOCKLIST_REGEX.test(upper)) return null;
  if (DATE_REGEX.test(upper)) return null;
  if (upper.length < 5) return null;
  if (countLetters(upper) < 3) return null;
  return cleaned;
};

const normalizeNamaWilayah = (value) => {
  const cleaned = cleanTextValue(value);
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  if (LABEL_WORD_REGEX.test(upper)) return null;
  if (DATE_REGEX.test(upper)) return null;
  if (upper.includes("LAKI") || upper.includes("PEREMPUAN")) return null;
  if (MARITAL_STATUS_VALUES.some((val) => upper.includes(val))) return null;
  if (RELIGION_VALUES.some((val) => upper.includes(val))) return null;
  if (!isMostlyLetters(upper, 0.5, 3)) return null;
  return cleaned;
};

const normalizeNama = (value) => {
  const cleaned = cleanTextValue(value);
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  if (LABEL_WORD_REGEX.test(upper)) return null;
  if (DATE_REGEX.test(upper)) return null;
  if (/\d/.test(upper)) return null;
  if (!isMostlyLetters(upper, 0.6, 3)) return null;
  return cleaned;
};

const normalizePekerjaan = (value) => {
  const cleaned = cleanTextValue(value);
  if (!cleaned) return null;
  const upper = cleaned.toUpperCase();
  if (LABEL_WORD_REGEX.test(upper)) return null;
  if (DATE_REGEX.test(upper)) return null;
  if (upper.length < 3) return null;
  if (letterRatio(upper) < 0.4) return null;
  return cleaned;
};

const validateOcrResult = (rawOcr) => {
  if (!rawOcr) {
    return {
      cleaned: rawOcr,
      validation: {
        missingFields: OCR_REQUIRED_FIELDS,
        invalidFields: [],
        isComplete: false,
        isValid: false,
      },
    };
  }

  const cleaned = { ...rawOcr };
  const invalidFields = [];

  const setField = (key, value, original) => {
    cleaned[key] = value ?? null;
    if (cleanTextValue(original) && !value) {
      invalidFields.push(key);
    }
  };

  setField("nikKTP", normalizeNik(rawOcr.nikKTP), rawOcr.nikKTP);
  setField("namaLengkap", normalizeNama(rawOcr.namaLengkap), rawOcr.namaLengkap);
  setField("tempatLahir", normalizeNama(rawOcr.tempatLahir), rawOcr.tempatLahir);
  setField("tanggalLahir", normalizeTanggalLahir(rawOcr.tanggalLahir), rawOcr.tanggalLahir);
  setField("jenisKelamin", normalizeGender(rawOcr.jenisKelamin), rawOcr.jenisKelamin);
  setField("agama", normalizeEnumValue(rawOcr.agama, RELIGION_VALUES), rawOcr.agama);
  setField(
    "statusPerkawinan",
    normalizeEnumValue(rawOcr.statusPerkawinan, MARITAL_STATUS_VALUES),
    rawOcr.statusPerkawinan
  );
  setField("alamatLengkap", normalizeAlamat(rawOcr.alamatLengkap), rawOcr.alamatLengkap);
  setField("rt", normalizeRtRw(rawOcr.rt), rawOcr.rt);
  setField("rw", normalizeRtRw(rawOcr.rw), rawOcr.rw);
  setField("desaKelurahan", normalizeNamaWilayah(rawOcr.desaKelurahan), rawOcr.desaKelurahan);
  setField("kecamatan", normalizeNamaWilayah(rawOcr.kecamatan), rawOcr.kecamatan);
  setField("kabupaten", normalizeNamaWilayah(rawOcr.kabupaten), rawOcr.kabupaten);
  setField("provinsi", normalizeNamaWilayah(rawOcr.provinsi), rawOcr.provinsi);
  setField("jenispekerjaan", normalizePekerjaan(rawOcr.jenispekerjaan), rawOcr.jenispekerjaan);
  setField("kewarganegaraan", normalizeKewarganegaraan(rawOcr.kewarganegaraan), rawOcr.kewarganegaraan);

  const missingFields = OCR_REQUIRED_FIELDS.filter((field) => !cleaned?.[field]);
  const isComplete = missingFields.length === 0;
  const isValid = isComplete && invalidFields.length === 0;

  cleaned._missingFields = missingFields;
  cleaned._isComplete = isComplete;
  cleaned._invalidFields = invalidFields;
  cleaned._isValid = isValid;

  return {
    cleaned,
    validation: {
      missingFields,
      invalidFields,
      isComplete,
      isValid,
    },
  };
};

const pickOcrResponseData = (rawOcr) =>
  OCR_RESPONSE_FIELDS.reduce((acc, key) => {
    acc[key] = rawOcr?.[key] ?? null;
    return acc;
  }, {});

const hasOcrValues = (data) =>
  Object.values(data || {}).some(
    (value) => String(value ?? "").trim() !== ""
  );

const isBlank = (value) =>
  value === null || value === undefined || String(value).trim() === "";

const countFilledFields = (data) =>
  OCR_RESPONSE_FIELDS.reduce(
    (count, key) => count + (isBlank(data?.[key]) ? 0 : 1),
    0
  );

const buildOcrDetail = (rawOcr) => {
  if (!OCR_DETAIL_ENABLED || !rawOcr) return null;
  return {
    rawText: rawOcr._rawText ?? "",
    ocrText: rawOcr._ocrText ?? rawOcr._rawText ?? "",
    confidence: rawOcr._confidence ?? null,
    lines: Array.isArray(rawOcr._ocrLines) ? rawOcr._ocrLines : [],
    error: rawOcr._ocrError ?? null,
  };
};

export const scanAndSaveOCRKTP = async (req, res) => {
  try {
    if (!req.files?.fotoKTP) {
      return res.status(400).json({ msg: "Foto KTP wajib diupload" });
    }

    const fotoKTP = req.files.fotoKTP[0];
    const fotoKTPFile = fotoKTP.filename;
    logOcr("Mulai scan", {
      file: fotoKTPFile,
      size: fotoKTP.size || 0,
    });
    const ktpPath = fotoKTP.path
      ? path.resolve(fotoKTP.path)
      : path.resolve("uploads", fotoKTPFile);

    try {
      await fs.access(ktpPath);
    } catch {
      return res.status(400).json({ msg: "File foto KTP tidak ditemukan" });
    }

    let imageBuffer;
    try {
      imageBuffer = await fs.readFile(ktpPath);
    } catch {
      return res.status(400).json({ msg: "File foto KTP tidak dapat dibaca" });
    }

    const resizedBuffer = await resizeKtpIfNeeded(imageBuffer);
    logOcr("Resize selesai", {
      originalBytes: imageBuffer?.length || 0,
      resizedBytes: resizedBuffer?.length || 0,
    });

    // Scan OCR
    const rawOcr = await scanKTP(resizedBuffer ?? imageBuffer);
    const { cleaned: validatedOcr, validation } = validateOcrResult(rawOcr);
    logOcr("Hasil OCR diterima", {
      hasNik: Boolean(validatedOcr?.nikKTP),
      missingFields: validation?.missingFields?.length ?? 0,
      invalidFields: validation?.invalidFields?.length ?? 0,
      confidence: validatedOcr?._confidence ?? null,
    });
    const detail = buildOcrDetail(validatedOcr);
    if (!rawOcr) {
      return res.status(200).json({
        msg: "OCR selesai (hasil kosong)",
        warning: "Hasil OCR tidak terbaca, silakan ulangi foto KTP.",
        Data: {},
        scanData: {},
        validation,
        ...(detail ? { detail } : {}),
      });
    }

    const responseData = pickOcrResponseData(validatedOcr);
    if (!hasOcrValues(responseData)) {
      return res.status(200).json({
        msg: "OCR selesai (hasil kosong)",
        warning: "Hasil OCR tidak terbaca, silakan ulangi foto KTP.",
        Data: {},
        scanData: responseData,
        validation,
        ...(detail ? { detail } : {}),
      });
    }

    const warningMessages = [];
    const missingFields = Array.isArray(validation?.missingFields)
      ? validation.missingFields
      : [];
    if (missingFields.length > 0) {
      warningMessages.push("Data OCR belum lengkap, mohon lengkapi manual.");
    }
    if (validatedOcr?._ocrError) {
      warningMessages.push("Kualitas foto kurang jelas, mohon verifikasi manual.");
    }

    const lowConfidence =
      validatedOcr?._confidence !== undefined &&
      validatedOcr?._confidence !== null &&
      validatedOcr?._confidence < 30;
    const hasCore = Boolean(
      validatedOcr?.namaLengkap ||
        validatedOcr?.tanggalLahir ||
        validatedOcr?.alamatLengkap ||
        validatedOcr?.tempatLahir
    );
    if (lowConfidence && !hasCore) {
      warningMessages.push("Kualitas scan rendah, mohon verifikasi manual.");
    }
    if (Array.isArray(validation?.invalidFields) && validation.invalidFields.length > 0) {
      warningMessages.push("Beberapa data OCR tidak valid, mohon verifikasi manual.");
    }

    if (!validatedOcr?.nikKTP) {
      warningMessages.push("NIK tidak terdeteksi, data tidak disimpan.");
      return res.status(200).json({
        msg: "OCR selesai (belum tersimpan)",
        warning: warningMessages.join(" "),
        Data: responseData,
        scanData: responseData,
        validation,
        ...(detail ? { detail } : {}),
      });
    }

    const tanggalLahirFix = normalizeDate(validatedOcr.tanggalLahir);

    const t = await db.transaction();
    try {
      const [savedOCR, created] = await ocrKTP.findOrCreate({
        where: { nikKTP: validatedOcr.nikKTP },
        defaults: {
          namaLengkap: validatedOcr.namaLengkap ?? null,
          tempatLahir: validatedOcr.tempatLahir ?? null,
          tanggalLahir: tanggalLahirFix,
          jenisKelamin: validatedOcr.jenisKelamin ?? null,
          agama: validatedOcr.agama ?? null,
          alamatLengkap: validatedOcr.alamatLengkap ?? null,
          rt: validatedOcr.rt ?? null,
          rw: validatedOcr.rw ?? null,
          desaKelurahan: validatedOcr.desaKelurahan ?? null,
          kecamatan: validatedOcr.kecamatan ?? null,
          kabupaten: validatedOcr.kabupaten ?? null,
          provinsi: validatedOcr.provinsi ?? null,
          jenispekerjaan: validatedOcr.jenispekerjaan ?? null,
          kewarganegaraan: validatedOcr.kewarganegaraan ?? null,
          statusPerkawinan: validatedOcr.statusPerkawinan ?? null,
          confidence: validatedOcr._confidence,
          rawJson: JSON.stringify(validatedOcr),
          fotoKTP: fotoKTPFile,
          kdpegawai: req.userKdpegawai,
        },
        transaction: t,
      });

      let finalRecord = savedOCR;
      let didUpdate = false;
      if (!created) {
        const existingPlain = savedOCR.get({ plain: true });
        const existingValidation = validateOcrResult(existingPlain);
        const invalidExistingFields = new Set(
          existingValidation?.validation?.invalidFields || []
        );
        const updatePayload = {};
        for (const key of OCR_RESPONSE_FIELDS) {
          if (key === "nikKTP") continue;
          const shouldReplace =
            isBlank(savedOCR?.[key]) || invalidExistingFields.has(key);
          if (shouldReplace && !isBlank(validatedOcr?.[key])) {
            updatePayload[key] = validatedOcr[key];
          }
        }

        const existingConfidence = savedOCR?.confidence ?? null;
        const newConfidence = validatedOcr?._confidence ?? null;
        if (newConfidence !== null && (existingConfidence === null || newConfidence > existingConfidence)) {
          updatePayload.confidence = newConfidence;
        }

        const existingScore = countFilledFields(savedOCR?.get?.({ plain: true }) ?? savedOCR);
        const newScore = countFilledFields(validatedOcr);
        if (Object.keys(updatePayload).length > 0 || newScore > existingScore) {
          updatePayload.rawJson = JSON.stringify(validatedOcr);
        }

        if (Object.keys(updatePayload).length > 0) {
          await savedOCR.update(updatePayload, { transaction: t });
          finalRecord = savedOCR;
          didUpdate = true;
        }
      }

      await t.commit();

      const responseRecord = created
        ? savedOCR
        : await finalRecord.reload();

      const responsePayload = {
        msg: created
          ? "Scan OCR KTP berhasil & data tersimpan"
          : didUpdate
            ? "NIK sudah ada, data diperbarui"
            : "NIK sudah ada, data tidak dibuat duplikat",
        Data: responseRecord.get({ plain: true }),
        scanData: responseData,
        validation,
      };
      if (detail) {
        responsePayload.detail = detail;
      }
      if (warningMessages.length > 0) {
        responsePayload.warning = warningMessages.join(" ");
      }

      return res.status(created ? 201 : 200).json(responsePayload);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("SCAN OCR ERROR:", error);
    res.status(500).json({ msg: "Gagal scan & simpan OCR KTP" });
  }
};

// Ambil semua data OCR
export const getDataOCRAll = async (req, res) => {
  try {
    if (!["officer", "superadmin", "ketuacabang", "dirut"].includes(req.role)) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk melihat semua data nasabah" });
    }

    const allData = await ocrKTP.findAll();

    res.status(200).json({
      message: "Data semua nasabah",
      Data: allData.map((item) => item.get({ plain: true })),
    });
  } catch (error) {
    console.error("Error saat getDataOCRAll:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

// Ambil data OCR by NIK
export const getDataOCRByNIK = async (req, res) => {
  try {
    const nikKTP = req.params.nikKTP || req.params.nik;
    if (!nikKTP) return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });

    const ocrktp = await ocrKTP.findOne({
      where: { nikKTP },
    });

    if (!ocrktp) return res.status(404).json({ msg: "Data OCR KTP tidak ditemukan!" });

    if (["superadmin", "ketuacabang", "dirut", "officer"].includes(req.role) || req.nikKTP === nikKTP) {
      return res.status(200).json({
        message: `Data OCR KTP dengan NIK ${nikKTP}`,
        Data: ocrktp.get({ plain: true }),
      });
    }

    return res.status(403).json({ msg: "Anda tidak memiliki akses" });

  } catch (error) {
    console.error("Error get OCR by NIK:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
