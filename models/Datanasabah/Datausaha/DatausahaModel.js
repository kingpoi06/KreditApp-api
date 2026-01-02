import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Datadiri from "../Datadiri/DatadiriModel.js";

const { DataTypes } = Sequelize;

const Datausaha = db.define(
  "datanasabah/data-usaha",
  {
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      primaryKey: true, // opsional (jika mau ganti id)
    },

    //DATA USAHA
    namausaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    jenisusaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    bidangusaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    bentukusaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    statuskepemilikan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // LOKASI dan Alamat Usaha
    alamatlengkap: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    rt: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    rw: {
      type: DataTypes.STRING(10),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    desakelurahan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kecamatan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    kabupatenkota: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    provinsi: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    titikmaps: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    jenisalamatusaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // LEGALITAS & PERIZINAN USAHA
    nib: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    npwp: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    siup: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    izinkhusus: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // UPLOAD DOKUMEN LEGALITAS
    fotoKTPP: {
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
    fotoNIB: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotoNPWP: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotoSIUP: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // DOKUMENTASI TEMPAT USAHA
    fotodepan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotobelakang: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotokanan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotokiri: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fotodalam: {
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

Datadiri.hasMany(Datausaha);
Datausaha.belongsTo(Datadiri, { foreignKey: "nik" });

export default Datausaha;
