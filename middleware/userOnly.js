import Users from "../models/UserModel.js";

const checkRole = (roles) => async (req, res, next) => {
  try {
    const user = await Users.findOne({
      where: {
        kdpegawai: req.userKdpegawai,
      },
    });

    if (!user) {
      return res.status(404).json({ msg: `User not found at ${req.userKdpegawai}` });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    req.role = user.role;
    next();
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};
export const superadminOnly = checkRole(["superadmin"]);
export const officerOnly = checkRole(["officer"]);
export const ketuacabangOnly = checkRole(["ketuacabang"]);
export const dirutOnly = checkRole(["dirut"]);
export const getAllOnly = checkRole(["superadmin", "officer", "ketuacabang", "dirut"]);
export const updateOnly = checkRole(["superadmin", "officer"]);
export const getPrivateOnly = checkRole(["superadmin", "ketuacabang", "dirut"]);

