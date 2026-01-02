import express from "express";
import {
  scanAndSaveOCRKTP,
  getDataOCRAll,
  getDataOCRByNIK,
} from "../../../controllers/Datanasabah/Datadiri/OCRKTP.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/ocr-ktp", getAllOnly, getDataOCRAll);
router.get("/datanasabah/ocr-ktp/:nik", getAllOnly, getDataOCRByNIK);
router.post("/datanasabah/ocr-ktp",officerOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
  ]), scanAndSaveOCRKTP);

export default router;
