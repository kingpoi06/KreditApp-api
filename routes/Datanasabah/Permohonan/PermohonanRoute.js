import express from "express";
import {
  getPermohonanALL,
  getPermohonanByNoPermohonan,
  createPermohonan,
  updatePermohonanNasabah,
  deletePermohonanNasabah,
} from "../../../controllers/Datanasabah/Permohonan/Permohonan.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/generate/no-permohonan", getAllOnly, getPermohonanALL);
router.get("/generate/no-permohonan/:no_permohonan(.+)", getAllOnly, getPermohonanByNoPermohonan);
router.post("/generate/no-permohonan",getAllOnly, createPermohonan);
router.patch("/generate/no-permohonan/:no_permohonan(.+)", getAllOnly, updatePermohonanNasabah);
router.delete("/generate/no-permohonan/:no_permohonan(.+)", getAllOnly,  deletePermohonanNasabah);

export default router;
