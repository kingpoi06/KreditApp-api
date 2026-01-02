import Users from "../../../models/UserModel.js";
import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js"
import Datausaha from "../../../models/Datanasabah/Datajaminan/DatajaminanModel.js";
import Datajaminan from "../../../models/Datanasabah/Datajaminan/DatajaminanModel.js";
import db from "../../../config/Database.js";
import { scanKTP } from "../../../utils/ktpOcr.js";
import path from "path";

export const scanKTPOnly = async (req, res) => {
  try {
    if (!req.files?.fotoKTP) {
      return res.status(400).json({ msg: "Foto KTP wajib diupload" });
    }

    const fotoKTPFile = req.files.fotoKTP[0].filename;
    const ktpPath = path.join("uploads", fotoKTPFile);
    const raw = await scanKTP(ktpPath);

    if (raw._confidence < 60) {
      return res.status(422).json({
        msg: "Kualitas scan KTP rendah, silakan ulangi",
        rawOcr: raw,
      });
    }

    res.status(200).json({
      msg: "Scan KTP berhasil",
      rawOcr: raw,
    });
  } catch (error) {
    console.error("Error saat scan KTP:", error);
    res.status(500).json({ msg: "Gagal scan KTP" });
  }
};

export const getDatadiriAll = async (req, res) => {
  try {
    if (!["officer", "superadmin", "ketuacabang", "dirut"].includes(req.role)) {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk melihat semua data nasabah" });
    }

    const allData = await Datadiri.findAll({
      include: [{
        model: Users,
        attributes: ["kdpegawai", "namalengkap", "kdkantor"]
      }]
    });

    res.status(200).json({
      message: "Data semua nasabah",
      Data: allData,
    });
  } catch (error) {
    console.error("Error saat getDatadiriAll:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const getDataDiriByNIK = async (req, res) => {
  try {
    const { nik } = req.params;

    if (!nik) {
      return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({
      where: { nik },
      include: [{
        model: Users,
        attributes: ["kdpegawai", "namalengkap", "kdkantor"],
      }],
    });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data nasabah tidak ditemukan!" });
    }
    if (["superadmin", "ketuacabang", "dirut", "officer"].includes(req.role) || req.nik === nik) {
      res.status(200).json({
        message: `Data nasabah dengan NIK ${nik}`,
        Data: datadiri,
      });
    } else {
      return res.status(403).json({ msg: "Anda tidak memiliki akses untuk melihat data ini" });
    }
  } catch (error) {
    console.error("Error saat getDataDiriByNIK:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const createDataDiri = async (req, res) => {
  try {
    const { rawOcr } = req.body; 
    if (!rawOcr || !rawOcr.nik) {
      return res.status(400).json({ msg: "Data scan KTP tidak valid" });
    }

    const normalizedKtpData = {
      nik: rawOcr.nik,
      namalengkap: rawOcr.namalengkap,
      tempatlahir: rawOcr.tempatlahir,
      tanggallahir: rawOcr.tanggallahir,
      jeniskelamin: rawOcr.jeniskelamin,
      agama: rawOcr.agama,
      alamatlengkap: rawOcr.alamatlengkap,
      rt: rawOcr.rt,
      rw: rawOcr.rw,
      desakelurahan: rawOcr.desakelurahan,
      kecamatan: rawOcr.kecamatan,
      kabupaten: rawOcr.kabupaten,
      provinsi: rawOcr.provinsi,
      jenispekerjaan: rawOcr.jenispekerjaan,
      kewarganegaraan: rawOcr.kewarganegaraan,
      fotoKTP: req.body.fotoKTP, 
      selfieKTP: req.body.selfieKTP || null,
      kdpegawai: req.userKdpegawai,
      role: "nasabah",
    };

    await Datadiri.create(normalizedKtpData);

    res.status(201).json({
      msg: "Data nasabah berhasil disimpan",
      Data: normalizedKtpData,
    });
  } catch (error) {
    console.error("CREATE DATA DIRI ERROR:", error);
    res.status(500).json({ msg: "Gagal menyimpan data nasabah" });
  }
};


export const updateDataDiriNasabah = async (req, res) => {
  try {
    const { nik } = req.params;
    if (!nik) {
      return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });
    }

    if (req.role !== "officer" && req.role !== "superadmin") {
      return res.status(403).json({
        msg: "Anda tidak memiliki hak akses untuk memperbarui data ini!",
      });
    }

    const datadiri = await Datadiri.findOne({ where: { nik } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data nasabah tidak ditemukan!" });
    }

    const fotoKTPFile = req.files?.fotoKTP
      ? req.files.fotoKTP[0].filename
      : datadiri.fotoKTP;

    const selfieKTPFile = req.files?.selfieKTP
      ? req.files.selfieKTP[0].filename
      : datadiri.selfieKTP;

    let ktpData = {};

    if (req.files?.fotoKTP) {
      const ktpPath = path.join("uploads", fotoKTPFile);
      ktpData = await scanKTP(ktpPath);
    }

    const updateFields = {
      nik: datadiri.nik,
      namalengkap: ktpData.namalengkap ?? datadiri.namalengkap,
      tempatlahir: ktpData.tempatlahir ?? datadiri.tempatlahir,
      tanggallahir: ktpData.tanggallahir ?? datadiri.tanggallahir,
      jeniskelamin: ktpData.jeniskelamin ?? datadiri.jeniskelamin,
      statusperkawinan: ktpData.statusperkawinan ?? datadiri.statusperkawinan,
      agama: ktpData.agama ?? datadiri.agama,
      kewarganegaraan: ktpData.kewarganegaraan ?? datadiri.kewarganegaraan,
      alamatlengkap: ktpData.alamatlengkap ?? datadiri.alamatlengkap,
      rt: ktpData.rt ?? datadiri.rt,
      rw: ktpData.rw ?? datadiri.rw,
      desakelurahan: ktpData.desakelurahan ?? datadiri.desakelurahan,
      kecamatan: ktpData.kecamatan ?? datadiri.kecamatan,
      nohp: req.body.nohp ?? datadiri.nohp,
      kabupaten: req.body.kabupaten ?? datadiri.kabupaten,
      provinsi: req.body.provinsi ?? datadiri.provinsi,
      jenisalamat: req.body.jenisalamat ?? datadiri.jenisalamat,
      jenispekerjaan: req.body.jenispekerjaan ?? datadiri.jenispekerjaan,
      namausaha: req.body.namausaha ?? datadiri.namausaha,
      lamabekerja: req.body.lamabekerja ?? datadiri.lamabekerja,
      penghasilanperbulan: req.body.penghasilanperbulan ?? datadiri.penghasilanperbulan,
      alamatpekerjaan: req.body.alamatpekerjaan ?? datadiri.alamatpekerjaan,
      penghasilantambahan: req.body.penghasilantambahan ?? datadiri.penghasilantambahan,
      totalpenghasilan: req.body.totalpenghasilan ?? datadiri.totalpenghasilan,
      pengeluaranbulanan: req.body.pengeluaranbulanan ?? datadiri.pengeluaranbulanan,
      cicilan: req.body.cicilan ?? datadiri.cicilan,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      kdpegawai: datadiri.kdpegawai,
    };

    await Datadiri.update(updateFields, { where: { nik } });

    res.status(200).json({
      msg: "Data nasabah berhasil diperbarui",
      ocrUpdated: !!req.files?.fotoKTP,
    });
  } catch (error) {
    console.error("Error update data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};


export const deleteDataDiriNasabah = async (req, res) => {
  const t = await db.transaction(); 
  try {
    const { nik } = req.params;

    if (!nik) {
      return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({ where: { nik } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data NIK nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    const usahaList = await Datausaha.findAll({
      attributes: ["uuid"],
      where: { nik },
      raw: true,
    });

    const jaminanList = await Datajaminan.findAll({
      attributes: ["uuid"],
      where: { nik },
      raw: true,
    });

    const usahaUUID = usahaList.map(item => item.uuid);
    const jaminanUUID = jaminanList.map(item => item.uuid);

    await db.query("SET innodb_lock_wait_timeout = 120", { transaction: t });

    if (usahaUUID.length > 0) {
      await Datausaha.destroy({ where: { uuid: usahaUUID }, transaction: t });
    }

    if (jaminanUUID.length > 0) {
      await Datajaminan.destroy({ where: { uuid: jaminanUUID }, transaction: t });
    }

    await Datadiri.destroy({ where: { nik }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Nasabah beserta data terkait berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data nasabah:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

