import express from "express";
import {
  getDataUsaha,
  getDatausahaByUUID,
  createDataUsaha,
  updateDataUsaha,
  deleteDataUsaha,
} from "../../../controllers/Datanasabah/Datausaha/Datausaha.js";
import { superadminOnly, officerOnly, getAllOnly, updateOnly  } from "../../../middleware/userOnly.js";
import  upload  from "../../../middleware/multerConfig.js";

const router = express.Router();

router.get("/datanasabah/data-usaha", getAllOnly, getDataUsaha);
router.get("/datanasabah/data-usaha/:uuid", getAllOnly, getDatausahaByUUID);
router.post("/datanasabah/data-usaha", officerOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
    { name: "fotoNIB", maxCount: 1 },
    { name: "fotoNPWP", maxCount: 1 },
    { name: "fotoSIUP", maxCount: 1 },
    { name: "fotodepan", maxCount: 1 },
    { name: "fotobelakang", maxCount: 1 },
    { name: "fotokanan", maxCount: 1 },
    { name: "fotokiri", maxCount: 1 },
    { name: "fotodalam", maxCount: 1 },
  ]), createDataUsaha);
router.patch("/datanasabah/data-usaha/:uuid", superadminOnly, upload.fields([
    { name: "fotoKTP", maxCount: 1 },
    { name: "selfieKTP", maxCount: 1 },
    { name: "fotoNIB", maxCount: 1 },
    { name: "fotoNPWP", maxCount: 1 },
    { name: "fotoSIUP", maxCount: 1 },
    { name: "fotodepan", maxCount: 1 },
    { name: "fotobelakang", maxCount: 1 },
    { name: "fotokanan", maxCount: 1 },
    { name: "fotokiri", maxCount: 1 },
    { name: "fotodalam", maxCount: 1 },
  ]), updateDataUsaha);
router.delete("/datanasabah/data-usaha/:uuid", superadminOnly,  deleteDataUsaha);

export default router;
