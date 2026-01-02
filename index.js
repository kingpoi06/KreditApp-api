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

import DatadiriRoute from "./routes/Datanasabah/Datadiri/DatadiriRoute.js";
import DatausahaRoute from "./routes/Datanasabah/Datausaha/DatausahaRoute.js";
import DatajaminanRoute from "./routes/Datanasabah/Datajaminan/DatajaminanRoute.js";


import { verifyToken, verifyUser } from "./middleware/verify.js";

dotenv.config();

const app = express();
app.use(express.static("upload"));

app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:5173"],
    // origin: true,
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
  await db.sync();
})();

// 5. Define unprotected routes
app.use(AuthRoute);
app.use(TokenRoute);


// 6. Define protected routes
app.use(verifyToken, verifyUser, UserRoute);
app.use(verifyToken, verifyUser, DatadiriRoute);
app.use(verifyToken, verifyUser, DatausahaRoute);
app.use(verifyToken, verifyUser, DatajaminanRoute);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server up and running on port ${PORT}`);
});
