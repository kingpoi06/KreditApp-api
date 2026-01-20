import Users from "../../models/UserModel/UserModel.js";
import jwt from "jsonwebtoken";
import argon2 from "argon2";
import crypto from "crypto";

export const postLogin = async (req, res) => {
  console.log("postLogin called");
  try {
    const user = await Users.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ msg: "Akun Pengguna tidak terdaftar" });
    }

    const match = await argon2.verify(user.password, req.body.password);
    if (!match) {
      console.log("Password mismatch");
      return res
        .status(400)
        .json({ msg: "Password Salah. Silahkan Masukan Lagi!" });
    }

    const { kdpegawai, username, namalengkap, jabatan, kdkantor, email, role } =
      user;

    const sessionId = crypto.randomBytes(32).toString("hex");

    const accessToken = jwt.sign(
      {kdpegawai, username, namalengkap, jabatan, kdkantor, email, role, sessionId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "28000s" }
    );

    const refreshToken = jwt.sign(
      {kdpegawai, username, namalengkap, jabatan, kdkantor, email, role, sessionId },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "28000s" }
    );

    // Update jwt_token di database
    await Users.update(
      { jwt_token: refreshToken, sessionId },
      {
        where: { kdpegawai: user.kdpegawai },
      }
    );

    // ✅ Simpan refreshToken dalam Cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "Strict",
      maxAge: 3600000, // 1 jam
    });

    // ✅ Simpan akses token di header Authorization
    res.set("Authorization", `Bearer ${accessToken}`);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error("postLogin error:", error);
    res.status(500).json({ msg: "Terjadi kesalahan pada server" });
  }
};

export const deleteLogout = async (req, res) => {
  try {
   const refreshToken = req.cookies.refreshToken; // ✅ Ambil token dari cookie
   console.log("Attempting logout, received refreshToken:", refreshToken);

   if (!refreshToken) {
     console.log("No refreshToken found, unauthorized logout attempt.");
     return res.sendStatus(401); // Unauthorized
   }

   let decoded;
   try {
     decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, {
       ignoreExpiration: true,
     });
   } catch (verifyError) {
     console.log(
       "Invalid refreshToken for logout:",
       verifyError && verifyError.message ? verifyError.message : verifyError
     );
     return res.sendStatus(403);
   }

   if (!decoded || !decoded.kdpegawai || !decoded.sessionId) {
     console.log("RefreshToken payload missing kdpegawai.");
     return res.sendStatus(403);
   }

   const user = await Users.findOne({
     where: { kdpegawai: decoded.kdpegawai },
   });

   if (!user || !user.jwt_token || !user.sessionId) {
     console.log("User not found for the provided refreshToken.");
     return res.sendStatus(404); // User not found
   }

   if (user.sessionId !== decoded.sessionId) {
     console.log("Session mismatch during logout.");
     return res.sendStatus(403);
   }

   const storedRefreshToken = user.jwt_token;
   if (storedRefreshToken !== refreshToken) {
     console.log("RefreshToken mismatch during logout.");
     return res.sendStatus(403);
   }

   // ✅ Hapus refreshToken dari database
   await Users.update(
     { jwt_token: null, sessionId: null },
     { where: { kdpegawai: user.kdpegawai } }
   );
   console.log(`Successfully removed refreshToken for user with Kode Pegawai: ${user.kdpegawai}`);

   // ✅ Hapus cookie di browser
   res.clearCookie("refreshToken", {
     httpOnly: true,          // Agar cookie tidak bisa diakses oleh JS
     secure: process.env.NODE_ENV === 'production', // Hanya kirim di HTTPS
     sameSite: 'None',        // Jika ingin kirim ke lintas domain
     maxAge: 30 * 24 * 60 * 60 * 1000, // Misalnya 30 hari
   });
   console.log("Cleared refreshToken cookie.");

   // Return success response
   return res.status(200).json({ msg: "Successfully logged out" });
 } catch (error) {
   console.error("Error during logout:", error);
   res.status(500).json({ msg: "Failed to logout" });
 }
};
