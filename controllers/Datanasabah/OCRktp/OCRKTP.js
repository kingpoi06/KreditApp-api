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

export const scanAndSaveOCRKTP = async (req, res) => {
  const t = await db.transaction();
  try {
    if (!req.files?.fotoKTP) {
      return res.status(400).json({ msg: "Foto KTP wajib diupload" });
    }

    const fotoKTP = req.files.fotoKTP[0];
    const fotoKTPFile = fotoKTP.filename;
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

    // Scan OCR
    const rawOcr = await scanKTP(resizedBuffer ?? imageBuffer);

    if (!rawOcr || !rawOcr.nikKTP) {
      return res.status(422).json({ msg: "Hasil OCR tidak valid", rawOcr });
    }

    if (Array.isArray(rawOcr._missingFields) && rawOcr._missingFields.length > 0) {
      return res.status(422).json({
        msg: "Data OCR belum lengkap, silakan ulangi foto KTP",
        missingFields: rawOcr._missingFields,
        rawOcr,
      });
    }

    const lowConfidence = rawOcr._confidence !== undefined
      && rawOcr._confidence !== null
      && rawOcr._confidence < 30;
    const hasCore = Boolean(
      rawOcr.namaLengkap ||
      rawOcr.tanggalLahir ||
      rawOcr.alamatLengkap ||
      rawOcr.tempatLahir
    );
    if (lowConfidence && !hasCore) {
      return res.status(422).json({ msg: "Kualitas scan KTP rendah, silakan ulangi", rawOcr });
    }

    const tanggalLahirFix = normalizeDate(rawOcr.tanggalLahir);

    // Cek apakah NIK sudah ada, jika tidak ada buat baru
    const [savedOCR, created] = await ocrKTP.findOrCreate({
      where: { nikKTP: rawOcr.nikKTP },
      defaults: {
        namaLengkap: rawOcr.namaLengkap ?? null,
        tempatLahir: rawOcr.tempatLahir ?? null,
        tanggalLahir: tanggalLahirFix,
        jenisKelamin: rawOcr.jenisKelamin ?? null,
        agama: rawOcr.agama ?? null,
        alamatLengkap: rawOcr.alamatLengkap ?? null,
        rt: rawOcr.rt ?? null,
        rw: rawOcr.rw ?? null,
        desaKelurahan: rawOcr.desaKelurahan ?? null,
        kecamatan: rawOcr.kecamatan ?? null,
        kabupaten: rawOcr.kabupaten ?? null,
        provinsi: rawOcr.provinsi ?? null,
        jenispekerjaan: rawOcr.jenispekerjaan ?? null,
        kewarganegaraan: rawOcr.kewarganegaraan ?? null,
        statusPerkawinan: rawOcr.statusPerkawinan ?? null,
        confidence: rawOcr._confidence,
        rawJson: JSON.stringify(rawOcr),
        fotoKTP: fotoKTPFile,
        kdpegawai: req.userKdpegawai,
      },
      transaction: t,
    });

    await t.commit();

    const warning = lowConfidence
      ? "Kualitas scan KTP rendah, mohon verifikasi manual"
      : null;

    if (!created) {
      const responsePayload = {
        msg: "NIK sudah ada, data tidak dibuat duplikat",
        Data: savedOCR.get({ plain: true }),
      };
      if (warning) responsePayload.warning = warning;
      return res.status(200).json(responsePayload);
    }

    const responsePayload = {
      msg: "Scan OCR KTP berhasil & data tersimpan",
      Data: savedOCR.get({ plain: true }),
    };
    if (warning) responsePayload.warning = warning;

    res.status(201).json(responsePayload);

  } catch (error) {
    await t.rollback();
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
