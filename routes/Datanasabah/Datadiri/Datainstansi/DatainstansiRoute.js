import express from "express";
import {
  getDataInstansi,
  getDataInstansiByNoPermohonan,
  createDataInstansi,
  updateDataInstansi,
  deleteDataInstansi,
} from "../../../../controllers/Datanasabah/Datadiri/Datainstansi/Datainstansi.js";
import { superadminOnly, getAllOnly, updateOnly } from "../../../../middleware/userOnly.js";
import upload from "../../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-instansi", getAllOnly, getDataInstansi);
router.get("/datanasabah/data-instansi/:no_permohonan(.+)", getAllOnly, getDataInstansiByNoPermohonan);
router.post(
  "/datanasabah/data-instansi",
  getAllOnly,
  upload.fields([
    { name: "uploadSKTerakhir", maxCount: 1 },
    { name: "uploadNPWP", maxCount: 1 },
  ]),
  createDataInstansi
);
router.patch(
  "/datanasabah/data-instansi/:no_permohonan(.+)",
  updateOnly,
  upload.fields([
    { name: "uploadSKTerakhir", maxCount: 1 },
    { name: "uploadNPWP", maxCount: 1 },
  ]),
  updateDataInstansi
);
router.delete("/datanasabah/data-instansi/:no_permohonan(.+)", superadminOnly, deleteDataInstansi);

export default router;
