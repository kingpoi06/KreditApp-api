import { Sequelize } from "sequelize";
import db from "../../../../config/Database.js";
import Permohonan from "../../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const Datajaminan = db.define(
  "datanasabah/data-jaminan",
  {
    idDataJaminan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
    },

    jenisjaminan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hubungandengannasabah: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "hubunganDenganNasabah",
    },
    noidAgunan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    deskripsiAgunan: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    totalJaminan: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    nilaiHargaPasar: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    statusPengikatan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    statusAgunan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    dokumentasiAgunan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    hubDgnBPR: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    jenisHub: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sejakTahun: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    sisaSaldoDana: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    statusHubBankLain: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    slik: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    slikText: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },

    // SERTIFIKAT
    jenisJaminanSertifikat: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    jenisSertifikat: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    noSertifikat: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    letak: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    luas: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    taksiranPasar: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiPPAP: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiNJOP: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiNJOPTanah: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiNJOPBangunan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiTaksiranKelurahan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiLikuidasiBank: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    jumlahNilaiDigunakan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    plafonDiajukan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    pengikatanJaminan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    // BPKB
    namaPemilikBPKB: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tipeBPKB: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    pengikatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    rerataNilaiPasar: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    safetyMargin: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    nilaiLikuidasi: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    noBPKB: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    merek: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    noMesin: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    noSTNK: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    noRangka: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    masaLakuSTNK: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },

    // DEPOSITO
    namaDebitur: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    buktiHakMilik: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    noBilyet: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tanggalDeposito: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    tipeDeposito: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nilaiPasarDeposit: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    bungaSimpanan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    bungaTambahan: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },

    // TABUNGAN
    tipeTabungan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lokasiJaminan: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    saldoTabunganDiblokirSebesarPlafon: {
      type: DataTypes.INTEGER(150),
      allowNull: true,
    },
    noRekening: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    no_permohonan: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

Permohonan.hasOne(Datajaminan, { foreignKey: "no_permohonan" });
Datajaminan.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default Datajaminan;
