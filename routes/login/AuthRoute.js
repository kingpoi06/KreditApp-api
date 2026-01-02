import express from "express";
import { postLogin, deleteLogout } from "../../controllers/login/Auth.js";

const router = express.Router();

router.post("/login", postLogin);
router.delete("/logout", deleteLogout);

export default router;
