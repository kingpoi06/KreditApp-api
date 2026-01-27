// import { Sequelize } from "sequelize";
// import dotenv from "dotenv";

// dotenv.config();

// const {
//   DB_HOST,
//   DB_USERNAME,
//   DB_PASSWORD,
//   DB_DBDATABASE,
//   DB_PORT,
// } = process.env;

// const db = new Sequelize(DB_DBDATABASE, DB_USERNAME, DB_PASSWORD, {
//   host: DB_HOST,
//   port: Number(process.env.DB_PORT || 3306),
//   dialect: "mariadb",
//   logging: (msg) => console.log(msg.split(":")[1]),
// });

// export { db };
// export default db;

import { Sequelize } from "sequelize";

const db = new Sequelize("AnalisisKreditBpr_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: (msg) => console.log(msg.split(":")[1]),
});


export { db };
export default db;
