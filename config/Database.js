import { Sequelize } from "sequelize";

const db = new Sequelize("AnalisisKreditBpr_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: (msg) => console.log(msg.split(":")[1]),
});


export { db };
export default db;

// import { Sequelize } from "sequelize";

// const { DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DBDATABASE } = process.env;

// const db = new Sequelize(DB_DBDATABASE, DB_USERNAME, DB_PASSWORD, {
//   host: DB_HOST,
//   dialect: "mysql",
//   logging: (msg) => console.log(msg.split(":")[1]),
// });

// export { db };
// export default db;
