import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datainstansi from "../../../../models/Datanasabah/Datadiri/Datainstansi/DatainstansiModel.js";
import db from "../../../../config/Database.js";

const normalizeDataInstansi = (record) => {
  const plain = record?.get ? record.get({ plain: true }) : record;
  if (!plain) return plain;

  const normalized = { ...plain };
  Object.entries(plain).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value;
    }
  });

  return normalized;
};

const normalizePayload = (body) => ({
  namaInstansi: body.namaInstansi,
  statusInstansi: body.statusInstansi,
  bidangInstansi: body.bidangInstansi,
  alamatInstansi: body.alamatInstansi,
  namaAtasan: body.namaAtasan,
  namaBendahara: body.namaBendahara,
  nomorHP: body.nomorHP ?? body.noHP ?? body.nohp,
  jabatanDebitur: body.jabatanDebitur,
  pangkatGolongan: body.pangkatGolongan,
  statusPegawai: body.statusPegawai,
  nipNik: body.nipNik ?? body.nipNIK ?? body.nip ?? body.nik,
  npwp: body.npwp,
  bekerjaSejak: body.bekerjaSejak ?? body.bekerja_sejak,
});

const stripUndefined = (payload) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
};

const resolveNoPermohonan = async (body) => {
  let noPermohonan = body.no_permohonan || body.noPermohonan;
  if (!noPermohonan && body.nik) {
    const rawNik = String(body.nik);
    if (rawNik.includes("/")) {
      noPermohonan = rawNik;
    } else {
      const datadiri = await Datadiri.findOne({
        where: { nik: rawNik },
        attributes: ["no_permohonan"],
      });
      noPermohonan = datadiri?.no_permohonan;
    }
  }
  return noPermohonan;
};

export const getDataInstansi = async (req, res) => {
  try {
    let response;
    if (["superadmin", "officer", "ketuacabang", "komitecabang"].includes(req.role)) {
      response = await Datainstansi.findAll();
    } else {
      response = [];
    }
    res.status(200).json({
      message: "Data Instansi Nasabah",
      Data: [response.map(normalizeDataInstansi)],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataInstansiByNoPermohonan = async (req, res) => {
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.idDataInstansiNasabah || req.params.uuid;
    const instansi = await Datainstansi.findOne({
      where: { no_permohonan: noPermohonan },
    });

    if (!instansi) {
      return res.status(404).json({ msg: "Data Tidak Ditemukan!" });
    }

    if (!["superadmin", "officer", "ketuacabang", "komitecabang"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    res.status(200).json({
      message: `Data Instansi Dengan No Permohonan ${noPermohonan}`,
      Data: [normalizeDataInstansi(instansi)],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataInstansi = async (req, res) => {
  try {
    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const uploadSKTerakhirFile = req.files?.uploadSKTerakhir
      ? req.files.uploadSKTerakhir[0].filename
      : null;
    const uploadNPWPFile = req.files?.uploadNPWP
      ? req.files.uploadNPWP[0].filename
      : null;

    const payload = stripUndefined({
      no_permohonan: noPermohonan,
      uploadSKTerakhir: uploadSKTerakhirFile ?? req.body.uploadSKTerakhir,
      uploadNPWP: uploadNPWPFile ?? req.body.uploadNPWP,
      ...normalizePayload(req.body),
    });

    await Datainstansi.create(payload);
    res.status(201).json({ msg: "Data instansi nasabah berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Instansi:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataInstansi = async (req, res) => {
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.idDataInstansiNasabah || req.params.uuid;
    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const instansi = await Datainstansi.findOne({ where: { no_permohonan: noPermohonan } });
    if (!instansi) {
      return res.status(404).json({ msg: "Data instansi tidak ditemukan!" });
    }

    const uploadSKTerakhirFile = req.files?.uploadSKTerakhir
      ? req.files.uploadSKTerakhir[0].filename
      : instansi.uploadSKTerakhir;
    const uploadNPWPFile = req.files?.uploadNPWP
      ? req.files.uploadNPWP[0].filename
      : instansi.uploadNPWP;

    const updateFields = stripUndefined({
      ...normalizePayload(req.body),
      uploadSKTerakhir: uploadSKTerakhirFile,
      uploadNPWP: uploadNPWPFile,
    });

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    await Datainstansi.update(updateFields, { where: { no_permohonan: noPermohonan } });
    res.status(200).json({ msg: "Data instansi nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data instansi:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataInstansi = async (req, res) => {
  const t = await db.transaction();
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.idDataInstansiNasabah || req.params.uuid;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const instansi = await Datainstansi.findOne({ where: { no_permohonan: noPermohonan } });
    if (!instansi) {
      return res.status(404).json({ msg: "Data instansi tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datainstansi.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });
    await t.commit();

    res.status(200).json({ msg: "Data instansi nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data instansi:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
