import fs from "fs/promises";
import xlsx from "xlsx";
import Pegawai from "../../models/UserModel/PegawaiModel.js";
import Cabangkantor from "../../models/UserModel/CabangkantorModel.js";

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

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

const buildSummaryMessage = (totalBefore, addedCount) =>
  `Jumlah data ada: ${totalBefore}. Data baru ditambahkan: ${addedCount}.`;

const buildUpdatePayload = (body) => {
  const payload = {
    Nama_Pegawai:
      body.Nama_Pegawai ?? body.nama_pegawai ?? body.namaPegawai ?? body.nama,
    NRP: body.NRP ?? body.nrp,
    Nama_Jabatan:
      body.Nama_Jabatan ?? body.nama_jabatan ?? body.namaJabatan ?? body.jabatan,
    kode_kantor: body.kode_kantor ?? body.kodeKantor ?? body.kdkantor,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) delete payload[key];
  });

  return payload;
};

export const uploadPegawaiXlsx = async (req, res) => {
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
    const rawRows = xlsx.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    });
    if (!rawRows.length) {
      return res.status(400).json({ msg: "File XLSX kosong" });
    }

    const requiredHeaders = [
      "no",
      "namapegawai",
      "nrp",
      "namajabatan",
      "kodekantor",
    ];
    let headerRowIndex = -1;
    let bestScore = 0;

    rawRows.forEach((row, index) => {
      if (!Array.isArray(row)) return;
      const normalizedHeaders = row.map(normalizeHeader);
      const score = requiredHeaders.filter((key) =>
        normalizedHeaders.some((header) => header.includes(key))
      ).length;
      if (score > bestScore) {
        bestScore = score;
        headerRowIndex = index;
      }
    });

    if (headerRowIndex < 0 || bestScore < 2) {
      return res.status(400).json({ msg: "Header file XLSX tidak ditemukan" });
    }

    const headerRow = rawRows[headerRowIndex] || [];
    const rows = rawRows.slice(headerRowIndex + 1).map((row) => {
      const mapped = {};
      if (!Array.isArray(row)) return mapped;
      headerRow.forEach((header, colIndex) => {
        const key = normalizeHeader(header);
        if (!key) return;
        mapped[key] = row[colIndex];
      });
      return mapped;
    });

    const errors = [];
    const candidates = [];
    const seenNos = new Set();
    let duplicateInFile = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      if (isRowEmpty(row)) continue;

      const normalized = normalizeRow(row);
      const noPegawai = pickValue(normalized, [
        "no",
        "no.",
        "nomor",
        "nomer",
        "nopegawai",
        "id",
        "kodepegawai",
      ]);
      const namaPegawai = pickValue(normalized, [
        "namapegawai",
        "nama_pegawai",
        "nama",
      ]);
      const nrp = pickValue(normalized, ["nrp"]);
      const namaJabatan = pickValue(normalized, [
        "namajabatan",
        "nama_jabatan",
        "jabatan",
      ]);
      const kodeKantor = pickValue(normalized, [
        "kode",
        "kodek",
        "kodekantor",
        "kode_kantor",
        "kdkantor",
      ]);

      if (!noPegawai || !namaPegawai || !nrp || !namaJabatan || !kodeKantor) {
        errors.push({
          row: rowNumber,
          msg: "Kolom No, Nama_Pegawai, NRP, Nama_Jabatan, kode_kantor wajib diisi",
        });
        continue;
      }

      const noValue = String(noPegawai).trim();
      if (seenNos.has(noValue)) {
        duplicateInFile += 1;
        continue;
      }
      seenNos.add(noValue);

      candidates.push({
        row: rowNumber,
        No: noValue,
        Nama_Pegawai: String(namaPegawai).trim(),
        NRP: String(nrp).trim(),
        Nama_Jabatan: String(namaJabatan).trim(),
        kode_kantor: String(kodeKantor).trim(),
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

    const totalBefore = await Pegawai.count();
    const existing = await Pegawai.findAll({
      attributes: ["No"],
      where: { No: candidates.map((item) => item.No) },
    });
    const existingNos = new Set(existing.map((item) => item.No));

    const kodeKantorList = [
      ...new Set(candidates.map((item) => item.kode_kantor)),
    ];
    const cabangList = await Cabangkantor.findAll({
      attributes: ["kode_kantor"],
      where: { kode_kantor: kodeKantorList },
    });
    const cabangCodes = new Set(cabangList.map((item) => item.kode_kantor));

    const payload = [];
    let skippedExisting = 0;

    for (const candidate of candidates) {
      if (existingNos.has(candidate.No)) {
        skippedExisting += 1;
        continue;
      }

      if (!cabangCodes.has(candidate.kode_kantor)) {
        errors.push({
          row: candidate.row,
          msg: `kode_kantor ${candidate.kode_kantor} tidak ditemukan`,
        });
        continue;
      }

      payload.push({
        No: candidate.No,
        Nama_Pegawai: candidate.Nama_Pegawai,
        NRP: candidate.NRP,
        Nama_Jabatan: candidate.Nama_Jabatan,
        kode_kantor: candidate.kode_kantor,
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
        msg: `Tidak ada data baru yang ditambahkan. ${buildSummaryMessage(
          totalBefore,
          0
        )}`,
        jumlahDataAda: totalBefore,
        jumlahDataBaru: 0,
        jumlahDuplikatDatabase: skippedExisting,
        jumlahDuplikatFile: duplicateInFile,
        totalData: totalBefore,
      });
    }

    await Pegawai.bulkCreate(payload, { ignoreDuplicates: true });

    return res.status(201).json({
      msg: `Upload pegawai berhasil. ${buildSummaryMessage(
        totalBefore,
        payload.length
      )}`,
      jumlahDataAda: totalBefore,
      jumlahDataBaru: payload.length,
      jumlahDuplikatDatabase: skippedExisting,
      jumlahDuplikatFile: duplicateInFile,
      totalData: totalBefore + payload.length,
    });
  } catch (error) {
    console.error("Error upload pegawai:", error);
    return res.status(500).json({ msg: "Gagal memproses file XLSX" });
  } finally {
    await cleanupFile(filePath);
  }
};

export const getPegawaiAll = async (req, res) => {
  try {
    const data = await Pegawai.findAll({
      include: [
        {
          model: Cabangkantor,
        },
      ],
      order: [["createdAt", "DESC"]],
    });
    return res.status(200).json({
      msg: "Data pegawai",
      data,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const updatePegawai = async (req, res) => {
  try {
    const noPegawai = req.params?.no;
    if (!noPegawai) {
      return res.status(400).json({ msg: "No pegawai tidak ditemukan" });
    }

    const pegawai = await Pegawai.findByPk(noPegawai);
    if (!pegawai) {
      return res.status(404).json({ msg: "Data pegawai tidak ditemukan" });
    }

    const payload = buildUpdatePayload(req.body);
    if (!Object.keys(payload).length) {
      return res.status(400).json({ msg: "Tidak ada data untuk diperbarui" });
    }

    if (payload.kode_kantor) {
      const cabang = await Cabangkantor.findByPk(payload.kode_kantor);
      if (!cabang) {
        return res.status(400).json({ msg: "kode_kantor tidak ditemukan" });
      }
    }

    await pegawai.update(payload);

    return res.status(200).json({
      msg: "Data pegawai berhasil diperbarui",
      data: pegawai,
    });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};

export const deletePegawai = async (req, res) => {
  try {
    const noPegawai = req.params?.no;
    if (!noPegawai) {
      return res.status(400).json({ msg: "No pegawai tidak ditemukan" });
    }

    const pegawai = await Pegawai.findByPk(noPegawai);
    if (!pegawai) {
      return res.status(404).json({ msg: "Data pegawai tidak ditemukan" });
    }

    await pegawai.destroy();

    return res.status(200).json({ msg: "Data pegawai berhasil dihapus" });
  } catch (error) {
    return res.status(500).json({ msg: error.message });
  }
};
