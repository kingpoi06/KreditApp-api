import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Datadiri from "../Datadiri/DatadiriModel.js";

const { DataTypes } = Sequelize;

const Datajaminan = db.define(
  "datanasabah/data-jaminan",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true, 
    },

    //DATA UMUM JAMINAN
    jenisjaminan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    namapemilik: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    hubungandengannasabah: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    
    //Detail Jaminan
    noidAgunan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    deskripsiAgunan: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    nilaiAgunan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    dokumentasiAgunan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    statusAgunan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // FOREIGN KEY
    nik: {
      type: DataTypes.STRING(16),
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

Datadiri.hasMany(Datajaminan);
Datajaminan.belongsTo(Datadiri, { foreignKey: "nik" });

export default Datajaminan;
