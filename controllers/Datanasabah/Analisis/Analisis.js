import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Analisis from "../../../models/Datanasabah/Analisis/AnalisisModel.js";
import db from "../../../config/Database.js";

const normalizePayload = (body) => ({
  jenisKredit: body.jenisKredit,
  tujuanPenggunaanKredit: body.tujuanPenggunaanKredit,
  plafonPermohonan: body.plafonPermohonan,
  jangkaWaktuKredit: body.jangkaWaktuKredit,
  sukuBungaTahun: body.sukuBungaTahun,
  sukuBungaBulan: body.sukuBungaBulan,
  perhitunganBunga: body.perhitunganBunga,
  sumberPengembalian: body.sumberPengembalian,
  caraAngsuranKredit: body.caraAngsuranKredit,
  keteranganUmum: body.keteranganUmum,
  character: body.character,
  statusKepemilikanTempatTinggal: body.statusKepemilikanTempatTinggal,
  lamaTinggalAlamatSaatIni: body.lamaTinggalAlamatSaatIni,
  frekuensiPindahRumah: body.frekuensiPindahRumah,
  kepatuhanProsesAnalisaKredit: body.kepatuhanProsesAnalisaKredit,
  sumberModalAwalUsaha: body.sumberModalAwalUsaha,
  buktiKeterlibatanModalSendiri: body.buktiKeterlibatanModalSendiri,
  asetProduktifPribadi: body.asetProduktifPribadi,
  lamaUsahaBidangSama: body.lamaUsahaBidangSama,
  statusLokasiUsaha: body.statusLokasiUsaha,
  ketergantunganTerhadapMusim: body.ketergantunganTerhadapMusim,
  statusAgunan: body.statusAgunan,
  capital1: body.capital1,
  capital2: body.capital2,
  capacity1: body.capacity1,
  capacity2: body.capacity2,
  capacity3: body.capacity3,
  capacity4: body.capacity4,
  omsetPerhari: body.omsetPerhari,
  lamaUsahaSebulan: body.lamaUsahaSebulan,
  jenisHPP: body.jenisHPP,
  hargaPokokPenjualan: body.hargaPokokPenjualan,
  omsetPerbulan: body.omsetPerbulan,
  jumlahPendapatan: body.jumlahPendapatan,
  labaNetto: body.labaNetto,
  labaNettoLainnya: body.labaNettoLainnya,
  labaNettoNonOperasional: body.labaNettoNonOperasional,
  ketAngsuranDariBank: body.ketAngsuranDariBank,
  biayaOperasional: body.biayaOperasional,
  ketBiayaOperasional: body.ketBiayaOperasional,
  pendapatanLainnya: body.pendapatanLainnya,
  pendapatanPemohonKredit: body.pendapatanPemohonKredit,
  pendapatanIstriSuami: body.pendapatanIstriSuami,
  pendapatanTambahan: body.pendapatanTambahan,
  totalPenghasilan: body.totalPenghasilan,
  ketPendapatanLainnya: body.ketPendapatanLainnya,
  biayaNonOperasional: body.biayaNonOperasional,
  biayaAnakSekolah: body.biayaAnakSekolah,
  biayaKonsumsi: body.biayaKonsumsi,
  biayaListrikAirTelepon: body.biayaListrikAirTelepon,
  biayaLainnyaNonOperasional: body.biayaLainnyaNonOperasional,
  ketBiayaNonOperasional: body.ketBiayaNonOperasional,
  biayaHutangKewajibanLain: body.biayaHutangKewajibanLain,
  ketBiayaHutangKewajibanLain: body.ketBiayaHutangKewajibanLain,
  pokokPerBulan: body.pokokPerBulan,
  totalBungaPerbulan: body.totalBungaPerbulan,
  angsuranPembiayaan: body.angsuranPembiayaan,
  kemampuanMembayarSetelahPembiayaan: body.kemampuanMembayarSetelahPembiayaan,
  nilaiRpc: body.nilaiRpc,
  maksimumPlafonKredit: body.maksimumPlafonKredit,
  besarAngsuranMpk: body.besarAngsuranMpk,
  repaymentCapacity: body.repaymentCapacity,
  repaymentCapacityStatus: body.repaymentCapacityStatus,
  catatanPengajuan: body.catatanPengajuan,
  pertimbanganKewajiban: body.pertimbanganKewajiban,
  pertimbanganUsulan: body.pertimbanganUsulan,
});

const stripUndefined = (payload) => {
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  return payload;
};

const resolveAnalisisFilter = (params) => {
  const idDataAnalisis = params?.idDataAnalisis;
  if (idDataAnalisis) {
    return {
      where: { idDataAnalisis },
      label: `ID Data Analisis ${idDataAnalisis}`,
    };
  }

  const noPermohonan = params?.no_permohonan;
  if (noPermohonan) {
    return {
      where: { no_permohonan: noPermohonan },
      label: `No Permohonan ${noPermohonan}`,
    };
  }

  return null;
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

export const getAnalisisAll = async (req, res) => {
  try {
    const response = await Analisis.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      message: "Data Analisis Nasabah",
      Data: response,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getAnalisisByNoPermohonan = async (req, res) => {
  try {
    const filter = resolveAnalisisFilter(req.params);
    if (!filter) {
      return res.status(400).json({ msg: "Parameter No Permohonan atau ID Data Analisis tidak ditemukan!" });
    }

    const analisis = await Analisis.findOne({
      where: filter.where,
    });

    if (!analisis) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    res.status(200).json({
      message: `Data Analisis dengan ${filter.label}`,
      Data: analisis,
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createAnalisis = async (req, res) => {
  try {
    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No permohonan tidak ditemukan!" });
    }

    const payload = stripUndefined({
      no_permohonan: noPermohonan,
      ...normalizePayload(req.body),
    });

    const existing = await Analisis.findOne({
      where: { no_permohonan: noPermohonan },
    });

    if (existing) {
      const updateFields = stripUndefined(normalizePayload(req.body));
      if (Object.keys(updateFields).length === 0) {
        return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
      }

      await Analisis.update(updateFields, {
        where: { no_permohonan: noPermohonan },
      });
      return res.status(200).json({ msg: "Data Analisis 5C berhasil diperbarui!" });
    }

    await Analisis.create(payload);
    res.status(201).json({ msg: "Data Analisis 5C berhasil ditambahkan!" });
  } catch (error) {
    console.error("Error creating Analisis:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateAnalisis = async (req, res) => {
  try {
    const filter = resolveAnalisisFilter(req.params);
    if (!filter) {
      return res.status(400).json({ msg: "Parameter No Permohonan atau ID Data Analisis tidak ditemukan!" });
    }

    const analisis = await Analisis.findOne({
      where: filter.where,
    });
    if (!analisis) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    const updateFields = stripUndefined(normalizePayload(req.body));
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui!" });
    }

    await Analisis.update(updateFields, {
      where: filter.where,
    });

    res.status(200).json({ msg: "Data Analisis berhasil diperbarui!" });
  } catch (error) {
    console.error("Error saat update data analisis:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteAnalisis = async (req, res) => {
  const t = await db.transaction();
  try {
    const filter = resolveAnalisisFilter(req.params);
    if (!filter) {
      return res.status(400).json({ msg: "Parameter No Permohonan atau ID Data Analisis tidak ditemukan!" });
    }

    const analisis = await Analisis.findOne({
      where: filter.where,
    });
    if (!analisis) {
      return res.status(404).json({ msg: "Data tidak ditemukan!" });
    }

    await Analisis.destroy({
      where: filter.where,
      transaction: t,
    });
    await t.commit();

    res.status(200).json({ msg: "Data Analisis berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data analisis:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};
