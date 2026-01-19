import { Sequelize } from "sequelize";
import db from "../../config/Database.js";

const {DataTypes} = Sequelize;

const Users = db.define ('users', {
    kdpegawai:{
        type: DataTypes.STRING(18),
        primaryKey: true,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    username:{
        type: DataTypes.STRING(50),
        allowNull: false,
        validate:{
            notEmpty: true,
            len:[3, 100]
        }
    },
    namalengkap:{
        type: DataTypes.STRING(100),
        allowNull: false,
        validate:{
            notEmpty: true,
            len:[3, 100]
        }
    },
    email:{
        type: DataTypes.STRING(100),
        allowNull: false,
        validate:{
            notEmpty: true,
            isEmail: true
        }
    },
    
    kdkantor:{
        type: DataTypes.STRING(20),
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    cabangKantor:{
        type: DataTypes.STRING(255),
        allowNull: true,
        validate:{
            notEmpty: true
        }
    },
    alamatKantor:{
        type: DataTypes.STRING(255),
        allowNull: true,
        validate:{
            notEmpty: true
        }
    },
    telpKantor:{
        type: DataTypes.STRING(30),
        allowNull: true,
        validate:{
            notEmpty: true
        }
    },
    jabatan:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    role:{
        type: DataTypes.STRING(20),
        allowNull: false,
        validate:{
            notEmpty: true
        }
    },
    sessionId:{
        type: DataTypes.STRING(64),
        allowNull: true,
    },
    jwt_token:{
        type: DataTypes.TEXT
    },
},{
    freezeTableName: true,
    timestamps: true,
});

export default Users;
