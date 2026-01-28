import Datadiri from "../../../../models/Datanasabah/Datadiri/DatadiriModel.js";
import Datajaminan from "../../../../models/Datanasabah/Datadiri/Datajaminan/DatajaminanModel.js";
import Permohonan from "../../../../models/Datanasabah/generateNoPermohonan/PermohonanModel.js";
import Users from "../../../../models/UserModel/UserModel.js";
import db from "../../../../config/Database.js";

const normalizeDataJaminan = (record) => {
  const plain = record?.get ? record.get({ plain: true }) : record;
  if (!plain) return plain;

  const normalized = { ...plain };
  Object.entries(plain).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!(lowerKey in normalized)) {
      normalized[lowerKey] = value;
    }
  });

  const nilaiAgunanValue = plain.nilaiAgunan ?? plain.nilaiHargaPasar;
  if (nilaiAgunanValue !== undefined) {
    if (normalized.nilaiAgunan === undefined) {
      normalized.nilaiAgunan = nilaiAgunanValue;
    }
    if (normalized.nilaiagunan === undefined) {
      normalized.nilaiagunan = nilaiAgunanValue;
    }
  }

  const jenisSertifikatValue =
    plain.jenisSertifikat ?? plain.jenisJaminanSertifikat;
  if (jenisSertifikatValue !== undefined) {
    if (normalized.jenisSertifikat === undefined) {
      normalized.jenisSertifikat = jenisSertifikatValue;
    }
    if (normalized.jenisJaminanSertifikat === undefined) {
      normalized.jenisJaminanSertifikat = jenisSertifikatValue;
    }
  }

  const pengikatanJaminanValue =
    plain.pengikatanJaminan ?? plain.statusPengikatanJaminan;
  if (pengikatanJaminanValue !== undefined) {
    if (normalized.pengikatanJaminan === undefined) {
      normalized.pengikatanJaminan = pengikatanJaminanValue;
    }
    if (normalized.statusPengikatanJaminan === undefined) {
      normalized.statusPengikatanJaminan = pengikatanJaminanValue;
    }
  }

  return normalized;
};

const resolveNoPermohonan = async (body) => {
  let noPermohonan = body.no_permohonan || body.noPermohonan;
  const nik = body.nik;

  if (!noPermohonan && nik && String(nik).includes("/")) {
    noPermohonan = nik;
  }

  if (!noPermohonan && nik) {
    const datadiri = await Datadiri.findOne({
      where: { nik },
      attributes: ["no_permohonan"],
    });
    noPermohonan = datadiri?.no_permohonan;
  }

  return noPermohonan;
};

const buildPermohonanAccessInclude = (req) => {
  const role = String(req.role || "").toLowerCase();
  const permohonanWhere = {};
  const userWhere = {};

  if (role === "officer") {
    permohonanWhere.kdpegawai = req.userKdpegawai;
  } else if (role === "komitecabang" || role === "ketuacabang" || role === "admin" || role === "penyelia") {
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

export const getDataJaminan = async (req, res) => {
  try {
    let response;
    if (req.role === "superadmin" || req.role === "officer" || req.role == "ketuacabang" || req.role === "komitecabang" || req.role === "admin" || req.role === "penyelia" || req.role === "headofficer") {
      const includeAccess = buildPermohonanAccessInclude(req);
      response = await Datajaminan.findAll({
        ...(includeAccess.length ? { include: includeAccess } : {}),
      });
    } else {
      response = [];
    }
    res.status(200).json({
      message: "Data Jaminan Nasabah",
      Data: [response.map((item) =>
        normalizeDataJaminan(item.get({ plain: true }))
      )],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const getDataJaminanByUUID = async (req, res) => {
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;
    if (req.role !== "superadmin" && req.role !== "officer" && req.role !== "ketuacabang" && req.role !== "komitecabang" && req.role !== "admin" && req.role !== "penyelia" && req.role !== "headofficer") {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    const includeAccess = buildPermohonanAccessInclude(req);
    const response = await Datajaminan.findOne({
      where: {
        no_permohonan: noPermohonan,
      },
      ...(includeAccess.length ? { include: includeAccess } : {}),
    });
    if (!response) return res.status(404).json({ msg: "Data Tidak Ditemukan!" });

    res.status(200).json({
      message: `Data NASABAH Dengan No Permohonan ${noPermohonan}`,
      Data: [normalizeDataJaminan(response.get({ plain: true }))],
    });
  } catch (error) {
    res.status(500).json({ msg: error.message });
  }
};

export const createDataJaminan = async (req, res) => {
  const { 
    jenisjaminan,
    hubungandengannasabah,
    noidAgunan,
    deskripsiAgunan,
    nilaiHargaPasar,
    statusPengikatan,
    statusAgunan,
    hubDgnBPR,
    jenisHub,
    sejakTahun,
    sisaSaldoDana,
    statusHubBankLain,
    totalJaminan,
    namaPemilikSertifikat,
    jenisJaminanSertifikat,
    jenisSertifikat,
    noSertifikat,
    letak,
    luas,
    taksiranPasar,
    nilaiPPAP,
    nilaiNJOP,
    nilaiNJOPTanah,
    nilaiNJOPBangunan,
    nilaiTaksiranKelurahan,
    nilaiLikuidasiBank,
    jumlahNilaiDigunakan,
    plafonDiajukan,
    pengikatanJaminan,
    namaPemilikBPKB,
    tipeBPKB,
    pengikatan,
    rerataNilaiPasar,
    safetyMargin,
    nilaiLikuidasi,
    noBPKB,
    merek,
    noMesin,
    noSTNK,
    noRangka,
    masaLakuSTNK,
    namaDebitur,
    buktiHakMilik,
    noBilyet,
    tanggalDeposito,
    tipeDeposito,
    nilaiPasarDeposit,
    bungaSimpanan,
    bungaTambahan,
    tipeTabungan,
    lokasiJaminan,
    saldoTabunganDiblokirSebesarPlafon,
    noRekening,
    statusPengikatanJaminan,
  } = req.body;

  try {
    const noPermohonan = await resolveNoPermohonan(req.body);
    if (!noPermohonan) {
      return res.status(400).json({ msg: "No Permohonan wajib diisi!" });
    }

    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan
      ? req.files.dokumentasiAgunan[0].filename
      : null;
    const resolvedJenisSertifikat = jenisJaminanSertifikat ?? jenisSertifikat;
    const resolvedPengikatanJaminan =
      statusPengikatanJaminan ?? pengikatanJaminan;
    const payload = {
      jenisjaminan: jenisjaminan,
      hubungandengannasabah: hubungandengannasabah,
      noidAgunan: noidAgunan,
      deskripsiAgunan: deskripsiAgunan,
      totalJaminan: totalJaminan,
      namaPemilikSertifikat: namaPemilikSertifikat,
      nilaiHargaPasar: nilaiHargaPasar,
      statusPengikatan: statusPengikatan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan: statusAgunan,
      hubDgnBPR: hubDgnBPR,
      jenisHub: jenisHub,
      sejakTahun: sejakTahun,
      sisaSaldoDana: sisaSaldoDana,
      statusHubBankLain: statusHubBankLain,
      jenisJaminanSertifikat: resolvedJenisSertifikat,
      jenisSertifikat: resolvedJenisSertifikat,
      noSertifikat: noSertifikat,
      letak: letak,
      luas: luas,
      taksiranPasar: taksiranPasar,
      nilaiPPAP: nilaiPPAP,
      nilaiNJOP: nilaiNJOP,
      nilaiNJOPTanah: nilaiNJOPTanah,
      nilaiNJOPBangunan: nilaiNJOPBangunan,
      nilaiTaksiranKelurahan: nilaiTaksiranKelurahan,
      nilaiLikuidasiBank: nilaiLikuidasiBank,
      jumlahNilaiDigunakan: jumlahNilaiDigunakan,
      plafonDiajukan: plafonDiajukan,
      pengikatanJaminan: resolvedPengikatanJaminan,
      namaPemilikBPKB: namaPemilikBPKB,
      tipeBPKB: tipeBPKB,
      pengikatan: pengikatan,
      rerataNilaiPasar: rerataNilaiPasar,
      safetyMargin: safetyMargin,
      nilaiLikuidasi: nilaiLikuidasi,
      noBPKB: noBPKB,
      merek: merek,
      noMesin: noMesin,
      noSTNK: noSTNK,
      noRangka: noRangka,
      masaLakuSTNK: masaLakuSTNK,
      namaDebitur: namaDebitur,
      buktiHakMilik: buktiHakMilik,
      noBilyet: noBilyet,
      tanggalDeposito: tanggalDeposito,
      tipeDeposito: tipeDeposito,
      nilaiPasarDeposit: nilaiPasarDeposit,
      bungaSimpanan: bungaSimpanan,
      bungaTambahan: bungaTambahan,
      tipeTabungan: tipeTabungan,
      lokasiJaminan: lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon: saldoTabunganDiblokirSebesarPlafon,
      noRekening: noRekening,
      no_permohonan: noPermohonan,
    };

    await Datajaminan.create(payload);
    res.status(201).json({ msg: "Data Jaminan Nasabah Berhasil Ditambahkan!" });
  } catch (error) {
    console.error("Error creating Data Jaminan:", error);
    res.status(500).json({ msg: error.message });
  }
};

export const updateDataJaminan = async (req, res) => {
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;
    if (!noPermohonan) return res.status(400).json({ msg: "Parameter No Permohonan tidak ditemukan!" });

    const datajaminan = await Datajaminan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datajaminan) return res.status(404).json({ msg: "Data Jaminan tidak ditemukan!" });

    const plainDatajaminan = datajaminan.get({ plain: true });

    const {
      jenisjaminan,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      nilaiHargaPasar,
      statusPengikatan,
      statusAgunan,
      hubDgnBPR,
      jenisHub,
      sejakTahun,
      sisaSaldoDana,
      statusHubBankLain,
      totalJaminan,
      namaPemilikSertifikat,
      jenisJaminanSertifikat,
      jenisSertifikat,
      noSertifikat,
      letak,
      luas,
      taksiranPasar,
      nilaiPPAP,
      nilaiNJOP,
      nilaiNJOPTanah,
      nilaiNJOPBangunan,
      nilaiTaksiranKelurahan,
      nilaiLikuidasiBank,
      jumlahNilaiDigunakan,
      plafonDiajukan,
      pengikatanJaminan,
      namaPemilikBPKB,
      tipeBPKB,
      pengikatan,
      rerataNilaiPasar,
      safetyMargin,
      nilaiLikuidasi,
      noBPKB,
      merek,
      noMesin,
      noSTNK,
      noRangka,
      masaLakuSTNK,
      namaDebitur,
      buktiHakMilik,
      noBilyet,
      tanggalDeposito,
      tipeDeposito,
      nilaiPasarDeposit,
      bungaSimpanan,
      bungaTambahan,
      tipeTabungan,
      lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon,
      noRekening,
      statusPengikatanJaminan,
    } = req.body;

    // Ambil file baru dari multer, jika tidak ada pakai file lama
    const dokumentasiAgunanFile = req.files?.dokumentasiAgunan
      ? req.files.dokumentasiAgunan[0].filename
      : plainDatajaminan.dokumentasiAgunan;
    const resolvedJenisSertifikat = jenisJaminanSertifikat ?? jenisSertifikat;
    const resolvedPengikatanJaminan =
      statusPengikatanJaminan ?? pengikatanJaminan;

    const updateFields = {
      jenisjaminan,
      hubungandengannasabah,
      noidAgunan,
      deskripsiAgunan,
      totalJaminan,
      namaPemilikSertifikat,
      nilaiHargaPasar,
      statusPengikatan,
      dokumentasiAgunan: dokumentasiAgunanFile,
      statusAgunan,
      hubDgnBPR,
      jenisHub,
      sejakTahun,
      sisaSaldoDana,
      statusHubBankLain,
      jenisJaminanSertifikat: resolvedJenisSertifikat,
      jenisSertifikat: resolvedJenisSertifikat,
      noSertifikat,
      letak,
      luas,
      taksiranPasar,
      nilaiPPAP,
      nilaiNJOP,
      nilaiNJOPTanah,
      nilaiNJOPBangunan,
      nilaiTaksiranKelurahan,
      nilaiLikuidasiBank,
      jumlahNilaiDigunakan,
      plafonDiajukan,
      pengikatanJaminan: resolvedPengikatanJaminan,
      namaPemilikBPKB,
      tipeBPKB,
      pengikatan,
      rerataNilaiPasar,
      safetyMargin,
      nilaiLikuidasi,
      noBPKB,
      merek,
      noMesin,
      noSTNK,
      noRangka,
      masaLakuSTNK,
      namaDebitur,
      buktiHakMilik,
      noBilyet,
      tanggalDeposito,
      tipeDeposito,
      nilaiPasarDeposit,
      bungaSimpanan,
      bungaTambahan,
      tipeTabungan,
      lokasiJaminan,
      saldoTabunganDiblokirSebesarPlafon,
      noRekening,
    };

    if (!["superadmin", "officer"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }
    await Datajaminan.update(updateFields, { where: { no_permohonan: noPermohonan } });

    res.status(200).json({ msg: "Data Jaminan Nasabah Berhasil Diperbaharui!" });
  } catch (error) {
    console.error("Error saat update:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

export const deleteDataJaminan = async (req, res) => {
  const t = await db.transaction();
  try {
    const noPermohonan =
      req.params.no_permohonan || req.params.uuid || req.params.idDataJaminan;

    if (!noPermohonan) {
      return res.status(400).json({ msg: "Parameter No Permohonan jaminan tidak ditemukan!" });
    }

    const datajaminan = await Datajaminan.findOne({ where: { no_permohonan: noPermohonan } });
    if (!datajaminan) {
      return res.status(404).json({ msg: "Data Jaminan Nasabah tidak ditemukan!" });
    }

    if (!["superadmin"].includes(req.role)) {
      return res.status(403).json({ msg: "Akses ditolak!" });
    }

    await Datajaminan.destroy({ where: { no_permohonan: noPermohonan }, transaction: t });

    await t.commit();

    res.status(200).json({ msg: "Data Jaminan Nasabah berhasil dihapus!" });
  } catch (error) {
    await t.rollback();
    console.error("Error saat delete data jaminan:", error);
    res.status(500).json({ msg: "Terjadi kesalahan server" });
  }
};

