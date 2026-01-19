import express from "express";
import {
  getDataJaminan,
  getDataJaminanByUUID,
  createDataJaminan,
  updateDataJaminan,
  deleteDataJaminan,
} from "../../../../controllers/Datanasabah/Datadiri/Datajaminan/Datajaminan.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../../middleware/userOnly.js";
import  upload  from "../../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-jaminan", getAllOnly, getDataJaminan);
router.get("/datanasabah/data-jaminan/:no_permohonan(.+)", getAllOnly, getDataJaminanByUUID);
router.post("/datanasabah/data-jaminan", officerOnly, upload.fields([
    { name: "dokumentasiAgunan", maxCount: 1 },
    { name: "slik", maxCount: 1 },
  ]), createDataJaminan);
router.patch("/datanasabah/data-jaminan/:no_permohonan(.+)", updateOnly,  upload.fields([
    { name: "dokumentasiAgunan", maxCount: 1 },
    { name: "slik", maxCount: 1 },
  ]),updateDataJaminan);
router.delete("/datanasabah/data-jaminan/:no_permohonan(.+)", superadminOnly,  deleteDataJaminan);

export default router;
