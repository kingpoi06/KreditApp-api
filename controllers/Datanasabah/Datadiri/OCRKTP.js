import Users from "../../../models/UserModel.js";
import ocrKTP from "../../../models/Datanasabah/Datadiri/OcrKTPModel.js";
import db from "../../../config/Database.js";
import { scanKTP } from "../../../utils/ktpOcr.js";
import path from "path";

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

    const fotoKTPFile = req.files.fotoKTP[0].filename;
    const ktpPath = path.join("uploads", fotoKTPFile);
    const rawOcr = await scanKTP(ktpPath);

    if (!rawOcr || !rawOcr.nikKTP) {
      return res.status(422).json({
        msg: "Hasil OCR tidak valid",
        rawOcr,
      });
    }

    if (rawOcr._confidence < 60) {
      return res.status(422).json({
        msg: "Kualitas scan KTP rendah, silakan ulangi",
        rawOcr,
      });
    }

    const existingOCR = await ocrKTP.findOne({
      where: { nikKTP: rawOcr.nikKTP },
      transaction: t,
    });

    if (existingOCR) {
      return res.status(409).json({
        msg: "Data OCR untuk NIK ini sudah ada",
        Data: existingOCR,
      });
    }

    const tanggalLahirFix = normalizeDate(rawOcr.tanggallahir);

    const savedOCR = await ocrKTP.create({
      nikKTP: rawOcr.nikKTP,
      namalengkap: rawOcr.namalengkap ?? null,
      tempatlahir: rawOcr.tempatlahir ?? null,
      tanggallahir: tanggalLahirFix,
      jeniskelamin: rawOcr.jeniskelamin ?? null,
      agama: rawOcr.agama ?? null,
      alamatlengkap: rawOcr.alamatlengkap ?? null,
      rt: rawOcr.rt ?? null,
      rw: rawOcr.rw ?? null,
      desakelurahan: rawOcr.desakelurahan ?? null,
      kecamatan: rawOcr.kecamatan ?? null,
      kabupaten: rawOcr.kabupaten ?? null,
      provinsi: rawOcr.provinsi ?? null,
      jenispekerjaan: rawOcr.jenispekerjaan ?? null,
      kewarganegaraan: rawOcr.kewarganegaraan ?? null,

      statusperkawinan: rawOcr.statusperkawinan ?? "BELUM_DIISI",

      confidence: rawOcr._confidence,
      rawJson: rawOcr,
      fotoKTP: fotoKTPFile,
      kdpegawai: req.userKdpegawai,
    }, { transaction: t });

    await t.commit();

    res.status(201).json({
      msg: "Scan OCR KTP berhasil & data tersimpan",
      Data: savedOCR,
    });

  } catch (error) {
    await t.rollback();
    console.error("SCAN OCR ERROR:", error);
    res.status(500).json({ msg: "Gagal scan & simpan OCR KTP" });
  }
};



export const getDataOCRAll = async (req, res) => {
  try {
    if (!["officer", "superadmin", "ketuacabang", "dirut"].includes(req.role)) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk melihat semua data nasabah" });
    }

    const allData = await ocrKTP.findAll({
      include: [{
        model: Users,
        attributes: ["kdpegawai", "namalengkap", "kdkantor"]
      }]
    });

    res.status(200).json({
      message: "Data semua nasabah",
      Data: allData,
    });
  } catch (error) {
    console.error("Error saat getDataOCRAll:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getDataOCRByNIK = async (req, res) => {
  try {
    const { nikKTP } = req.params;

    if (!nikKTP) {
      return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });
    }

    const ocrktp = await ocrKTP.findOne({
      where: { nikKTP },
      include: [{
        model: Users,
        attributes: ["kdpegawai", "namalengkap", "kdkantor"],
      }],
    });

    if (!ocrktp) {
      return res.status(404).json({ msg: "Data OCR KTP tidak ditemukan!" });
    }

    if (
      ["superadmin", "ketuacabang", "dirut", "officer"].includes(req.role)
      || req.nikKTP === nikKTP
    ) {
      return res.status(200).json({
        message: `Data OCR KTP dengan NIK ${nikKTP}`,
        Data: ocrktp,
      });
    }

    return res.status(403).json({ msg: "Anda tidak memiliki akses" });

  } catch (error) {
    console.error("Error get OCR by NIK:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
