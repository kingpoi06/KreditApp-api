import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js"
import Datausaha from "../../../models/Datanasabah/Datajaminan/DatajaminanModel.js";
import Datajaminan from "../../../models/Datanasabah/Datajaminan/DatajaminanModel.js";
import Users from "../../../models/UserModel.js";
import db from "../../../config/Database.js";

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

    const datadiri = await Datadiri.findOne({ where: { nik },
    include: [{
        model: Users,
        attributes: ["kdpegawai", "namalengkap", "kdkantor"],
      }], });
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
    const {
      nik,
      namalengkap,
      tempatlahir,
      tanggallahir,
      jeniskelamin,
      statusperkawinan,
      agama,
      kewarganegaraan,
      nohp,
      alamatlengkap,
      rt,
      rw,
      desakelurahan,
      kecamatan,
      kabupaten,
      provinsi,
      jenisalamat,
      jenispekerjaan,
      namausaha,
      lamabekerja,
      penghasilanperbulan,
      alamatpekerjaan,
      penghasilantambahan,
      totalpenghasilan,
      pengeluaranbulanan,
      cicilan,
    } = req.body;

    const fotoKTPFile = req.files?.fotoKTP?.[0]?.filename;
    const selfieKTPFile = req.files?.selfieKTP?.[0]?.filename;

    if (!fotoKTPFile || !selfieKTPFile) {
      return res.status(400).json({
        msg: "Foto KTP dan Selfie KTP wajib diupload",
      });
    }

    await Datadiri.create({
      nik: nik,
      namalengkap: namalengkap,
      tempatlahir: tempatlahir,
      tanggallahir: tanggallahir,
      jeniskelamin: jeniskelamin,
      statusperkawinan: statusperkawinan,
      agama: agama,
      kewarganegaraan: kewarganegaraan,
      nohp: nohp,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      alamatlengkap:alamatlengkap,
      rt: rt,
      rw: rw,
      desakelurahan: desakelurahan,
      kecamatan: kecamatan,
      kabupaten: kabupaten,
      provinsi: provinsi,
      jenisalamat: jenisalamat,
      jenispekerjaan: jenispekerjaan,
      namausaha: namausaha,
      lamabekerja: lamabekerja,
      penghasilanperbulan: penghasilanperbulan,
      alamatpekerjaan: alamatpekerjaan,
      penghasilantambahan: penghasilantambahan,
      totalpenghasilan: totalpenghasilan,
      pengeluaranbulanan: pengeluaranbulanan,
      cicilan:cicilan,
      role: "nasabah",
      kdpegawai: req.userKdpegawai,
    });

    res.status(201).json({
      msg: "Data diri nasabah berhasil disimpan",
    });

  } catch (error) {
    console.error("CREATE DATA DIRI ERROR:", error);
    res.status(500).json({ msg: error.message });
  }
};


export const updateDataDiriNasabah = async (req, res) => {
  try {
    const { nik } = req.params;
    if (!nik) {
      return res.status(400).json({ msg: "Parameter NIK tidak ditemukan!" });
    }

    const datadiri = await Datadiri.findOne({ where: { nik } });
    if (!datadiri) {
      return res.status(404).json({ msg: "Data nasabah tidak ditemukan!" });
    }

    const updateFields = {
      namalengkap: req.body.namalengkap,
      tempatlahir: req.body.tempatlahir,
      tanggallahir: req.body.tanggallahir,
      jeniskelamin: req.body.jeniskelamin,
      statusperkawinan: req.body.statusperkawinan,
      agama: req.body.agama,
      kewarganegaraan: req.body.kewarganegaraan,
      nohp: req.body.nohp,
      fotoKTP: fotoKTPFile,
      selfieKTP: selfieKTPFile,
      alamatlengkap: req.body.alamatlengkap,
      rt: req.body.rt,
      rw: req.body.rw,
      desakelurahan: req.body.desakelurahan,
      kecamatan: req.body.kecamatan,
      kabupaten: req.body.kabupaten,
      provinsi: req.body.provinsi,
      jenisalamat: req.body.jenisalamat,
      jenispekerjaan: req.body.jenispekerjaan,
      namausaha: req.body.namausaha,
      lamabekerja: req.body.lamabekerja,
      penghasilanperbulan: req.body.penghasilanperbulan,
      alamatpekerjaan: req.body.alamatpekerjaan,
      penghasilantambahan: req.body.penghasilantambahan,
      totalpenghasilan: req.body.totalpenghasilan,
      pengeluaranbulanan: req.body.pengeluaranbulanan,
      cicilan: req.body.cicilan,
    };

    // Hanya officer atau superadmin yang bisa update
    if (req.role !== "officer" && req.role !== "superadmin") {
      return res.status(403).json({ msg: "Anda tidak memiliki hak akses untuk memperbarui data ini!" });
    }

    const fotoKTPFile = req.files?.fotoKTP ? req.files.fotoKTP[0].filename : datadiri.fotoKTP;
    const selfieKTPFile = req.files?.selfieKTP ? req.files.selfieKTP[0].filename : datadiri.selfieKTP;

    await Datadiri.update(updateFields, { where: { nik } });

    res.status(200).json({ msg: "Data nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data nasabah:", error);
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

