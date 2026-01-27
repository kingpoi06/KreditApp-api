import multer from "multer";
import path from "path";
import fs from "fs";

// Pastikan folder uploads ada
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Filter hanya gambar atau TXT untuk SLIK (tambahan PDF untuk dokumen instansi/agunan)
const fileFilter = (req, file, cb) => {
  const imageTypes = [".jpg", ".jpeg", ".png"];
  const textTypes = [".txt"];
  const documentTypes = [".pdf"];
  const ext = path.extname(file.originalname).toLowerCase();
  const normalizedField = String(file.fieldname || "").toLowerCase();
  const isSlikField = [
    "slik",
    "slikpenanggungjawab",
    "slik_penanggung_jawab",
    "slikpasangan",
    "slik_pasangan",
  ].includes(normalizedField);
  if (isSlikField) {
    if (textTypes.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new Error("Hanya file TXT (.txt) yang diperbolehkan untuk SLIK"), false);
    return;
  }

  if (file.fieldname === "dokumentasiAgunan") {
    if (documentTypes.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(
      new Error("Hanya file PDF (.pdf) yang diperbolehkan untuk dokumen agunan"),
      false
    );
    return;
  }

  if (file.fieldname === "uploadNPWP" || file.fieldname === "uploadSKTerakhir") {
    if (imageTypes.includes(ext) || documentTypes.includes(ext)) {
      cb(null, true);
      return;
    }
    cb(
      new Error(
        "Hanya file gambar (.jpg, .jpeg, .png) atau PDF (.pdf) yang diperbolehkan"
      ),
      false
    );
    return;
  }

  if (imageTypes.includes(ext)) {
    cb(null, true);
    return;
  }
  cb(new Error("Hanya file gambar (.jpg, .jpeg, .png) yang diperbolehkan"), false);
};

const createUpload = (fileSizeLimit) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: fileSizeLimit },
  });

const upload = createUpload(5 * 1024 * 1024);
export const uploadJaminan = createUpload(30 * 1024 * 1024);
export const uploadOCRKTP = createUpload(10 * 1024 * 1024);
export const uploadCamera = createUpload(10 * 1024 * 1024);

export default upload;
