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
router.get("/datanasabah/data-diri/:nik", getAllOnly, getDataDiriByNIK);
router.post("/datanasabah/data-diri",officerOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
  ]), createDataDiri);
router.patch("/datanasabah/data-diri/:nik", updateOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
  ]), updateDataDiriNasabah);
router.delete("/datanasabah/data-diri/:nik", superadminOnly,  deleteDataDiriNasabah);

export default router;
