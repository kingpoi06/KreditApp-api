import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import DataPermohonan from "../../../../models/Datanasabah/Datadiri/Datapermohonan/DataPermohonanModel.js";
import db from "../../../../config/Database.js";

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (body) => ({
  jenisKredit: body.jenisKredit,
  tujuanPenggunaanKredit: body.tujuanPenggunaanKredit,
  plafonPermohonan: toNumber(body.plafonPermohonan),
  jangkaWaktuKredit: toNumber(body.jangkaWaktuKredit),
  sukuBungaTahun: toNumber(body.sukuBungaTahun),
  sukuBungaBulan: toNumber(body.sukuBungaBulan),
  perhitunganBunga: toNumber(body.perhitunganBunga),
  sumberPengembalian: body.sumberPengembalian,
  caraAngsuranKredit: body.caraAngsuranKredit,
  keteranganUmum: body.keteranganUmum,
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

export const getDatapermohonanALL = async (req, res) => {
  try {
    const response = await DataPermohonan.findAll({
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      message: "Data Permohonan Nasabah",
      Data: response.map((item) => item.get({ plain: true })),
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataPermohonanByUUID = async (req, res) => {
  try {
    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;
    const permohonan = await DataPermohonan.findOne({
      where: { no_permohonan: noPermohonan },
    });

    if (!permohonan) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    res.status(200).json({
      message: `Data permohonan dengan No Permohonan ${noPermohonan}`,
      Data: permohonan.get({ plain: true }),
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataPermohonan = async (req, res) => {
  try {
    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const payload = stripUndefined({
      no_permohonan: noPermohonan,
      ...normalizePayload(req.body),
    });

    await DataPermohonan.create(payload);
    res.status(201).json({ msg: "Data permohonan nasabah berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Permohonan:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataPermohonan = async (req, res) => {
  try {
    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;
    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datapermohonan = await DataPermohonan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datapermohonan) {
      return res.status(404).json({ msg: "Data permohonan tidak ditemukan!" });
    }

    const updateFields = stripUndefined(normalizePayload(req.body));
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    await DataPermohonan.update(updateFields, { where: { no_permohonan: noPermohonan } });

    res.status(200).json({ msg: "Data permohonan nasabah berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data permohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataPermohonan = async (req, res) => {
  const t = await db.transaction();
  try {
    const { no_permohonan: noPermohonanParam } = req.params;
    const noPermohonan = noPermohonanParam || req.params.idDataPermohonan;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });
    }

    const datapermohonan = await DataPermohonan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datapermohonan) {
      return res.status(404).json({ msg: "Data permohonan tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await DataPermohonan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });
    await t.commit();

    res.status(200).json({ msg: "Data permohonan nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data permohonan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
