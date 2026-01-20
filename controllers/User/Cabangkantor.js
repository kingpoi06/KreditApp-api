import https from "https";
import fs from "fs/promises";
import xlsx from "xlsx";
import Cabangkantor from "../../models/UserModel/CabangkantorModel.js";

const GEOCODE_DELAY_MS = Number.parseInt(
  process.env.GEOCODE_DELAY_MS || "1000",
  10
);
const GEOCODE_USER_AGENT =
  process.env.GEOCODE_USER_AGENT || "analisiskredit-backend/1.0";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

const normalizeRow = (row) => {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key);
    if (!normalizedKey) return;
    normalized[normalizedKey] = value;
  });
  return normalized;
};

const pickValue = (row, keys) => {
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
    const value = row[key];
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text === "") continue;
    return value;
  }
  return null;
};

const parseCoordinate = (value, min, max) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const normalized = text.replace(",", ".");
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return null;
  if (numeric < min || numeric > max) return null;
  return {
    numeric,
    text: normalized,
  };
};

const requestJson = (url) =>
  new Promise((resolve, reject) => {
    const request = https.request(
      url,
      {
        headers: {
          "User-Agent": GEOCODE_USER_AGENT,
          Accept: "application/json",
          "Accept-Language": "id",
        },
      },
      (response) => {
        let data = "";
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(
              new Error(
                `Geocode error ${response.statusCode}: ${data.slice(0, 200)}`
              )
            );
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on("error", (error) => reject(error));
    request.end();
  });

const reverseGeocode = async (latitude, longitude) => {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", latitude);
  url.searchParams.set("lon", longitude);
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const result = await requestJson(url);
  return result?.display_name || null;
};

const isRowEmpty = (row) =>
  Object.values(row || {}).every((value) => {
    if (value === null || value === undefined) return true;
    return String(value).trim() === "";
  });

const cleanupFile = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error("Failed to remove upload file:", error);
  }
};

export const uploadCabangkantorXlsx = async (req, res) => {
  let filePath;
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "File XLSX wajib diupload" });
    }

    filePath = req.file.path;
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ msg: "Sheet XLSX tidak ditemukan" });
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    if (!rows.length) {
      return res.status(400).json({ msg: "File XLSX kosong" });
    }

    const errors = [];
    const candidates = [];
    const seenCodes = new Set();
    let duplicateInFile = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      if (isRowEmpty(row)) continue;

      const normalized = normalizeRow(row);
      const kodeKantor = pickValue(normalized, [
        "kodekantor",
        "kode",
        "kdkantor",
        "kodekantorcabang",
      ]);
      const namaKantor = pickValue(normalized, [
        "namakantor",
        "nama",
        "namacabang",
      ]);
      const longitudeRaw = pickValue(normalized, ["longitude", "lon", "long"]);
      const latitudeRaw = pickValue(normalized, ["latitude", "lat"]);

      if (!kodeKantor || !namaKantor || longitudeRaw === null || latitudeRaw === null) {
        errors.push({
          row: rowNumber,
          msg: "Kolom kode_kantor, nama_kantor, longitude, latitude wajib diisi",
        });
        continue;
      }

      const longitude = parseCoordinate(longitudeRaw, -180, 180);
      const latitude = parseCoordinate(latitudeRaw, -90, 90);

      if (!longitude || !latitude) {
        errors.push({
          row: rowNumber,
          msg: "Longitude atau latitude tidak valid",
        });
        continue;
      }

      const kodeKantorValue = String(kodeKantor).trim();
      if (seenCodes.has(kodeKantorValue)) {
        duplicateInFile += 1;
        continue;
      }
      seenCodes.add(kodeKantorValue);

      candidates.push({
        row: rowNumber,
        kode_kantor: kodeKantorValue,
        nama_kantor: String(namaKantor).trim(),
        longitude: longitude.numeric,
        latitude: latitude.numeric,
      });
    }

    if (errors.length) {
      return res.status(400).json({
        msg: "Data XLSX tidak valid",
        errors,
      });
    }

    if (!candidates.length) {
      return res.status(400).json({ msg: "Tidak ada data yang bisa diproses" });
    }

    const totalBefore = await Cabangkantor.count();
    const existing = await Cabangkantor.findAll({
      attributes: ["kode_kantor"],
      where: { kode_kantor: candidates.map((item) => item.kode_kantor) },
    });
    const existingCodes = new Set(
      existing.map((item) => item.kode_kantor)
    );

    const payload = [];
    const geocodeCache = new Map();
    let skippedExisting = 0;

    for (const candidate of candidates) {
      if (existingCodes.has(candidate.kode_kantor)) {
        skippedExisting += 1;
        continue;
      }

      const cacheKey = `${candidate.latitude},${candidate.longitude}`;
      let alamatLengkap = geocodeCache.get(cacheKey);
      if (!alamatLengkap) {
        try {
          alamatLengkap = await reverseGeocode(
            candidate.latitude,
            candidate.longitude
          );
          if (alamatLengkap) {
            geocodeCache.set(cacheKey, alamatLengkap);
          }
          if (GEOCODE_DELAY_MS > 0) {
            await sleep(GEOCODE_DELAY_MS);
          }
        } catch (error) {
          errors.push({
            row: candidate.row,
            msg: `Gagal membaca alamat dari koordinat: ${error.message}`,
          });
          continue;
        }
      }

      if (!alamatLengkap) {
        errors.push({
          row: candidate.row,
          msg: "Alamat lengkap tidak ditemukan dari koordinat",
        });
        continue;
      }

      payload.push({
        kode_kantor: candidate.kode_kantor,
        nama_kantor: candidate.nama_kantor,
        longitude: String(candidate.longitude),
        latitude: String(candidate.latitude),
        alamatLengkap: alamatLengkap,
      });
    }

    if (errors.length) {
      return res.status(400).json({
        msg: "Data XLSX tidak valid",
        errors,
      });
    }

    if (!payload.length) {
      return res.status(200).json({
        msg: "Tidak ada data baru yang ditambahkan",
        jumlahDataAda: totalBefore,
        jumlahDataBaru: 0,
        jumlahDuplikatDatabase: skippedExisting,
        jumlahDuplikatFile: duplicateInFile,
        totalData: totalBefore,
      });
    }

    await Cabangkantor.bulkCreate(payload);

    return res.status(201).json({
      msg: "Upload cabang kantor berhasil",
      jumlahDataAda: totalBefore,
      jumlahDataBaru: payload.length,
      jumlahDuplikatDatabase: skippedExisting,
      jumlahDuplikatFile: duplicateInFile,
      totalData: totalBefore + payload.length,
    });
  } catch (error) {
    console.error("Error upload cabang kantor:", error);
    return res.status(500).json({ msg: "Gagal memproses file XLSX" });
  } finally {
    await cleanupFile(filePath);
  }
};

export const getCabangkantorAll = async (req, res) => {
  try {
    const data = await Cabangkantor.findAll({
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      msg: "Data cabang kantor",
      data,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

const buildUpdatePayload = (body) => {
  const payload = {
    nama_kantor: body.nama_kantor ?? body.namaKantor,
    longitude: body.longitude,
    latitude: body.latitude,
    alamatLengkap: body.alamatLengkap ?? body.alamat_lengkap,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
};

export const updateCabangkantor = async (req, res) => {
  try {
    const kodeKantor = req.params?.kode_kantor;
    if (!kodeKantor) {
      return res.status(400).json({ msg: "Kode kantor tidak ditemukan" });
    }

    const cabang = await Cabangkantor.findByPk(kodeKantor);
    if (!cabang) {
      return res.status(404).json({ msg: "Data cabang kantor tidak ditemukan" });
    }

    const payload = buildUpdatePayload(req.body);
    if (!Object.keys(payload).length) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui" });
    }

    await cabang.update(payload);

    return res.status(200).json({
      msg: "Data cabang kantor berhasil diperbarui",
      data: cabang,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
