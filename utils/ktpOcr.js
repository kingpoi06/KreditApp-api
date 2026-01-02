import Tesseract from "tesseract.js";
import sharp from "sharp";

const normalizeOCR = (str) => str
    .toUpperCase()
    .replace(/[“”"]/g, " ")
    .replace(/0/g, "O")   
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/\s+/g, " ")
    .trim();

export const scanKTP = async (imagePath) => {
    const processedImage = await sharp(imagePath)
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(150) 
    .toBuffer();


    const { data } = await Tesseract.recognize(imagePath, "ind", {
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK, 
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789,./- " 
    });


    const rawText = data.text;
    const text = normalizeOCR(rawText);

    const match = (regex) => text.match(regex)?.[1]?.trim() || null;

    let nik = text.match(/N[I1]K[^0-9]{0,10}([0-9]{16})/)?.[1] || null;

    if (!nik) {
        const nikOCR = await Tesseract.recognize(imagePath, "eng", {
        tessedit_char_whitelist: "0123456789",
        tessedit_pageseg_mode: 6,
    });

    const angkaSaja = nikOCR.data.text.replace(/\D/g, "");

    if (angkaSaja.length >= 16) {
      nik = angkaSaja.slice(0, 16);
    }
     }

    const namalengkap = text.match(/NAMA\s*:?\s*([A-Z\s]+)(?=\n|TEMPAT|TGI)/)?.[1]?.trim() || null;
    const ttl = rawText.match(/Tempat\/?Tgi Lahir\s*:?\s*([A-Za-z\s]+)\s*,\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i);
    const tempatlahir = ttl?.[1]?.trim() || null;
    const tanggallahir = ttl?.[2]?.trim() || null;
    const jeniskelamin = text.includes("LAKI")
        ? "LAKI-LAKI"
        : text.includes("PEREMPUAN")
        ? "PEREMPUAN"
        : null;
    const agama = match(/AGAMA\s*:?\s*([A-Z]+)/);

    const statusperkawinan = rawText.match(
    /STATUS\s*PERKAW[I1]NAN\s*\.?\s*:?\s*([A-Z\s]+)(?=\nPEKERJAAN)/i
    )?.[1]?.trim() || null;



    const alamatMatch = rawText.match(/ALAMAT\s*:?\s*([\s\S]*?)\n\s*RT\s*\/?\s*RW/i);
    const alamatlengkap = alamatMatch?.[1]?.trim() || null;

    const rtMatch = rawText.match(/RT\s*\/?\s*RW\s*:?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i);
    const rt = rtMatch?.[1] || null;
    const rw = rtMatch?.[2] || null;

    const desaMatch = rawText.match(/(?:KEL|DESA)\s*:?\s*([A-Z\s]+)(?=\nKecamatan)/i);
    const desakelurahan = desaMatch?.[1]?.trim() || null;

    const kecamatan = rawText.match(/KECAMATAN\s*:?\s*([A-Z\s]+)(?=\n|AGAMA|STATUS)/i)?.[1]?.trim() || null;
    const kabupaten = rawText.match(/KABUPATEN\s*:?\s*([A-Z\s]+)(?=\n|PROVINSI|NIK)/i)?.[1]?.trim() || null;
    const provinsiMatch = rawText.match(/PROVINSI\s*:?\s*([A-Z\s]+)(?=\nKABUPATEN)/i);
    const provinsi = provinsiMatch?.[1]?.trim() || null;

    const pekerjaanMatch = rawText.match(/Pekerjaan\s*[:.]?\s*([\s\S]+?)\nKewarganegaraan/i);
    let jenispekerjaan = pekerjaanMatch?.[1]?.trim() || null;

    if (jenispekerjaan) {
    const parts = jenispekerjaan.split(" ");
    if (parts.length > 1) {
        parts.pop(); 
        jenispekerjaan = parts.join(" ");
    }
    }

    const kewarganegaraanMatch = rawText.match(/Kewarganegaraan\s*[:.]?\s*([A-Z]+)/i);
    const kewarganegaraan = kewarganegaraanMatch?.[1]?.trim() || null;

    return {
        nik,
        namalengkap,
        tempatlahir,
        tanggallahir,
        jeniskelamin,
        agama,
        statusperkawinan,
        alamatlengkap,
        rt,
        rw,
        desakelurahan,
        kecamatan,
        kabupaten,
        provinsi,
        jenispekerjaan,
        kewarganegaraan,
        _rawText: rawText,
        _confidence: data.confidence,
    };
};
