import express from "express";
import {
  getDataJaminan,
  getDataJaminanByUUID,
  createDataJaminan,
  updateDataJaminan,
  deleteDataJaminan,
} from "../../../controllers/Datanasabah/Datajaminan/Datajaminan.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-jaminan", getAllOnly, getDataJaminan);
router.get("/datanasabah/data-jaminan/:uuid", getAllOnly, getDataJaminanByUUID);
router.post("/datanasabah/data-jaminan", officerOnly, upload.fields([
    { name: "dokumentasiAgunan", maxCount: 1 },
  ]), createDataJaminan);
router.patch("/datanasabah/data-jaminan/:uuid", updateOnly,  upload.fields([
    { name: "dokumentasiAgunan", maxCount: 1 },
  ]),updateDataJaminan);
router.delete("/datanasabah/data-jaminan/:uuid", superadminOnly,  deleteDataJaminan);

export default router;
