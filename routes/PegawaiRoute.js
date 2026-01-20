import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  uploadPegawaiXlsx,
  getPegawaiAll,
  updatePegawai,
  deletePegawai,
} from "../controllers/User/Pegawai.js";
import { superadminOnly, getAllOnly } from "../middleware/userOnly.js";

const router = express.Router();

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
    cb(null, `pegawai-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls") {
    cb(null, true);
    return;
  }
  cb(new Error("Hanya file XLSX/XLS yang diperbolehkan"), false);
};

const uploadXlsx = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post(
  "/pegawai/upload-xlsx",
  superadminOnly,
  uploadXlsx.single("file"),
  uploadPegawaiXlsx
);
router.get("/pegawai", getAllOnly, getPegawaiAll);
router.patch("/pegawai/:no", superadminOnly, updatePegawai);
router.delete("/pegawai/:no", superadminOnly, deletePegawai);

export default router;
