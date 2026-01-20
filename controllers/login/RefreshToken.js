import Users from "../../models/UserModel/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.sendStatus(401);
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (verifyError) {
      return res.sendStatus(403);
    }

    if (!decoded || !decoded.kdpegawai || !decoded.sessionId) {
      return res.sendStatus(403);
    }

    const user = await Users.findOne({
      where: {
        kdpegawai: decoded.kdpegawai,
      },
    });

    if (!user || !user.jwt_token || !user.sessionId) {
      return res.sendStatus(404);
    }

    if (user.sessionId !== decoded.sessionId) {
      return res.sendStatus(403);
    }

    const storedRefreshToken = user.jwt_token;
    if (storedRefreshToken !== refreshToken) {
      return res.sendStatus(403);
    }

    const {
      kdpegawai, username, namalengkap, jabatan, kdkantor, email, role
    } = user;

    const newAccessToken = jwt.sign(
      {
        kdpegawai, username, namalengkap, jabatan, kdkantor, email, role, sessionId: user.sessionId
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error("Error in refreshToken handler", error);
    res.sendStatus(500);
  }
};
