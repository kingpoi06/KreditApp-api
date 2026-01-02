import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datajaminan from "../../../models/Datanasabah/Datajaminan/DatajaminanModel.js";
import db from "../../../config/Database.js";
import { Op } from "sequelize";

export const getDataJaminan = async (req, res) => {
  try {
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role == "ketuacabang" || req.role === "dirut" ) {
      response = await Datajaminan.findAll({
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    } else {
      response = await Datajaminan.findAll({
        where: {
          nik: req.nik,
        },
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    }
    res.status(200).json({
      message: "Data Jaminan Nasabah",
      Data: [response],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataJaminanByUUID = async (req, res) => {
  try {
    const jaminan = await Datajaminan.findOne({
      where: {
        uuid: req.params.uuid,
      },
    });
    if (!jaminan) return res.status(404).json({ msg: "Data Tidak Ditemukan!" });
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role === "ketuacabang" || req.role === "dirut" ) {
      response = await Datajaminan.findOne({
        where: {
          uuid: jaminan.uuid,
        },
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    } else {
      response = await Datajaminan.findOne({
        where: {
          [Op.and]: [{ uuid: jaminan.uuid }, { nik: req.nik }],
        },
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    }
    res.status(200).json({
      message: `Data NASABAH Dengan Kode ID dari ${req.params.uuid}`,
      Data: [response],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataJaminan = async (req, res) => {
  const { 
    jenisjaminan,
    namapemilik,
    hubungandengannasabah,
    noidAgunan,
    deskripsiAgunan,
    nilaiAgunan,
    statusAgunan,
    nik,
  } = req.body;

  try {
    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan ? req.files.dokumentasiAgunan[0].filename : null;
    await Datajaminan.create({
      jenisjaminan: jenisjaminan,
      namapemilik: namapemilik,
      hubungandengannasabah: hubungandengannasabah,
      noidAgunan: noidAgunan,
      deskripsiAgunan: deskripsiAgunan,
      nilaiAgunan: nilaiAgunan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan: statusAgunan,
      nik: nik,
      datadiriNik: nik,
    });
    res.status(201).json({ msg: "Data Jaminan Nasabah Berhasil Ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Jaminan:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataJaminan = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) return res.status(400).json({ msg: "Parameter ID Nasabah tidak ditemukan!" });

    const datajaminan = await Datajaminan.findOne({ where: { uuid } });
    if (!datajaminan) return res.status(404).json({ msg: "Data Jaminan tidak ditemukan!" });

    const {
      jenisjaminan,
      namapemilik,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      nilaiAgunan,
      statusAgunan,
    } = req.body;

    // Ambil file baru dari multer, jika tidak ada pakai file lama
    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan
      ? req.files.dokumentasiAgunan[0].filename
      : datajaminan.dokumentasiAgunan;

    const updateFields = {
      jenisjaminan,
      namapemilik,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      nilaiAgunan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan,
    };

    if (["superadmin", "officer"].includes(req.role)) {
      await Datajaminan.update(updateFields, { where: { uuid } });
    } else {
      if (req.nik !== datajaminan.nik) return res.status(403).json({ msg: "Akses ditolak!" });
      await Datajaminan.update(updateFields, {
        where: { [Op.and]: [{ uuid }, { nik: req.nik }] },
      });
    }

    res.status(200).json({ msg: "Data Jaminan Nasabah Berhasil Diperbaharui!" });
  } catch (error) {
    console.error("Error saat update:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataJaminan = async (req, res) => {
  const t = await db.transaction();
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({ msg: "Parameter UUID jaminan tidak ditemukan!" });
    }

    const datajaminan = await Datajaminan.findOne({ where: { uuid } });
    if (!datajaminan) {
      return res.status(404).json({ msg: "Data Jaminan Nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datajaminan.destroy({ where: { uuid }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Jaminan Nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data jaminan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
