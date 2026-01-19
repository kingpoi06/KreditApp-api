import express from "express";
import {
  getUsers,
  getUserByKdpegawai,
  updateAll,
  createUser,
  updateUser,
  editPassword,
  deleteUser,
} from "../controllers/login/Users.js";
import { superadminOnly, getAllOnly } from "../middleware/userOnly.js";

const router = express.Router();

router.get("/users",getAllOnly, getUsers);
router.get("/users/:kdpegawai", getUserByKdpegawai);
router.post("/users", superadminOnly, createUser);
router.patch("/usersUpdateAll/:kdpegawai", superadminOnly,  updateAll);
router.patch("/userUpdateProfile/:kdpegawai",superadminOnly,  updateUser);
router.patch("/usersEditPassword/:kdpegawai", superadminOnly,  editPassword);
router.delete("/users/:kdpegawai", superadminOnly, deleteUser);

export default router;
