import Users from "../models/UserModel/UserModel.js";

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

    const normalizedRole = normalizeRole(user.role);
    const allowedRoles = roles.map((role) => normalizeRole(role));
    if (!allowedRoles.includes(normalizedRole)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    req.role = normalizedRole;
    next();
  } catch (error) {
    console.error("Error finding user:", error);
    return res.status(500).json({ msg: "Internal server error" });
  }
};

export const superadminOnly = checkRole(["superadmin"]);
export const superadminOrHeadOfficer = checkRole(["superadmin", "headofficer"]);
export const officerOnly = checkRole(["officer"]);
export const ketuacabangOnly = checkRole(["ketuacabang"]);
export const dirutOnly = checkRole(["dirut"]);
export const getAllOnly = checkRole(["superadmin", "officer", "admin", "komitecabang", "penyelia", "headofficer"]);
export const updateOnly = checkRole(["superadmin", "officer"]);
export const updateOnlyWithAdmin = checkRole(["superadmin", "officer", "admin"]);
export const getPrivateOnly = checkRole(["superadmin", "admmin", "dirut"]);

