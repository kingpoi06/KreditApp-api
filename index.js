import express from "express";
import db from "./config/Database.js";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import UserRoute from "./routes/UserRoute.js";
import AuthRoute from "./routes//login/AuthRoute.js";
import TokenRoute from "./routes//login/TokenRoute.js";
import bodyParser from "body-parser";
import path from "path";

import PermohonanRoute from "./routes/Datanasabah/Permohonan/PermohonanRoute.js";
import DatadiriRoute from "./routes/Datanasabah/Datadiri/DatadiriRoute.js";
import DashboardNasabahRoute from "./routes/Datanasabah/Permohonan/DashboardDataRoute.js";
import ocrKTPRoute from "./routes/Datanasabah/Datadiri/OCRktp/ocrKTPRoute.js"
import DatausahaRoute from "./routes/Datanasabah/Datadiri/Datausaha/DatausahaRoute.js";
import DatajaminanRoute from "./routes/Datanasabah/Datadiri/Datajaminan/DatajaminanRoute.js";
import DatapermohonanRoute from "./routes/Datanasabah/Datadiri/Datapermohonan/DatapermohonanRoute.js";
import DatainstansiRoute from "./routes/Datanasabah/Datadiri/Datainstansi/DatainstansiRoute.js";
import AnalisisRoute from "./routes/Datanasabah/Analisis/AnalisisRoute.js";
import CabangkantorRoute from "./routes/CabangkantorRoute.js";
import PegawaiRoute from "./routes/PegawaiRoute.js";
import migrateNoPermohonanPrimaryKey from "./utils/migrateNoPermohonanPrimaryKey.js";
import migrateOcrKtpNullable from "./utils/migrateOcrKtpNullable.js";
import migrateUserCabangKantor from "./utils/migrateUserCabangKantor.js";
import migrateDataPermohonanColumns from "./utils/migrateDataPermohonanColumns.js";
import migrateOcrKtpDropUserFK from "./utils/migrateOcrKtpDropUserFK.js";
import migrateUserSessionId from "./utils/migrateUserSessionId.js";
import migrateDatadiriSlikColumns from "./utils/migrateDatadiriSlikColumns.js";

import { verifyToken, verifyUser } from "./middleware/verify.js";

dotenv.config();

const app = express();

app.use(
  cors({
    credentials: true,
    // origin: ["http://10.20.20.123:5173"],
    origin: true,
  })
);

// 2. Set up helmet middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// 3. Use JSON middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.json());

// 4. Sync database
(async () => {
  await migrateNoPermohonanPrimaryKey();
  await migrateOcrKtpNullable();
  await migrateOcrKtpDropUserFK();
  await migrateUserCabangKantor();
  await migrateUserSessionId();
  await migrateDataPermohonanColumns();
  await migrateDatadiriSlikColumns();
  await db.sync({ alter: { drop: false } });
})();

// 5. Define unprotected routes
app.use(AuthRoute);
app.use(TokenRoute);
app.use( AuthRoute);
app.use( TokenRoute);

// 🔹 Mendapatkan __dirname di ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 6. Define protected routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(verifyToken, verifyUser, UserRoute);
app.use(verifyToken, verifyUser, PermohonanRoute);
app.use(verifyToken, verifyUser, DashboardNasabahRoute)
app.use(verifyToken, verifyUser, ocrKTPRoute);
app.use(verifyToken, verifyUser, DatadiriRoute);
app.use(verifyToken, verifyUser, DatausahaRoute);
app.use(verifyToken, verifyUser, DatajaminanRoute);
app.use(verifyToken, verifyUser, DatapermohonanRoute);
app.use(verifyToken, verifyUser, DatainstansiRoute);
app.use(verifyToken, verifyUser, AnalisisRoute);
app.use(verifyToken, verifyUser, CabangkantorRoute);
app.use(verifyToken, verifyUser, PegawaiRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});
