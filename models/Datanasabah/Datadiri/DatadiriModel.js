import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Users from "../../UserModel.js"

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
    namalengkap: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    tempatlahir: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    tanggallahir: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },
    jeniskelamin: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    statusperkawinan: {
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
    nohp: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
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

    //Alamat Domisili
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
    kabupaten: {
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
    jenisalamat: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    //Data Pekerjaan
    jenispekerjaan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    namausaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lamabekerja: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    penghasilanperbulan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    alamatpekerjaan: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    penghasilantambahan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    //DATA PENGHASILAN
    totalpenghasilan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    pengeluaranbulanan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    cicilan: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // STATUS PENGAJUAN KREDIT
    statusPengajuan: {
      type: DataTypes.ENUM(
        "PROSES PENGAJUAN",
        "SUDAH DIAJUKAN",
        "DITOLAK"
      ),
      allowNull: false,
      defaultValue: "PROSES PENGAJUAN",
    },
    tanggalDiajukan: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    tanggalDisetujui: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tanggalDitolak: {
      type: DataTypes.DATE,
      allowNull: true,
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
      allowNull: false,
      references: {
        model: Users,
        key: "kdpegawai",
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

Users.hasMany(Datadiri);
Datadiri.belongsTo(Users, { foreignKey: "kdpegawai"});

export default Datadiri;
