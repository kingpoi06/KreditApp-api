import express from "express";
import {
  getDatapermohonanALL,
  getDataPermohonanByUUID,
  createDataPermohonan,
  updateDataPermohonan,
  deleteDataPermohonan,
} from "../../../../controllers/Datanasabah/Datadiri/Datapermohonan/Datapermohonan.js";
import { superadminOnly, getAllOnly, updateOnly } from "../../../../middleware/userOnly.js";
import upload from "../../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-permohonan", getAllOnly, getDatapermohonanALL);
router.get("/datanasabah/data-permohonan/:no_permohonan(.+)", getAllOnly, getDataPermohonanByUUID);
router.post("/datanasabah/data-permohonan", getAllOnly, upload.none(), createDataPermohonan);
router.patch("/datanasabah/data-permohonan/:no_permohonan(.+)", updateOnly, upload.none(), updateDataPermohonan);
router.delete("/datanasabah/data-permohonan/:no_permohonan(.+)", superadminOnly, deleteDataPermohonan);

export default router;
