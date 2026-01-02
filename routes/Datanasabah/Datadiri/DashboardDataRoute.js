import express from "express";
import {
  getDashboardALL,
  getDashboardByNIK,
} from "../../../controllers/Datanasabah/Datadiri/TotalGlobalNasabah.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/dashboard-nasabah", getAllOnly, getDashboardALL);
router.get("/datanasabah/dashboard-nasabah/:nik", getAllOnly, getDashboardByNIK);

export default router;
