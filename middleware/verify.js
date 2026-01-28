import Users from "../models/UserModel/UserModel.js";
// import Pasiens from "../models/pasien/PasienModel.js";
// import Pegawais from "../models/pegawai/PegawaiModel.js";
import jwt from "jsonwebtoken";

const normalizeRole = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const compact = raw.replace(/[\s_-]+/g, "");
  const aliasMap = {
    admin: "admin",
    administrasi: "admin",
    administrator: "admin",
    superadmin: "superadmin",
    superadministrator: "superadmin",
    superadministasi: "superadmin",
    officer: "officer",
    ao: "officer",
    accountofficer: "officer",
    stafbisnisaccountofficer: "officer",
    staffbisnisaccountofficer: "officer",
    headofficer: "headofficer",
    headoffider: "headofficer",
    ketuacabang: "ketuacabang",
    komitecabang: "komitecabang",
    penyelia: "penyelia",
    dirut: "dirut",
    direkturutama: "dirut",
  };
  return aliasMap[compact] || raw;
};

export const verifyUser = async (req, res, next) => {
  if (!req.userKdpegawai) {
    return res.status(401).json({ msg: "Please login to your account!" });
  }

  try {
    const user = await Users.findOne({
      where: {
        kdpegawai: req.userKdpegawai,
      },
    });

    if (!user) {
      return res
        .status(404)
        .json({ msg: "User not found during verification" });
    }

    if (!req.sessionId || !user.sessionId || user.sessionId !== req.sessionId) {
      return res.status(401).json({ msg: "Session expired, please login again" });
    }

    req.userDbKdpegawai = user.kdpegawai;
    req.role = normalizeRole(user.role);
    next();
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Failed to verify token" });
    }

    req.userKdpegawai = decoded.kdpegawai;
    req.username = decoded.username;
    req.kdkantor = decoded.kdkantor;
    req.role = normalizeRole(decoded.role);
    req.sessionId = decoded.sessionId;
    
    next();
  });
};

