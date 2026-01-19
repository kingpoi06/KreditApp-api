import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";

const { DataTypes } = Sequelize;

const ocrKTP = db.define(
  "datanasabah/ocr-ktp",
  {
    //Data Pribadi
    idOCR: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true, 
    },

    nikKTP: {
      type: DataTypes.STRING(16),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
    namaLengkap: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    tempatLahir: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    tanggalLahir: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    jenisKelamin: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    statusPerkawinan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    agama: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    kewarganegaraan: {
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

    //Alamat Domisili
    alamatLengkap: {
      type: DataTypes.TEXT('long'),
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
    jenispekerjaan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    confidence: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    rawJson: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    kdpegawai: {
      type: DataTypes.STRING(18),
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: true,
  }
);

export default ocrKTP;
