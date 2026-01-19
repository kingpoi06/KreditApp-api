import express from "express";
import {
  getAnalisisAll,
  getAnalisisByNoPermohonan,
  createAnalisis,
  updateAnalisis,
  deleteAnalisis,
} from "../../../../controllers/Datanasabah/Analisis/Analisis.js";
import { superadminOnly, getAllOnly, updateOnly } from "../../../../middleware/userOnly.js";
import upload from "../../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-analisis", getAllOnly, getAnalisisAll);
router.get(
  "/datanasabah/data-analisis/:no_permohonan(.+)",
  getAllOnly,
  getAnalisisByNoPermohonan
);
router.post("/datanasabah/data-analisis", getAllOnly, upload.none(), createAnalisis);
router.patch(
  "/datanasabah/data-analisis/:no_permohonan(.+)",
  updateOnly,
  upload.none(),
  updateAnalisis
);
router.delete(
  "/datanasabah/data-analisis/:no_permohonan(.+)",
  superadminOnly,
  deleteAnalisis
);

export default router;
