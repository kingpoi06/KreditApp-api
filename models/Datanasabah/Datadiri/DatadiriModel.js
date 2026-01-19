import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Permohonan from "../generateNoPermohonan/PermohonanModel.js"

const { DataTypes } = Sequelize;

const Datadiri = db.define(
  "datanasabah/data-diri",
  {
    //Data Pribadi
    nik: {
      type: DataTypes.STRING(16),
      allowNull: false,
      primaryKey: true,
      validate: {
        notEmpty: true,
      },
    },
    namaLengkap: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    tempatLahir: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    tanggalLahir: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },
    jenisKelamin: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    statusPerkawinan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    agama: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kewarganegaraan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kontakPribadi: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    anakTanggungan: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    alamatLengkap: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    rt: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    rw: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    desaKelurahan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    kabupaten: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    provinsi: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    titikmaps: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    jenispekerjaan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    namaIbuKandung: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fotoKTP: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    selfieKTP: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    nikPenanggungJawab: {
      type: DataTypes.STRING(16),
      allowNull: false,
      field: "nikPasangan",
      validate: {
        notEmpty: true,
      },
    },
    namaPenanggungJawab: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "namaPasangan",
      validate: {
        notEmpty: true,
      },
    },
    pekerjaanPenanggungJawab: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "pekerjaanPasangan",
      validate: {
        notEmpty: true,
      },
    },
    tempatLahirPenanggungJawab: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tanggalLahirPenanggungJawab: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    noHPPenanggungJawab: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "kontakPasangan",
      validate: {
        notEmpty: true,
      },
    },
    hubunganDenganPemohon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fotoKTPPenanggungJawab: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "fotoKTPPasangan",
      validate: {
        notEmpty: true,
      },
    },

    //Role Akun Pengguna
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kdpegawai: {
      type: DataTypes.STRING(18),
      allowNull: true,
    },

    no_permohonan: {
      type: DataTypes.STRING(50),
      allowNull: false,
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

Permohonan.hasOne(Datadiri, { foreignKey: "no_permohonan" });
Datadiri.belongsTo(Permohonan, { foreignKey: "no_permohonan"});

export default Datadiri;
