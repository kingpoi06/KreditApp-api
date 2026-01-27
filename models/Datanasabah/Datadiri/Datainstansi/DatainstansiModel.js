import { Sequelize } from "sequelize";
import db from "../../../../config/Database.js";
import Permohonan from "../../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const Datainstansi = db.define(
  "datanasabah-data-instansi",
  {
    idDataInstansiNasabah: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      primaryKey: true,
    },

    //DATA Instansi NASABAH
    namaInstansi: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    statusInstansi: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bidangInstansi: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    alamatInstansi: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
    },
    namaAtasan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    namaBendahara: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nomorHP: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    jabatanDebitur: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    pangkatGolongan: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    statusPegawai: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    nipNik: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    npwp: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bekerjaSejak: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
      },
    },
    uploadNPWP: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    uploadSKTerakhir: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    
    // FOREIGN KEY
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

Permohonan.hasOne(Datainstansi);
Datainstansi.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default Datainstansi;
