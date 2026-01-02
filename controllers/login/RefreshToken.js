import Users from "../../models/UserModel.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.sendStatus(401);
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err) => {
      if (err) {
        return res.sendStatus(403);
      }

      const user = await Users.findOne({
        where: {
          jwt_token: refreshToken,
        },
      });

      const {
        kdpegawai, username, namalengkap, jabatan, kdkantor, email, role
      } = user;

      const newAccessToken = jwt.sign(
        {
          kdpegawai, username, namalengkap, jabatan, kdkantor, email, role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Error in refreshToken handler", error);
    res.sendStatus(500);
  }
};