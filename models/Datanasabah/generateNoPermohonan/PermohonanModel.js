import { Sequelize } from "sequelize";
import db from "../../../config/Database.js";
import Users from "../../UserModel/UserModel.js";

const { DataTypes, Op } = Sequelize;

const Permohonan = db.define(
  "generate-no-permohonan",
  {
    //No Permohonan
    no_permohonan: {
      type: DataTypes.STRING(50),
      primaryKey: true,
    },

    jenisKredit: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },

    tglInput: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
    },

    statusPengajuan: {
      type: DataTypes.ENUM(
        "Pending",
        "Approve",
        "Reject"
      ),
      allowNull: false,
      defaultValue: "Pending",
    },
    statusPermohonan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    plafonPermohonan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    sukuBunga: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    jenisPerhitungan: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    plafonPermohonanPenyelia: {
      type: DataTypes.INTEGER(50),
      allowNull: true,
    },
    sukuBungaPenyelia: {
      type: DataTypes.INTEGER(20),
      allowNull: true,
    },
    jenisPerhitunganPenyelia: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    caraPengembalianKredit: {
      type: DataTypes.STRING(150),
      allowNull: true,
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

      keteranganPengajuan: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },

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
hooks: {
  beforeCreate: async (permohonan) => {
    const tahun = new Date(permohonan.tglInput).getFullYear();

    const user = await Users.findOne({
      where: { kdpegawai: permohonan.kdpegawai },
      attributes: ["kdkantor"],
    });

    if (!user) {
      throw new Error("User tidak ditemukan, kdpegawai tidak valid");
    }

    const kdkantor = user.kdkantor;

    const match = permohonan.jenisKredit.match(/\d{3}/);
    if (!match) {
      throw new Error("Format jenis kredit tidak valid");
    }
    const jenisKreditPrefix = match[0];

    const lastData = await Permohonan.findOne({
      where: {
        no_permohonan: {
          [Op.like]: `${jenisKreditPrefix}/${kdkantor}/${tahun}/%`,
        },
      },
      order: [["createdAt", "DESC"]],
    });

    let nextNumber = 1;
    if (lastData) {
      const lastNo = lastData.no_permohonan.split("/").pop();
      nextNumber = parseInt(lastNo, 10) + 1;
    }

    const nomorUrut = String(nextNumber).padStart(4, "0");

    permohonan.no_permohonan =
      `${jenisKreditPrefix}/${kdkantor}/${tahun}/${nomorUrut}`;
  },
},

  }
);


Users.hasMany(Permohonan);
Permohonan.belongsTo(Users, { foreignKey: "kdpegawai"});

export default Permohonan;
