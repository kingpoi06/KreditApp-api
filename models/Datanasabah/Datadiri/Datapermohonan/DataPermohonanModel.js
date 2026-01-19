import { Sequelize } from "sequelize";
import db from "../../../../config/Database.js";
import Permohonan from "../../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const DataPermohonan = db.define(
  "datanasabah/data-permohonan",
  {
    idDataPermohonan: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      primaryKey: true, 
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
      type: DataTypes.INTEGER(50),
      allowNull: true,
    },
    jangkaWaktuKredit: {
      type: DataTypes.INTEGER(50),
      allowNull: true,
    },
    sukuBungaTahun: {
      type: DataTypes.INTEGER(20),
      allowNull: true,
    },
    sukuBungaBulan: {
      type: DataTypes.INTEGER(20),
      allowNull: true,
    },
    perhitunganBunga: {
      type: DataTypes.INTEGER(50),
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

Permohonan.hasOne(DataPermohonan);
DataPermohonan.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default DataPermohonan;
