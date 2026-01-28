import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  uploadCabangkantorXlsx,
  getCabangkantorAll,
  updateCabangkantor,
} from "../controllers/User/Cabangkantor.js";
import { superadminOnly, superadminOrHeadOfficer } from "../middleware/userOnly.js";

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
    cb(null, `cabangkantor-${uniqueSuffix}${ext}`);
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

router.get("/cabangkantor", superadminOrHeadOfficer, getCabangkantorAll);
router.patch("/cabangkantor/:kode_kantor", superadminOnly, updateCabangkantor);
router.post(
  "/cabangkantor/upload-xlsx",
  superadminOnly,
  uploadXlsx.single("file"),
  uploadCabangkantorXlsx
);

export default router;
