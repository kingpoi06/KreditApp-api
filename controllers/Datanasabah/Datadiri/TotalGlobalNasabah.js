import { Sequelize } from "sequelize";
import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";

export const getDashboardALL = async (req, res) => {
  try {
    const result = await Datadiri.findAll({
      attributes: [
        "statusPengajuan",
        [Sequelize.fn("COUNT", Sequelize.col("nik")), "total"]
      ],
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
      if (item.statusPengajuan === "PROSES PENGAJUAN") {
        summary.kreditPengajuan = item.total;
      }
      if (item.statusPengajuan === "SUDAH DIAJUKAN") {
        summary.kreditAktif = item.total;
      }
      if (item.statusPengajuan === "DITOLAK") {
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

export const getDashboardByNIK = async (req, res) => {
  try {
    const data = await Datadiri.findAll({
      attributes: [
        "nik",
        "statusPengajuan",
        [Sequelize.fn("COUNT", Sequelize.col("nik")), "total"]
      ],
      group: ["nik", "statusPengajuan"],
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
