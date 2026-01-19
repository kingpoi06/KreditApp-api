import express from "express";
import {
  getDataUsaha,
  getDatausahaByID,
  createDataUsaha,
  updateDataUsaha,
  deleteDataUsaha,
} from "../../../../controllers/Datanasabah/Datadiri/Datausaha/Datausaha.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../../middleware/userOnly.js";
import  upload  from "../../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-usaha", getAllOnly, getDataUsaha);
router.get("/datanasabah/data-usaha/:no_permohonan(.+)", getAllOnly, getDatausahaByID);
router.post("/datanasabah/data-usaha", getAllOnly, upload.fields([
    { name: "fotoNIB", maxCount: 1 },
    { name: "fotoNPWP", maxCount: 1 },
    { name: "fotoSIUP", maxCount: 1 },
    { name: "fotoSKU", maxCount: 1 },

    { name: "fotodepan", maxCount: 1 },
  ]), createDataUsaha);
router.patch("/datanasabah/data-usaha/:no_permohonan(.+)", officerOnly, upload.fields([
    { name: "fotoSKU", maxCount: 1 },
    { name: "fotoNIB", maxCount: 1 },
    { name: "fotoNPWP", maxCount: 1 },
    { name: "fotoSIUP", maxCount: 1 },
    { name: "fotodepan", maxCount: 1 },
  ]), updateDataUsaha);
router.delete("/datanasabah/data-usaha/:no_permohonan(.+)", superadminOnly,  deleteDataUsaha);

export default router;
