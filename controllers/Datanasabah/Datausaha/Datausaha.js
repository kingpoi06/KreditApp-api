import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datausaha from "../../../models/Datanasabah/Datausaha/DatausahaModel.js";
import db from "../../../config/Database.js";
import { Op } from "sequelize";

export const getDataUsaha = async (req, res) => {
  try {
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role == "ketuacabang" || req.role === "dirut" ) {
      response = await Datausaha.findAll({
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    } else {
      response = await Datausaha.findAll({
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
      message: "Data Usaha Nasabah",
      Data: [response],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDatausahaByUUID = async (req, res) => {
  try {
    const usaha = await Datausaha.findOne({
      where: {
        uuid: req.params.uuid,
      },
    });
    if (!usaha) return res.status(404).json({ msg: "Data Tidak Ditemukan!" });
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role === "ketuacabang" || req.role === "dirut" ) {
      response = await Datausaha.findOne({
        where: {
          uuid: usaha.uuid,
        },
        include: [
          {
            model: Datadiri,
            attributes: ["nik", "namalengkap"],
          },
        ],
      });
    } else {
      response = await Datausaha.findOne({
        where: {
          [Op.and]: [{ uuid: usaha.uuid }, { nik: req.nik }],
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

export const createDataUsaha = async (req, res) => {
  const { 
    namausaha,
    jenisusaha,
    bidangusaha
    ,bentukusaha,
    statuskepemilikan,
    alamatlengkap,
    rt,
    rw,
    desakelurahan,
    kecamatan,
    kabupatenkota,
    provinsi,
    titikmaps,
    jenisalamatusaha,
    nib,
    siup,
    izinkhusus,
    nik,
  } = req.body;

  try {

    const fotoKTPFile = req.files?.fotoKTP ? req.files.fotoKTP[0].filename : null;
    const selfieKTPFile = req.files?.selfieKTP ? req.files.selfieKTP[0].filename : null;
    const fotoNIBFile = req.files?.fotoNIB ? req.files.fotoNIB[0].filename : null;
    const fotoNPWPFile = req.files?.fotoNPWP ? req.files.fotoNPWP[0].filename : null;
    const fotoSIUPFile = req.files?.fotoSIUP ? req.files.fotoSIUP[0].filename : null;
    const fotodepanFile = req.files?.fotodepan ? req.files.fotodepan[0].filename : null;
    const fotobelakangFile = req.files?.fotobelakang ? req.files.fotobelakang[0].filename : null;
    const fotokananFile = req.files?.fotokanan ? req.files.fotokanan[0].filename : null;
    const fotokiriFile = req.files?.fotokiri ? req.files.fotokiri[0].filename : null;
    const fotodalamFile = req.files?.fotodalam ? req.files.fotodalam[0].filename : null;

    await Datausaha.create({
      namausaha: namausaha,
      jenisusaha: jenisusaha,
      bidangusaha: bidangusaha,
      bentukusaha: bentukusaha,
      statuskepemilikan: statuskepemilikan,
      alamatlengkap: alamatlengkap,
      rt: rt,
      rw: rw,
      desakelurahan: desakelurahan,
      kecamatan: kecamatan,
      kabupatenkota: kabupatenkota,
      provinsi: provinsi,
      titikmaps: titikmaps,
      jenisalamatusaha: jenisalamatusaha,
      nib: nib,
      siup, siup,
      izinkhusus: izinkhusus,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      fotoNIB: fotoNIBFile,
      fotoNPWP: fotoNPWPFile,
      fotoSIUP: fotoSIUPFile,
      fotodepan: fotodepanFile,
      fotobelakang:fotobelakangFile,
      fotokanan: fotokananFile,
      fotokiri: fotokiriFile,
      fotodalam: fotodalamFile,
      nik: nik,
      datadiriNik: nik,
    });
    res.status(201).json({ msg: "Data Usaha Nasabah Berhasil Ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Usaha:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataUsaha = async (req, res) => {
  try {
    const { uuid } = req.params; 
    if (!uuid) return res.status(400).json({ msg: "Parameter ID Nasabah tidak ditemukan!" });

    const datausaha = await Datausaha.findOne({ where: { uuid } });
    if (!datausaha) return res.status(404).json({ msg: "Data Usaha tidak ditemukan!" });

    // Buat object updateFields eksplisit
    const updateFields = {
      namausaha: req.body.namausaha,
      jenisusaha: req.body.jenisusaha,
      bidangusaha: req.body.bidangusaha,
      bentukusaha: req.body.bentukusaha,
      statuskepemilikan: req.body.statuskepemilikan,
      alamatlengkap: req.body.alamatlengkap,
      rt: req.body.rt,
      rw: req.body.rw,
      desakelurahan: req.body.desakelurahan,
      kecamatan: req.body.kecamatan,
      kabupatenkota: req.body.kabupatenkota,
      provinsi: req.body.provinsi,
      titikmaps: req.body.titikmaps,
      jenisalamatusaha: req.body.jenisalamatusaha,
      nib: req.body.nib,
      siup: req.body.siup,
      izinkhusus: req.body.izinkhusus,

      // Field foto, ambil dari upload jika ada, jika tidak pakai data lama
      fotoKTP: req.files?.fotoKTP ? req.files.fotoKTP[0].filename : datausaha.fotoKTP,
      selfieKTP: req.files?.selfieKTP ? req.files.selfieKTP[0].filename : datausaha.selfieKTP,
      fotoNIB: req.files?.fotoNIB ? req.files.fotoNIB[0].filename : datausaha.fotoNIB,
      fotoNPWP: req.files?.fotoNPWP ? req.files.fotoNPWP[0].filename : datausaha.fotoNPWP,
      fotoSIUP: req.files?.fotoSIUP ? req.files.fotoSIUP[0].filename : datausaha.fotoSIUP,
      fotodepan: req.files?.fotodepan ? req.files.fotodepan[0].filename : datausaha.fotodepan,
      fotobelakang: req.files?.fotobelakang ? req.files.fotobelakang[0].filename : datausaha.fotobelakang,
      fotokanan: req.files?.fotokanan ? req.files.fotokanan[0].filename : datausaha.fotokanan,
      fotokiri: req.files?.fotokiri ? req.files.fotokiri[0].filename : datausaha.fotokiri,
      fotodalam: req.files?.fotodalam ? req.files.fotodalam[0].filename : datausaha.fotodalam,
    };

    // Update sesuai role
    if (req.role === "superadmin" || req.role === "officer") {
      await Datausaha.update(updateFields, { where: { uuid } });
    } else {
      if (req.nik !== datausaha.nik)
        return res.status(403).json({ msg: "Akses ditolak!" });

      await Datausaha.update(updateFields, { where: { [Op.and]: [{ uuid }, { nik: req.nik }] } });
    }

    res.status(200).json({ msg: "Data Usaha Nasabah Berhasil Di Perbaharui!" });
  } catch (error) {
    console.error("Error saat update:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deleteDataUsaha = async (req, res) => {
  const t = await db.transaction();
  try {
    const { uuid } = req.params;

    if (!uuid) {
      return res.status(400).json({ msg: "Parameter UUID Usaha tidak ditemukan!" });
    }

    const datausaha = await Datausaha.findOne({ where: { uuid } });
    if (!datausaha) {
      return res.status(404).json({ msg: "Data Usaha Nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datausaha.destroy({ where: { uuid }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Usaha Nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data Usaha:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
