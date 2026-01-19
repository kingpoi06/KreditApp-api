import Users from "../models/UserModel/UserModel.js";
// import Pasiens from "../models/pasien/PasienModel.js";
// import Pegawais from "../models/pegawai/PegawaiModel.js";
import jwt from "jsonwebtoken";

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
    req.role= user.role;
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
    req.role = decoded.role;
    req.sessionId = decoded.sessionId;
    
    next();
  });
};

