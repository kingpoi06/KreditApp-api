import { Sequelize } from "sequelize";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js";
import Users from "../../../models/UserModel/UserModel.js";

export const getDashboardALL = async (req, res) => {
  try {
    if (
      !req.kdkantor &&
      !["superadmin", "dirut", "officer"].includes(req.role)
    ) {
      return res.status(400).json({ msg: "Kode kantor tidak ditemukan" });
    }

    const wherePermohonan = {};
    const whereUser = {};

    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const result = await Permohonan.findAll({
      attributes: [
        "statusPengajuan",
        [Sequelize.fn("COUNT", Sequelize.col("no_permohonan")), "total"]
      ],
      ...(Object.keys(wherePermohonan).length ? { where: wherePermohonan } : {}),
      include: Object.keys(whereUser).length
        ? [{
            model: Users,
            attributes: [],
            where: whereUser,
            required: true,
          }]
        : [],
      group: ["statusPengajuan"],
      raw: true
    });

    // Normalisasi agar frontend rapi
    const summary = {
      kreditPengajuan: 0,
      kreditAktif: 0,
      kreditDitolak: 0,
    };

    result.forEach(item => {
      if (item.statusPengajuan === "Pending") {
        summary.kreditPengajuan = item.total;
      }
      if (item.statusPengajuan === "Approve") {
        summary.kreditAktif = item.total;
      }
      if (item.statusPengajuan === "Reject") {
        summary.kreditDitolak = item.total;
      }
    });

    res.status(200).json({
      msg: "Dashboard summary",
      Data: summary
    });

  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ msg: "Gagal mengambil data dashboard" });
  }
};

export const getDashboardByNoPermohonan = async (req, res) => {
  try {
    if (
      !req.kdkantor &&
      !["superadmin", "dirut", "officer"].includes(req.role)
    ) {
      return res.status(400).json({ msg: "Kode kantor tidak ditemukan" });
    }

    const wherePermohonan = {};
    const whereUser = {};

    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const data = await Permohonan.findAll({
      attributes: [
        "no_permohonan",
        "statusPengajuan",
        [Sequelize.fn("COUNT", Sequelize.col("no_permohonan")), "total"]
      ],
      ...(Object.keys(wherePermohonan).length ? { where: wherePermohonan } : {}),
      include: Object.keys(whereUser).length
        ? [{
            model: Users,
            attributes: [],
            where: whereUser,
            required: true,
          }]
        : [],
      group: ["no_permohonan", "statusPengajuan"],
      raw: true
    });

    res.status(200).json({
      msg: "Dashboard per nasabah",
      Data: data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Gagal" });
  }
};
