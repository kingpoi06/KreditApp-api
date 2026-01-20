import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Permohonan from "../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const Analisis = db.define(
  "datanasabah/data-analisis",
  {
    idDataAnalisis: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    no_permohonan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: Permohonan,
        key: "no_permohonan",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    jenisKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tujuanPenggunaanKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    plafonPermohonan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jangkaWaktuKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sukuBungaTahun: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sukuBungaBulan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    perhitunganBunga: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sumberPengembalian: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    caraAngsuranKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    keteranganUmum: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    character: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    jenisNasabah: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tunggakanKewajibanRutinNonKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    danaDaruratCalonDebitur: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    konsistensiSaldoRekening: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cadanganKasOperasionalUsaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rekeningKhususOperasionalUsaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    risikoPHKPekerjaan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    penghasilanAlternatifBerkelanjutan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    stabilitasOmzetUsaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketergantunganPelangganUtama: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusKepemilikanTempatTinggal: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lamaTinggalAlamatSaatIni: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    frekuensiPindahRumah: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    kepatuhanProsesAnalisaKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sumberModalAwalUsaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    buktiKeterlibatanModalSendiri: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    asetProduktifPribadi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lamaUsahaBidangSama: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusLokasiUsaha: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketergantunganTerhadapMusim: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    statusAgunan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    capital1: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    capital2: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    capacity1: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    capacity2: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    capacity3: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    capacity4: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    omsetPerhari: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lamaUsahaSebulan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jenisHPP: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    hargaPokokPenjualan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    omsetPerbulan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    jumlahPendapatan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labaNetto: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labaNettoLainnya: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    labaNettoNonOperasional: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketAngsuranDariBank: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaOperasional: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketBiayaOperasional: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pendapatanLainnya: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pendapatanPemohonKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pendapatanIstriSuami: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pendapatanTambahan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalPenghasilan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketPendapatanLainnya: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaNonOperasional: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    biayaAnakSekolah: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    biayaKonsumsi: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    biayaListrikAirTelepon: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    biayaLainnyaNonOperasional: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketBiayaNonOperasional: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaHutangKewajibanLain: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ketBiayaHutangKewajibanLain: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pokokPerBulan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    totalBungaPerbulan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    angsuranPembiayaan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    kemampuanMembayarSetelahPembiayaan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nilaiRpc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    maksimumPlafonKredit: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    besarAngsuranMpk: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repaymentCapacity: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repaymentCapacityStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    catatanPengajuan: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pertimbanganKewajiban: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pertimbanganUsulan: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

Permohonan.hasOne(Analisis, { foreignKey: "no_permohonan" });
Analisis.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default Analisis;

