import { Sequelize } from "sequelize";
import db from "../../../../config/Database.js";
import Permohonan from "../../generateNoPermohonan/PermohonanModel.js";

const { DataTypes } = Sequelize;

const Datausaha = db.define(
  "datanasabah/data-usaha",
  {
    idDataUsahaNasabah: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      primaryKey: true,
    },

    //DATA USAHA NASABAH
    namaUsaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    jenisUsaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    bidangUsaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    statusUsaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },    
    statusKepemilikan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    npwp: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    plafonPinjaman: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    // KEUANGAN USAHA
    omsetPerbulan: {
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    omsetPerhari: {
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // PERHITUNGAN PERHARI 1 BANDING 30/31
    lamaUsahaSebulan: {
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // OTOMATIS PENGHITUNGNA DARI --> LamaUsahaSebulan * OmsetPerhari
    totalPenghasilanPerbulan: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // PENGELUARAN KEUANGAN
    pengeluaranUsaha: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    pengeluaranKeluarga: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // OTOMATIS PERHITUNGAN DARI OMSETPERBULAN * 60%
    HPP: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // OTOMATIS PERHITUNGAN DARI OMSETPERBULAN - HPP
    grossProfit: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // OTOMATIS NET PROFIT
    netProfit: { 
      type: DataTypes.INTEGER(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // LOKASI dan Alamat Usaha
    alamatUsaha: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    desaKelurahan: {
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
    kabupatenKota: {
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
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    statusAlamatUsaha: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    // LEGALITAS & PERIZINAN USAHA
    nib: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    tglNIB: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },

    siup: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    tglSIUP: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },

    sku: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    tglSKU: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },
    
    izinKhusus: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    // UPLOAD DOKUMEN LEGALITAS
    fotoNIB: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },

    fotoNPWP: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    fotoSIUP: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    fotoSKU: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    
    // DOKUMENTASI TEMPAT USAHA
    fotodepan: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
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

Permohonan.hasOne(Datausaha);
Datausaha.belongsTo(Permohonan, { foreignKey: "no_permohonan" });

export default Datausaha;
