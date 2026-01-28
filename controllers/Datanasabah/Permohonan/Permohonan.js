import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../models/Datanasabah/Datadiri/Datausaha/DatausahaModel.js";
import Datajaminan from "../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import DataPermohonan from "../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js"
import Users from "../../../models/UserModel/UserModel.js";
import db from "../../../config/Database.js";

export const getPermohonanALL = async (req, res) => {
  try {
    if (!["officer", "superadmin", "ketuacabang", "komitecabang", "admin", "penyelia", "headofficer"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

    const wherePermohonan = {};
    const whereUser = {};

    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut", "headofficer"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const data = await Permohonan.findAll({
      ...(Object.keys(wherePermohonan).length ? { where: wherePermohonan } : {}),
      include: [
        {
          model: Users,
          attributes: ["kdpegawai", "namalengkap", "kdkantor"],
          ...(Object.keys(whereUser).length ? { where: whereUser } : {}),
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Data nasabah sesuai kantor",
      Data: data.map((item) =>
        item.get({ plain: true })
      ),
    });
  } catch (error) {
    console.error("Error get No-Permohonan ALL:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getPermohonanByNoPermohonan = async (req, res) => {
  try {
    const { no_permohonan } = req.params;

    const wherePermohonan = { no_permohonan };
    const whereUser = {};

    if (req.role === "officer") {
      wherePermohonan.kdpegawai = req.userKdpegawai;
    } else if (!["superadmin", "dirut", "headofficer"].includes(req.role)) {
      whereUser.kdkantor = req.kdkantor;
    }

    const permohonan = await Permohonan.findOne({
      where: wherePermohonan,
      include: [
        {
          model: Users,
          attributes: ["kdpegawai", "namalengkap", "kdkantor"],
          ...(Object.keys(whereUser).length ? { where: whereUser } : {}),
        },
      ],
    });

    if (!permohonan) {
      return res.status(404).json({ msg: "Data tidak ditemukan" });
    }

    if (
      !["officer", "superadmin", "ketuacabang", "komitecabang", "penyelia", "headofficer"].includes(req.role) &&
      permohonan.User.kdkantor !== req.kdkantor
    ) {
      return res.status(403).json({ msg: "Akses lintas kantor ditolak" });
    }

    res.status(200).json({
      message: "Detail data nasabah",
      Data: permohonan.get({ plain: true }),
    });
  } catch (error) {
    console.error("Error getpermohonanByNoPermohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const createPermohonan = async (req, res) => {
  
  try {
    const {
      jenisKredit,
      tglInput,
    } = req.body;

    await Permohonan.create({
      jenisKredit: jenisKredit,
      tglInput: tglInput,
      role: "nasabah",
      kdpegawai: req.userKdpegawai,
    });

    res.status(201).json({
      msg: "Data Permohonan Berhasil Di Simpan",
    });

  } catch (error) {
    console.error("CREATE DATA DIRI ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
};


export const updatePermohonanNasabah = async (req, res) => {
  try {
    const { no_permohonan } = req.params;
    if (!no_permohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datadiri = await Permohonan.findOne({ where: { no_permohonan } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data No PErmohonan tidak ditemukan!" });
    }

    const normalizeStatusPengajuan = (status) => {
      if (status === undefined || status === null) return undefined;
      const normalized = String(status).trim().toUpperCase();
      if (normalized === "DITERIMA" || normalized === "APPROVE") return "Approve";
      if (normalized === "DITOLAK" || normalized === "REJECT") return "Reject";
      if (normalized === "PROSES PENGAJUAN" || normalized === "PENDING") return "Pending";
      return status;
    };

    const normalizeOptionalInt = (value) => {
      if (value === "" || value === null || value === undefined) return null;
      if (typeof value === "number") {
        return Number.isFinite(value) ? Math.trunc(value) : value;
      }
      let raw = String(value ?? "").trim();
      if (!raw) return null;
      raw = raw.replace(/[^\d,.-]/g, "");
      if (!raw) return null;
      if (raw.includes(",") && raw.includes(".")) {
        raw = raw.replace(/\./g, "").replace(",", ".");
      } else if (raw.includes(",")) {
        raw = raw.replace(",", ".");
      } else if (raw.includes(".")) {
        const dotCount = (raw.match(/\./g) || []).length;
        if (dotCount > 1) {
          raw = raw.replace(/\./g, "");
        } else {
          const parts = raw.split(".");
          if (parts.length === 2 && parts[1].length === 3) {
            raw = parts.join("");
          }
        }
      }
      const parsed = Number(raw);
      if (!Number.isFinite(parsed)) return value;
      return Math.trunc(parsed);
    };

    const role = String(req.role || "").toLowerCase();
    const updateFields = {
      jenisKredit: req.body.jenisKredit,
      tglInput: req.body.tglInput,
      statusPengajuan: normalizeStatusPengajuan(req.body.statusPengajuan),
      keteranganPengajuan: req.body.keteranganPengajuan ?? req.body.keterangan,
      statusPermohonan: req.body.statusPermohonan,
      plafonPermohonan: req.body.plafonPermohonan,
      sukuBunga: req.body.sukuBunga ?? req.body.sukuBungaTahun,
      jenisPerhitungan: req.body.jenisPerhitungan ?? req.body.perhitunganBunga,
      caraPengembalianKredit: req.body.caraPengembalianKredit,
    };

    if (role === "penyelia") {
      updateFields.plafonPermohonanPenyelia = normalizeOptionalInt(
        req.body.plafonPermohonanPenyelia ?? req.body.plafonPermohonan
      );
      updateFields.sukuBungaPenyelia = normalizeOptionalInt(
        req.body.sukuBungaPenyelia ?? req.body.sukuBunga ?? req.body.sukuBungaTahun
      );
      updateFields.jenisPerhitunganPenyelia =
        req.body.jenisPerhitunganPenyelia ??
        req.body.jenisPerhitungan ??
        req.body.perhitunganBunga;
      const allowedFields = new Set([
        "keteranganPengajuan",
        "statusPermohonan",
        "plafonPermohonanPenyelia",
        "sukuBungaPenyelia",
        "jenisPerhitunganPenyelia",
      ]);
      Object.keys(updateFields).forEach((key) => {
        if (!allowedFields.has(key)) {
          delete updateFields[key];
        }
      });
    }

    if (
    !["superadmin", "komitecabang", "officer", "penyelia"].includes(role) &&
    datadiri.kdpegawai !== req.kdpegawai
    ) {
    return res.status(403).json({ msg: "Tidak boleh update data kantor lain" });
    }

    Object.keys(updateFields).forEach((key) => {
      if (updateFields[key] === undefined) {
        delete updateFields[key];
      }
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    await Permohonan.update(updateFields, { where: { no_permohonan } });

    res.status(200).json({ msg: "Data nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deletePermohonanNasabah = async (req, res) => {
  const t = await db.transaction(); 
  try {
    const { no_permohonan } = req.params;

    if (!no_permohonan) {
      return res.status(400).json({ msg: "Parameter no permohonan tidak ditemukan!" });
    }

    const datadiri = await Permohonan.findOne({
      where: { no_permohonan },
      include: [
        {
          model: Users,
          attributes: ["kdpegawai", "kdkantor"],
        },
      ],
    });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data no permohonan nasabah tidak ditemukan!" });
    }

    if (
      req.role !== "superadmin" &&
      datadiri.User?.kdkantor &&
      datadiri.User.kdkantor !== req.kdkantor
    ) {
      return res.status(403).json({ msg: "Tidak boleh hapus data kantor lain" });
    }


    await db.query("SET innodb_lock_wait_timeout = 120", { transaction: t });

    await Datausaha.destroy({ where: { no_permohonan }, transaction: t });
    await Datajaminan.destroy({ where: { no_permohonan }, transaction: t });
    await DataPermohonan.destroy({ where: { no_permohonan }, transaction: t });

    await Permohonan.destroy({ where: { no_permohonan }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Nasabah beserta data terkait berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

