import express from "express";
import {
  getDatadiriAll,
  getDataDiriByNIK,
  createDataDiri,
  updateDataDiriNasabah,
  deleteDataDiriNasabah,
} from "../../../controllers/Datanasabah/Datadiri/Datadiri.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-diri", getAllOnly, getDatadiriAll);
router.get("/datanasabah/data-diri/:no_permohonan(.+)", getAllOnly, getDataDiriByNIK);
router.post("/datanasabah/data-diri",getAllOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
    { name: "fotoKTPPasangan", maxCount: 1 },
    { name: "fotoKTPPenanggungJawab", maxCount: 1 },
  ]), createDataDiri);
router.patch("/datanasabah/data-diri/:no_permohonan(.+)", updateOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
    { name: "fotoKTPPasangan", maxCount: 1 },
    { name: "fotoKTPPenanggungJawab", maxCount: 1 },
  ]), updateDataDiriNasabah);
router.delete("/datanasabah/data-diri/:no_permohonan(.+)", superadminOnly,  deleteDataDiriNasabah);

export default router;
