import { Sequelize } from "sequelize";
import db from "../../../../config/Database.js";
import Permohonan from "../../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const Analisis = db.define(
  "datanasabah-data-analisis",
  {
    idDataAnalisis: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    jenisKredit: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tujuanPenggunaanKredit: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    plafonPermohonan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jangkaWaktuKredit: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sumberPengembalian: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    caraAngsuranKredit: {
      type: DataTypes.STRING(150),
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
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    tunggakanKewajibanRutinNonKredit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    danaDaruratCalonDebitur: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    konsistensiSaldoRekening: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    cadanganKasOperasionalUsaha: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rekeningKhususOperasionalUsaha: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    risikoPHKPekerjaan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    penghasilanAlternatifBerkelanjutan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    stabilitasOmzetUsaha: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketergantunganPelangganUtama: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lamaUsahaSebulan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jenisHPP: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    hargaPokokPenjualan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    omsetPerbulan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jumlahPendapatan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    labaNetto: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    labaNettoLainnya: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    labaNettoNonOperasional: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketAngsuranDariBank: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaOperasional: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketBiayaOperasional: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pendapatanLainnya: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketPendapatanLainnya: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaNonOperasional: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketBiayaNonOperasional: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    biayaHutangKewajibanLain: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ketBiayaHutangKewajibanLain: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    pokokPerBulan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    totalBungaPerbulan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
        //form baru
    pendapatanPemohonKredit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pendapatanIstriSuami: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pendapatanTambahan: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    biayaAnakSekolah: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    biayaKonsumsi: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    biayaListrikAirTelepon: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    biayaLainnyaNonOperasional: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    
    angsuranPembiayaan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    kemampuanMembayarSetelahPembiayaan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    repaymentCapacity: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    repaymentCapacityStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },

    pertimbanganKewajiban: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },


    
    
    // FOREIGN KEY
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
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

Permohonan.hasOne(Analisis, { foreignKey: "no_permohonan" });
Analisis.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default Analisis;
