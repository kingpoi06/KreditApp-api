import Datadiri from "../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import { Op, fn, col, where } from "sequelize";
import Analisis from "../../../models/Datanasabah/Analisis/AnalisisModel.js";
import Permohonan from "../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js";
import Users from "../../../models/UserModel/UserModel.js";
import db from "../../../config/Database.js";
import { sendWhatsAppBulk } from "../../../utils/whatsappNotifier.js";

const getWitaHour = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Makassar",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hourPart = parts.find((part) => part.type === "hour");
  if (!hourPart) return date.getUTCHours();
  const parsed = Number(hourPart.value);
  return Number.isFinite(parsed) ? parsed : date.getUTCHours();
};

const resolveGreeting = (date = new Date()) => {
  const hour = getWitaHour(date);
  if (hour >= 1 && hour <= 10) return "Pagi";
  if (hour >= 11 && hour <= 15) return "Siang";
  if (hour >= 16 && hour <= 18) return "Sore";
  return "Malam";
};

const buildAnalisisNotificationPayload = ({
  officerName,
  jenisKredit,
}) => {
  const greeting = resolveGreeting();
  const cleanJenisKredit = jenisKredit || "-";
  return {
    message: `Selamat ${greeting}, Pengusul Atas Nama ${officerName} yang telah menambahkan Data Analisis 5C telah Masuk berupa jenis Kredit ${cleanJenisKredit}. Terima Kasih`,
    templateParams: [greeting, officerName, cleanJenisKredit],
  };
};

const resolveOfficerContext = async (req) => {
  const normalizedRole = String(req.role || "").toLowerCase();
  if (normalizedRole !== "officer") return null;

  const officer = await Users.findByPk(req.userKdpegawai, {
    attributes: ["namalengkap", "kdpegawai", "kdkantor"],
  });
  const officerName = officer?.namalengkap || req.username || req.userKdpegawai;
  const kodeKantor = officer?.kdkantor || req.kdkantor;

  return {
    officerName,
    kodeKantor,
  };
};

const notifyKomiteCabang = async ({
  kodeKantor,
  officerName,
  jenisKredit,
}) => {
  if (!kodeKantor) {
    return { skipped: true, reason: "kode_kantor tidak tersedia" };
  }

  const komiteList = await Users.findAll({
    where: {
      kdkantor: kodeKantor,
      [Op.and]: [where(fn("lower", col("role")), "komitecabang")],
    },
    attributes: ["telpKantor", "kdpegawai", "namalengkap"],
  });

  const recipients = [
    ...new Set(
      komiteList
        .map((item) => item.telpKantor)
        .filter((value) => value && String(value).trim() !== "")
    ),
  ];

  if (!recipients.length) {
    return { skipped: true, reason: "telpKantor komitecabang kosong" };
  }

  const notification = buildAnalisisNotificationPayload({
    officerName,
    jenisKredit,
  });

  const result = await sendWhatsAppBulk(recipients, notification.message, {
    templateParams: notification.templateParams,
  });
  return {
    ...result,
    jumlahPenerima: recipients.length,
  };
};

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
  jenisNasabah: body.jenisNasabah,
  tunggakanKewajibanRutinNonKredit: body.tunggakanKewajibanRutinNonKredit,
  danaDaruratCalonDebitur: body.danaDaruratCalonDebitur,
  konsistensiSaldoRekening: body.konsistensiSaldoRekening,
  cadanganKasOperasionalUsaha: body.cadanganKasOperasionalUsaha,
  rekeningKhususOperasionalUsaha: body.rekeningKhususOperasionalUsaha,
  risikoPHKPekerjaan: body.risikoPHKPekerjaan,
  penghasilanAlternatifBerkelanjutan: body.penghasilanAlternatifBerkelanjutan,
  stabilitasOmzetUsaha: body.stabilitasOmzetUsaha,
  ketergantunganPelangganUtama: body.ketergantunganPelangganUtama,
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

const buildPermohonanAccessInclude = (req) => {
  const role = String(req.role || "").toLowerCase();
  const permohonanWhere = {};
  const userWhere = {};

  if (role === "officer") {
    permohonanWhere.kdpegawai = req.userKdpegawai;
  } else if (role === "komitecabang" || role === "ketuacabang" || role === "penyelia") {
    if (req.kdkantor) {
      userWhere.kdkantor = req.kdkantor;
    }
  }

  if (!Object.keys(permohonanWhere).length && !Object.keys(userWhere).length) {
    return [];
  }

  const includeUser = Object.keys(userWhere).length
    ? [
        {
          model: Users,
          attributes: [],
          where: userWhere,
          required: true,
        },
      ]
    : [];

  return [
    {
      model: Permohonan,
      attributes: [],
      ...(Object.keys(permohonanWhere).length ? { where: permohonanWhere } : {}),
      required: true,
      include: includeUser,
    },
  ];
};

export const getAnalisisAll = async (req, res) => {
  try {
    const includeAccess = buildPermohonanAccessInclude(req);
    const response = await Analisis.findAll({
      ...(includeAccess.length ? { include: includeAccess } : {}),
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

    const includeAccess = buildPermohonanAccessInclude(req);
    const analisis = await Analisis.findOne({
      where: filter.where,
      ...(includeAccess.length ? { include: includeAccess } : {}),
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

      let notif = null;
      const officerContext = await resolveOfficerContext(req);
      if (officerContext) {
        try {
          notif = await notifyKomiteCabang({
            kodeKantor: officerContext.kodeKantor,
            officerName: officerContext.officerName,
            jenisKredit: updateFields.jenisKredit || existing.jenisKredit,
          });
        } catch (notifError) {
          notif = { error: notifError?.message || "Gagal kirim notif" };
        }
      }

      return res.status(200).json({
        msg: "Data Analisis 5C berhasil diperbarui!",
        notif,
      });
    }

    await Analisis.create(payload);

    let notif = null;
    const officerContext = await resolveOfficerContext(req);
    if (officerContext) {
      try {
        notif = await notifyKomiteCabang({
          kodeKantor: officerContext.kodeKantor,
          officerName: officerContext.officerName,
          jenisKredit: payload.jenisKredit,
        });
      } catch (notifError) {
        notif = { error: notifError?.message || "Gagal kirim notif" };
      }
    }

    res.status(201).json({
      msg: "Data Analisis 5C berhasil ditambahkan!",
      notif,
    });
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

    let notif = null;
    const officerContext = await resolveOfficerContext(req);
    if (officerContext) {
      try {
        notif = await notifyKomiteCabang({
          kodeKantor: officerContext.kodeKantor,
          officerName: officerContext.officerName,
          jenisKredit: updateFields.jenisKredit || analisis.jenisKredit,
        });
      } catch (notifError) {
        notif = { error: notifError?.message || "Gagal kirim notif" };
      }
    }

    res.status(200).json({
      msg: "Data Analisis berhasil diperbarui!",
      notif,
    });
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
