import sharp from "sharp";

const OCR_SPACE_ENDPOINT = "https://api.ocr.space/parse/image";
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || "K87910109088957";
const OCR_SPACE_LANGUAGE = process.env.OCR_SPACE_LANGUAGE || "ind";
const OCR_SPACE_FALLBACK_LANGUAGE = "eng";
const OCR_SPACE_ENGINE = process.env.OCR_SPACE_ENGINE || "2";
const OCR_SPACE_ENGINE_FALLBACK = "1";
const OCR_SPACE_API_KEY_IS_PLACEHOLDER = OCR_SPACE_API_KEY === "helloworld";
const OCR_UPLOAD_MAX_BYTES = Number(process.env.OCR_UPLOAD_MAX_BYTES || 10 * 1024 * 1024);
const OCR_SPACE_MAX_BYTES = Number(process.env.OCR_SPACE_MAX_BYTES || 950 * 1024);
const OCR_TARGET_WIDTH = 2400;
const OCR_TARGET_HEIGHT = 1500;
const OCR_PREVIEW_WIDTH = 1200;
const OCR_AUTO_PREVIEW_WIDTH = 900;
const OCR_DEFAULT_JPEG_QUALITY = 90;
const OCR_PNG_COMPRESSION = 9;
const OCR_TRIM_THRESHOLD = 25;
const OCR_BRIGHT_THRESHOLD = 185;
const OCR_MIN_SCORE = 6;
const OCR_MIN_FOREGROUND_RATIO = 0.004;
const OCR_MIN_CROP_RATIO = 0.12;
const OCR_MAX_CROP_RATIO = 0.98;
const OCR_REQUIRED_FIELDS = [
    "nikKTP",
    "namaLengkap",
    "tempatLahir",
    "tanggalLahir",
    "jenisKelamin",
    "alamatLengkap",
    "rt",
    "rw",
    "desaKelurahan",
    "kecamatan",
    "kabupaten",
    "provinsi",
    "agama",
    "statusPerkawinan",
    "jenispekerjaan",
    "kewarganegaraan",
];

const normalizeOCR = (str) => str
    .toUpperCase()
    .replace(/[^\x20-\x7E\r\n]/g, " ")
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (str) => str
    .toUpperCase()
    .replace(/[^\x20-\x7E\r\n]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r?\n\s*/g, "\n")
    .trim();

const toDigits = (value) => value
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/\D/g, "");

const normalizeLabel = (value) => value
    .toUpperCase()
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/0/g, "O")
    .replace(/1/g, "I")
    .replace(/5/g, "S")
    .replace(/8/g, "B")
    .replace(/\s+/g, " ")
    .trim();

const DATE_REGEX = /\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/;
const LABEL_WORD_REGEX = /(NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS|KELAMIN|GOL|DARAH|ALAMAT|RT|RW|KELURAHAN|KEL\b|DESA|KECAMATAN|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)/i;
const ADDRESS_BLOCKLIST_REGEX = /(NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS|KELAMIN|GOL|DARAH|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)/i;
const GENDER_REGEX = /\b(LAKI|PEREMPUAN)\b/i;

const countLetters = (value) => (value.match(/[A-Z]/g) || []).length;

const isLikelyNameValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    if (DATE_REGEX.test(upper)) return false;
    if (LABEL_WORD_REGEX.test(upper)) return false;
    if (/\d/.test(upper)) return false;
    return countLetters(upper) >= 3;
};

const isLikelyRegionValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    if (DATE_REGEX.test(upper)) return false;
    if (/\d/.test(upper)) return false;
    if (LABEL_WORD_REGEX.test(upper)) return false;
    if (GENDER_REGEX.test(upper)) return false;
    if (MARITAL_STATUS_VALUES.some((val) => upper.includes(val))) return false;
    if (RELIGION_VALUES.some((val) => upper.includes(val))) return false;
    return countLetters(upper) >= 3;
};

const isLikelyAddressValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    if (ADDRESS_BLOCKLIST_REGEX.test(upper)) return false;
    return countLetters(upper) >= 3;
};

const isLikelyJobValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    if (DATE_REGEX.test(upper)) return false;
    if (LABEL_WORD_REGEX.test(upper)) return false;
    return countLetters(upper) >= 3;
};

const isLikelyStatusValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    return MARITAL_STATUS_VALUES.some((val) => upper.includes(val));
};

const isLikelyReligionValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    return RELIGION_VALUES.some((val) => upper.includes(val));
};

const isLikelyNationalityValue = (value) => {
    if (!value) return false;
    const upper = String(value).toUpperCase();
    return /\bWNI\b/.test(upper) || /\bWNA\b/.test(upper);
};

const isLikelyGenderValue = (value) => {
    if (!value) return false;
    return GENDER_REGEX.test(String(value).toUpperCase());
};

const isLikelyDateValue = (value) => DATE_REGEX.test(String(value));

const FIELD_VALIDATORS = {
    nikKTP: (value) => toDigits(value).length >= 16,
    namaLengkap: isLikelyNameValue,
    tempatLahir: isLikelyNameValue,
    tanggalLahir: isLikelyDateValue,
    jenisKelamin: isLikelyGenderValue,
    agama: isLikelyReligionValue,
    statusPerkawinan: isLikelyStatusValue,
    alamatLengkap: isLikelyAddressValue,
    rt: (value) => /^\d{1,3}$/.test(String(value).replace(/\D/g, "")),
    rw: (value) => /^\d{1,3}$/.test(String(value).replace(/\D/g, "")),
    desaKelurahan: isLikelyRegionValue,
    kecamatan: isLikelyRegionValue,
    kabupaten: isLikelyRegionValue,
    provinsi: isLikelyRegionValue,
    jenispekerjaan: isLikelyJobValue,
    kewarganegaraan: isLikelyNationalityValue,
};

const isFieldValueValid = (field, value) => {
    if (!value) return false;
    const validator = FIELD_VALIDATORS[field];
    if (!validator) return true;
    return validator(value);
};

const sanitizeParsedFields = (result) => {
    if (!result) return result;
    const sanitized = { ...result };
    if (sanitized.nikKTP) {
        const digits = toDigits(sanitized.nikKTP);
        sanitized.nikKTP = digits.length >= 16 ? digits.slice(0, 16) : null;
    }
    if (sanitized.rt) {
        const digits = toDigits(sanitized.rt);
        sanitized.rt = digits ? digits.slice(0, 3) : null;
    }
    if (sanitized.rw) {
        const digits = toDigits(sanitized.rw);
        sanitized.rw = digits ? digits.slice(0, 3) : null;
    }
    for (const field of Object.keys(FIELD_VALIDATORS)) {
        if (!isFieldValueValid(field, sanitized[field])) {
            sanitized[field] = null;
        }
    }
    return sanitized;
};

const shouldReplaceField = (field, currentValue, incomingValue) => {
    if (!incomingValue) return false;
    if (!currentValue) return true;
    const currentValid = isFieldValueValid(field, currentValue);
    const incomingValid = isFieldValueValid(field, incomingValue);
    if (incomingValid && !currentValid) return true;
    return false;
};

const shrinkToMaxBytes = async (payload, maxBytes) => {
    if (!payload?.buffer || payload.buffer.length <= maxBytes) return payload;

    const qualitySteps = [90, 82, 74, 66, 58];
    const preferPng = payload.mimeType === "image/png";

    if (preferPng) {
        const pngBuffer = await sharp(payload.buffer)
            .png({ compressionLevel: OCR_PNG_COMPRESSION })
            .toBuffer();
        if (pngBuffer.length <= maxBytes) {
            return { buffer: pngBuffer, mimeType: "image/png" };
        }
    }

    let lastBuffer = payload.buffer;
    for (const quality of qualitySteps) {
        const jpegBuffer = await sharp(payload.buffer)
            .jpeg({ quality, chromaSubsampling: "4:4:4" })
            .toBuffer();
        lastBuffer = jpegBuffer;
        if (jpegBuffer.length <= maxBytes) {
            return { buffer: jpegBuffer, mimeType: "image/jpeg" };
        }
    }

    const meta = await sharp(payload.buffer).metadata();
    if (!meta?.width || !meta?.height) {
        return { buffer: lastBuffer, mimeType: "image/jpeg" };
    }

    let scale = 0.9;
    let resizedBuffer = lastBuffer;
    while (scale >= 0.5) {
        const width = Math.max(900, Math.round(meta.width * scale));
        const height = Math.max(600, Math.round(meta.height * scale));
        for (const quality of qualitySteps) {
            const resized = await sharp(payload.buffer)
                .resize({ width, height, fit: "inside", withoutEnlargement: true })
                .jpeg({ quality, chromaSubsampling: "4:4:4" })
                .toBuffer();
            resizedBuffer = resized;
            if (resized.length <= maxBytes) {
                return { buffer: resized, mimeType: "image/jpeg" };
            }
        }
        scale *= 0.85;
    }

    return { buffer: resizedBuffer, mimeType: "image/jpeg" };
};

const ensureOcrSpacePayload = async (payload) => {
    if (!payload) return payload;
    const normalized = Buffer.isBuffer(payload)
        ? { buffer: payload, mimeType: "image/jpeg" }
        : payload;
    if (!normalized?.buffer) return normalized;
    let next = {
        ...normalized,
        mimeType: normalized.mimeType || "image/jpeg",
    };
    if (next.buffer.length > OCR_UPLOAD_MAX_BYTES) {
        next = await shrinkToMaxBytes(next, OCR_UPLOAD_MAX_BYTES);
    }
    if (next.buffer.length > OCR_SPACE_MAX_BYTES) {
        next = await shrinkToMaxBytes(next, OCR_SPACE_MAX_BYTES);
    }
    return next;
};

const requestOcr = async (imagePayload, language, engine = OCR_SPACE_ENGINE) => {
    if (OCR_SPACE_API_KEY_IS_PLACEHOLDER) {
        throw new Error("OCR_SPACE_API_KEY belum diisi");
    }
    const safePayload = await ensureOcrSpacePayload(imagePayload);
    if (!safePayload?.buffer) {
        throw new Error("Payload OCR kosong.");
    }
    if (safePayload.buffer.length > OCR_SPACE_MAX_BYTES) {
        throw new Error("File terlalu besar untuk OCR Space. Silakan kompres ulang.");
    }
    const mimeType = safePayload.mimeType === "image/png" ? "image/png" : "image/jpeg";
    const extension = mimeType === "image/png" ? "png" : "jpg";
    const form = new FormData();
    form.append("file", new Blob([safePayload.buffer], { type: mimeType }), `ktp.${extension}`);
    form.append("language", language);
    form.append("isOverlayRequired", "true");
    form.append("detectOrientation", "true");
    form.append("scale", "true");
    form.append("OCREngine", engine);

    const response = await fetch(OCR_SPACE_ENDPOINT, {
        method: "POST",
        headers: {
            apikey: OCR_SPACE_API_KEY,
        },
        body: form,
    });

    if (!response.ok) {
        let message = `OCR API error: ${response.status} ${response.statusText}`;
        if (response.status === 403) {
            message = "OCR API error: 403 Forbidden. Periksa OCR_SPACE_API_KEY/kuota atau coba OCR_SPACE_ENGINE=1.";
        }
        const error = new Error(message);
        error.status = response.status;
        throw error;
    }

    const payload = await response.json();
    if (payload?.IsErroredOnProcessing) {
        const message = Array.isArray(payload.ErrorMessage)
            ? payload.ErrorMessage.join(", ")
            : payload.ErrorMessage || "OCR API error";
        throw new Error(message);
    }

    return payload;
};

const requestOcrWithFallback = async (imagePayload) => {
    try {
        return await requestOcr(imagePayload, OCR_SPACE_LANGUAGE, OCR_SPACE_ENGINE);
    } catch (error) {
        if (error?.status === 403 && OCR_SPACE_ENGINE !== OCR_SPACE_ENGINE_FALLBACK) {
            return await requestOcr(imagePayload, OCR_SPACE_LANGUAGE, OCR_SPACE_ENGINE_FALLBACK);
        }
        if (
            OCR_SPACE_LANGUAGE !== OCR_SPACE_FALLBACK_LANGUAGE &&
            String(error?.message || "").includes("E201")
        ) {
            return await requestOcr(imagePayload, OCR_SPACE_FALLBACK_LANGUAGE, OCR_SPACE_ENGINE);
        }
        throw error;
    }
};

const applyContrast = (pipeline, contrast) => {
    if (contrast === 1) return pipeline;
    const intercept = 128 - contrast * 128;
    return pipeline.linear(contrast, intercept);
};

const getLumaStats = async (imageBuffer) => {
    try {
        const stats = await sharp(imageBuffer)
            .resize({ width: OCR_AUTO_PREVIEW_WIDTH, withoutEnlargement: true })
            .grayscale()
            .stats();
        const channel = stats?.channels?.[0];
        if (!channel) return null;
        return {
            mean: channel.mean,
            stdev: channel.stdev,
            min: channel.min,
            max: channel.max,
        };
    } catch {
        return null;
    }
};

const buildAutoPresetOptions = async (imageBuffer) => {
    const stats = await getLumaStats(imageBuffer);
    let threshold = 150;
    let brightness = 1;
    let contrast = 1.1;
    let gamma = 1;
    let median = 0;

    if (stats) {
        const { mean, stdev } = stats;

        if (mean < 90) {
            brightness = 1.35;
            gamma = 1.1;
            threshold = 125;
        } else if (mean < 120) {
            brightness = 1.2;
            threshold = 138;
        } else if (mean > 185) {
            brightness = 0.85;
            threshold = 178;
        } else if (mean > 165) {
            brightness = 0.9;
            threshold = 165;
        }

        if (stdev < 30) {
            contrast = 1.55;
        } else if (stdev < 45) {
            contrast = 1.35;
        } else if (stdev < 60) {
            contrast = 1.2;
        }

        if (stdev > 70) {
            threshold = null;
        }
        if (stdev > 85) {
            median = 3;
        }
    }

    return {
        threshold,
        brightness,
        contrast,
        gamma,
        normalize: true,
        sharpen: true,
        median,
        outputFormat: threshold === null ? "jpeg" : "png",
        jpegQuality: OCR_DEFAULT_JPEG_QUALITY,
    };
};

const preprocessForOcr = async (imageBuffer, options = {}) => {
    const {
        threshold = 150,
        brightness = 1,
        contrast = 1,
        gamma = 1,
        normalize = true,
        sharpen = true,
        blur = 0,
        median = 0,
        outputFormat,
        jpegQuality = OCR_DEFAULT_JPEG_QUALITY,
    } = options;

    let pipeline = sharp(imageBuffer)
        .flatten({ background: "#ffffff" })
        .resize({
            width: OCR_TARGET_WIDTH,
            height: OCR_TARGET_HEIGHT,
            fit: "inside",
            kernel: sharp.kernel.lanczos3,
        })
        .grayscale();

    if (normalize) {
        pipeline = pipeline.normalize();
    }
    if (brightness !== 1) {
        pipeline = pipeline.modulate({ brightness });
    }
    const safeGamma = Math.min(3, Math.max(1, gamma));
    if (safeGamma !== 1) {
        pipeline = pipeline.gamma(safeGamma);
    }
    if (contrast !== 1) {
        pipeline = applyContrast(pipeline, contrast);
    }
    if (median > 0) {
        pipeline = pipeline.median(median);
    }
    if (blur > 0) {
        pipeline = pipeline.blur(blur);
    }
    if (sharpen) {
        pipeline = pipeline.sharpen();
    }
    if (threshold !== null) {
        pipeline = pipeline.threshold(threshold);
    }

    const format = outputFormat || (threshold === null ? "jpeg" : "png");
    if (format === "png") {
        return {
            buffer: await pipeline.png({ compressionLevel: OCR_PNG_COMPRESSION }).toBuffer(),
            mimeType: "image/png",
        };
    }
    return {
        buffer: await pipeline.jpeg({ quality: jpegQuality, chromaSubsampling: "4:4:4" }).toBuffer(),
        mimeType: "image/jpeg",
    };
};

const OCR_PRESETS_PRIMARY = [
    { id: "auto", options: buildAutoPresetOptions },
    { id: "std", options: { threshold: 150, contrast: 1.1 } },
    { id: "soft", options: { threshold: null, contrast: 1.1 } },
];

const OCR_PRESETS_SECONDARY = [
    { id: "dark", options: { threshold: 130, brightness: 1.25, contrast: 1.2 } },
    { id: "bright", options: { threshold: 175, brightness: 0.85, gamma: 1.2, contrast: 1.25 } },
    { id: "faded", options: { threshold: 160, contrast: 1.4 } },
    { id: "noisy", options: { threshold: 150, median: 3, contrast: 1.2 } },
    { id: "moire", options: { threshold: 140, blur: 1, contrast: 1.35 } },
    { id: "far", options: { threshold: 135, brightness: 1.1, contrast: 1.3 } },
];

const LABEL_LINE_REGEX = /(NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS|KELAMIN|GOL|DARAH|ALAMAT|RT|RW|KELURAHAN|KEL\b|DESA|KECAMATAN|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)/i;

const cleanFieldValue = (value, options = {}) => {
    if (!value) return null;
    const cleaned = value
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
    if (!cleaned) return null;
    if (options.normalize) {
        return normalizeOCR(cleaned);
    }
    return cleaned;
};

const parseGenderValue = (value) => {
    if (!value) return null;
    const upper = value.toUpperCase();
    if (upper.includes("LAKI")) return "LAKI-LAKI";
    if (upper.includes("PEREMPUAN")) return "PEREMPUAN";
    return null;
};

const parseTtlValue = (value) => {
    if (!value) return { tempatLahir: null, tanggalLahir: null };
    const match = value.match(/(.+?)\s*,\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    if (match) {
        return {
            tempatLahir: cleanFieldValue(match[1], { normalize: true }),
            tanggalLahir: match[2],
        };
    }
    const dateMatch = value.match(/(\d{2}[-\/]\d{2}[-\/]\d{4})/);
    if (!dateMatch) {
        return { tempatLahir: cleanFieldValue(value, { normalize: true }), tanggalLahir: null };
    }
    const tanggalLahir = dateMatch[1];
    const tempatLahir = value.replace(dateMatch[1], "").replace(/[,\s]+$/g, "");
    return {
        tempatLahir: cleanFieldValue(tempatLahir, { normalize: true }),
        tanggalLahir,
    };
};

const parseRtRwValue = (value) => {
    if (!value) return { rt: null, rw: null };
    const match = value.match(/(\d{1,3})\s*\/\s*(\d{1,3})/);
    if (match) {
        return { rt: match[1], rw: match[2] };
    }
    const altMatch = value.match(/RT\s*[:.]?\s*(\d{1,3})\s*RW\s*[:.]?\s*(\d{1,3})/i);
    if (altMatch) {
        return { rt: altMatch[1], rw: altMatch[2] };
    }
    return { rt: null, rw: null };
};

const stripAfterLabel = (value, regex) => {
    if (!value) return null;
    const index = value.search(regex);
    if (index === -1) return value;
    return value.slice(0, index).trim();
};

const LEADING_LABEL_REGEX = /^(?:NIK|NAMA|TEMPAT\/?T?G?L?\s*LAHIR|TGL\s*LAHIR|JENIS\s+KELAMIN|ALAMAT|RT\s*\/?\s*RW|KELURAHAN|KEL\b|DESA|KECAMATAN|AGAMA|STATUS\s+PERKAW[I1]NAN|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA)\s*[:.-]?\s*/i;

const stripLeadingLabel = (value) => {
    if (!value) return null;
    return value.replace(LEADING_LABEL_REGEX, "").trim();
};

const parseFieldsFromLines = (rawText) => {
    if (!rawText) return {};
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => ({ raw: line, label: normalizeLabel(line) }));
    if (!lines.length) return {};

    const isLabelLine = (line) => LABEL_LINE_REGEX.test(line.label);

    const extractAfterSeparator = (line) => {
        const match = line.match(/[:.-]\s*(.*)/);
        return match?.[1]?.trim() || null;
    };

    const findValue = (regex, options = {}) => {
        const {
            allowNextLine = false,
            allowPrevLine = false,
            multiline = false,
            group = 1,
            labelRegex,
            valueValidator,
        } = options;

        const isValid = (value) => {
            if (!value) return false;
            if (typeof valueValidator === "function") {
                return valueValidator(value);
            }
            return true;
        };

        for (let i = 0; i < lines.length; i += 1) {
            const line = lines[i];
            const match = line.raw.match(regex);
            const isLabelMatch = Boolean(match) || (labelRegex && line.label.match(labelRegex));
            if (!isLabelMatch) {
                continue;
            }

            if (match) {
                const directValue = (match[group] || "").trim();
                if (directValue && isValid(directValue)) {
                    return directValue;
                }
            }

            const separatedValue = extractAfterSeparator(line.raw);
            if (separatedValue && isValid(separatedValue)) {
                return separatedValue;
            }

            if (allowPrevLine) {
                const prevLine = lines[i - 1];
                if (prevLine && prevLine.raw && !isLabelLine(prevLine)) {
                    if (isValid(prevLine.raw)) {
                        return prevLine.raw;
                    }
                }
            }

            if (!allowNextLine) return null;

            const parts = [];
            for (let j = i + 1; j < lines.length; j += 1) {
                const nextLine = lines[j];
                if (!nextLine.raw) continue;
                if (isLabelLine(nextLine)) break;
                if (multiline) {
                    parts.push(nextLine.raw);
                    const combined = parts.join(" ").trim();
                    if (isValid(combined)) {
                        return combined;
                    }
                } else if (isValid(nextLine.raw)) {
                    return nextLine.raw;
                }
            }
            return null;
        }
        return null;
    };

    const result = {};

    const nikValue = findValue(/N[I1]K\s*[:.-]?\s*(.*)/i, { allowNextLine: true, labelRegex: /NIK/i });
    if (nikValue) {
        const digits = toDigits(nikValue);
        if (digits.length >= 16) {
            result.nikKTP = digits.slice(0, 16);
        }
    }

    const nama = findValue(/NAMA\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        allowPrevLine: true,
        labelRegex: /NAMA/i,
        valueValidator: isLikelyNameValue,
    });
    if (nama) result.namaLengkap = cleanFieldValue(nama, { normalize: true });

    const ttlValue = findValue(/TEMPAT\/?T?G?L?\s*LAHIR\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        allowPrevLine: true,
        labelRegex: /(TEMPAT|TGL|TG1|TGI|LAHIR)/i,
        valueValidator: isLikelyDateValue,
    });
    if (ttlValue) {
        const ttlParsed = parseTtlValue(ttlValue);
        if (ttlParsed.tempatLahir) result.tempatLahir = ttlParsed.tempatLahir;
        if (ttlParsed.tanggalLahir) result.tanggalLahir = ttlParsed.tanggalLahir;
    }

    const genderValue = findValue(/JENIS\s+KELAMIN\s*[:.-]?\s*(.*)/i, { allowNextLine: true, labelRegex: /JENIS\s+KELAMIN/i });
    const cleanedGender = stripAfterLabel(genderValue, /GOL\s*\.?\s*DARAH/i);
    const genderParsed = parseGenderValue(cleanedGender || rawText);
    if (genderParsed) result.jenisKelamin = genderParsed;

    const agama = findValue(/AGAMA\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /AGAMA/i,
        valueValidator: isLikelyReligionValue,
    });
    if (agama) result.agama = cleanFieldValue(agama, { normalize: true });

    const status = findValue(/STATUS\s+PERKAW[I1]NAN\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /(STATUS|PERKAW)/i,
        valueValidator: isLikelyStatusValue,
    });
    if (status) {
        const cleanedStatus = stripAfterLabel(status, /(PEKERJAAN|KEWARGANEGARAAN)/i);
        result.statusPerkawinan = cleanFieldValue(cleanedStatus, { normalize: true });
    }

    const alamat = findValue(/ALAMAT\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        multiline: true,
        labelRegex: /ALAMAT/i,
        valueValidator: isLikelyAddressValue,
    });
    if (alamat) {
        const cleanedAlamat = stripAfterLabel(alamat, /RT\s*\/?\s*RW/i);
        result.alamatLengkap = cleanFieldValue(cleanedAlamat);
    }

    const rtRwValue = findValue(/RT\s*\/?\s*RW\s*[:.-]?\s*(.*)/i, { allowNextLine: true, labelRegex: /RT|RW/i });
    if (rtRwValue) {
        const rtRw = parseRtRwValue(rtRwValue);
        if (rtRw.rt) result.rt = rtRw.rt;
        if (rtRw.rw) result.rw = rtRw.rw;
    }

    const desa = findValue(/(?:KELURAHAN|KEL\b|DESA)\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /(KELURAHAN|KEL\b|DESA)/i,
        valueValidator: isLikelyRegionValue,
    });
    if (desa) result.desaKelurahan = cleanFieldValue(desa, { normalize: true });

    const kecamatan = findValue(/KECAMATAN\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /KECAMATAN/i,
        valueValidator: isLikelyRegionValue,
    });
    if (kecamatan) result.kecamatan = cleanFieldValue(kecamatan, { normalize: true });

    const kabupaten = findValue(/(?:KABUPATEN|KOTA)\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /(KABUPATEN|KOTA)/i,
        valueValidator: isLikelyRegionValue,
    });
    if (kabupaten) result.kabupaten = cleanFieldValue(kabupaten, { normalize: true });

    const provinsi = findValue(/PROVINSI\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /PROVINSI/i,
        valueValidator: isLikelyRegionValue,
    });
    if (provinsi) result.provinsi = cleanFieldValue(provinsi, { normalize: true });

    const pekerjaan = findValue(/PEKERJAAN\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /PEKERJAAN/i,
        valueValidator: isLikelyJobValue,
    });
    if (pekerjaan) {
        const cleanedPekerjaan = stripAfterLabel(pekerjaan, /KEWARGANEGARAAN/i);
        result.jenispekerjaan = cleanFieldValue(cleanedPekerjaan, { normalize: true });
    }

    const kewarganegaraan = findValue(/KEWARGANEGARAAN\s*[:.-]?\s*(.*)/i, {
        allowNextLine: true,
        labelRegex: /KEWARGANEGARAAN/i,
        valueValidator: isLikelyNationalityValue,
    });
    if (kewarganegaraan) result.kewarganegaraan = cleanFieldValue(kewarganegaraan, { normalize: true });

    return result;
};

const FLAT_STOP_LABELS = "(?:NIK|NAMA|TEMPAT|TGL|LAHIR|JENIS\\s*KELAMIN|GOL\\.?\\s*DARAH|ALAMAT|RT\\s*\\/?\\s*RW|KELURAHAN|KEL\\b|DESA|KECAMATAN|AGAMA|STATUS\\s*PERKAW[I1]NAN|PEKERJAAN|KEWARGANEGARAAN|PROVINSI|KABUPATEN|KOTA|BERLAKU)";

const parseFieldsFromFlatText = (rawText) => {
    if (!rawText) return {};
    const flatText = rawText.replace(/\r?\n/g, " ").replace(/\s{2,}/g, " ").trim();
    if (!flatText) return {};

    const extractFlatValue = (labelPattern) => {
        const regex = new RegExp(`${labelPattern}\\s*[:.-]?\\s*(.+?)(?=\\s*${FLAT_STOP_LABELS}|$)`, "i");
        return flatText.match(regex)?.[1]?.trim() || null;
    };

    const result = {};

    const nikValue = extractFlatValue("N[I1]K");
    if (nikValue) {
        const digits = toDigits(nikValue);
        if (digits.length >= 16) {
            result.nikKTP = digits.slice(0, 16);
        }
    }

    const nama = extractFlatValue("NAMA");
    if (nama && isLikelyNameValue(nama)) {
        result.namaLengkap = cleanFieldValue(nama, { normalize: true });
    }

    const ttlValue = extractFlatValue("TEMPAT\\/?T?G?L?\\s*LAHIR|TGL\\s*LAHIR");
    if (ttlValue && isLikelyDateValue(ttlValue)) {
        const ttlParsed = parseTtlValue(ttlValue);
        if (ttlParsed.tempatLahir) result.tempatLahir = ttlParsed.tempatLahir;
        if (ttlParsed.tanggalLahir) result.tanggalLahir = ttlParsed.tanggalLahir;
    }

    const genderValue = extractFlatValue("JENIS\\s+KELAMIN");
    const cleanedGender = stripAfterLabel(genderValue, /GOL\s*\.?\s*DARAH/i);
    const genderParsed = parseGenderValue(cleanedGender || rawText);
    if (genderParsed) result.jenisKelamin = genderParsed;

    const agama = extractFlatValue("AGAMA");
    if (agama && isLikelyReligionValue(agama)) {
        result.agama = cleanFieldValue(agama, { normalize: true });
    }

    const status = extractFlatValue("STATUS\\s+PERKAW[I1]NAN");
    if (status && isLikelyStatusValue(status)) {
        const cleanedStatus = stripAfterLabel(status, /(PEKERJAAN|KEWARGANEGARAAN)/i);
        result.statusPerkawinan = cleanFieldValue(cleanedStatus, { normalize: true });
    }

    const alamat = extractFlatValue("ALAMAT");
    if (alamat && isLikelyAddressValue(alamat)) {
        const cleanedAlamat = stripAfterLabel(alamat, /RT\s*\/?\s*RW/i);
        result.alamatLengkap = cleanFieldValue(cleanedAlamat);
    }

    const rtRwValue = extractFlatValue("RT\\s*\\/?\\s*RW");
    if (rtRwValue) {
        const rtRw = parseRtRwValue(rtRwValue);
        if (rtRw.rt) result.rt = rtRw.rt;
        if (rtRw.rw) result.rw = rtRw.rw;
    }

    const desa = extractFlatValue("KELURAHAN|KEL\\b|DESA");
    if (desa && isLikelyRegionValue(desa)) {
        result.desaKelurahan = cleanFieldValue(desa, { normalize: true });
    }

    const kecamatan = extractFlatValue("KECAMATAN");
    if (kecamatan && isLikelyRegionValue(kecamatan)) {
        result.kecamatan = cleanFieldValue(kecamatan, { normalize: true });
    }

    const kabupaten = extractFlatValue("KABUPATEN|KOTA");
    if (kabupaten && isLikelyRegionValue(kabupaten)) {
        result.kabupaten = cleanFieldValue(kabupaten, { normalize: true });
    }

    const provinsi = extractFlatValue("PROVINSI");
    if (provinsi && isLikelyRegionValue(provinsi)) {
        result.provinsi = cleanFieldValue(provinsi, { normalize: true });
    }

    const pekerjaan = extractFlatValue("PEKERJAAN");
    if (pekerjaan && isLikelyJobValue(pekerjaan)) {
        const cleanedPekerjaan = stripAfterLabel(pekerjaan, /KEWARGANEGARAAN/i);
        result.jenispekerjaan = cleanFieldValue(cleanedPekerjaan, { normalize: true });
    }

    const kewarganegaraan = extractFlatValue("KEWARGANEGARAAN");
    if (kewarganegaraan && isLikelyNationalityValue(kewarganegaraan)) {
        result.kewarganegaraan = cleanFieldValue(kewarganegaraan, { normalize: true });
    }

    return result;
};

const RELIGION_VALUES = [
    "ISLAM",
    "KRISTEN",
    "KATOLIK",
    "KATHOLIK",
    "HINDU",
    "BUDDHA",
    "BUDHA",
    "KONGHUCU",
    "KHONGHUCU",
];

const MARITAL_STATUS_VALUES = [
    "BELUM KAWIN",
    "CERAI HIDUP",
    "CERAI MATI",
    "KAWIN",
    "DUDA",
    "JANDA",
];

const inferFromHeuristics = (result, rawText) => {
    if (!rawText) return;
    const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const labeledLines = lines.map((line) => ({ raw: line, label: normalizeLabel(line) }));
    const upperText = normalizeOCR(rawText);

    const isLabelLine = (line) => LABEL_LINE_REGEX.test(line.label);
    const pickLineValue = (line) => stripLeadingLabel(line.split(/[:.-]/).slice(1).join(" ").trim() || line);
    const findLineIndex = (regex) => labeledLines.findIndex((line) => regex.test(line.raw) || regex.test(line.label));

    const dateRegex = /\b\d{2}[-\/]\d{2}[-\/]\d{4}\b/;
    if (!result.tanggalLahir) {
        const dateMatch = rawText.match(dateRegex);
        if (dateMatch) {
            result.tanggalLahir = dateMatch[0];
        }
    }

    if (!result.tempatLahir) {
        const dateLine = labeledLines.find((line) => dateRegex.test(line.raw));
        if (dateLine) {
            const ttlParsed = parseTtlValue(pickLineValue(dateLine.raw));
            if (ttlParsed.tempatLahir && isLikelyNameValue(ttlParsed.tempatLahir)) {
                result.tempatLahir = ttlParsed.tempatLahir;
            }
            if (!result.tanggalLahir && ttlParsed.tanggalLahir) result.tanggalLahir = ttlParsed.tanggalLahir;
        }
    }

    if (!result.rt || !result.rw) {
        const rtRwMatch = rawText.match(/\b(\d{1,3})\s*\/\s*(\d{1,3})\b/);
        if (rtRwMatch) {
            if (!result.rt) result.rt = rtRwMatch[1];
            if (!result.rw) result.rw = rtRwMatch[2];
        }
    }

    let rtIndex = -1;
    if (!result.alamatLengkap || !result.desaKelurahan || !result.kecamatan) {
        rtIndex = findLineIndex(/RT\s*\/?\s*RW/i);
        if (rtIndex === -1) {
            rtIndex = labeledLines.findIndex((line) => /\b\d{1,3}\s*\/\s*\d{1,3}\b/.test(line.raw));
        }
    }

    if (!result.alamatLengkap) {
        const alamatIndex = findLineIndex(/ALAMAT/i);
        if (alamatIndex >= 0) {
            const cleanedAlamat = stripAfterLabel(pickLineValue(labeledLines[alamatIndex].raw), /RT\s*\/?\s*RW/i);
            if (isLikelyAddressValue(cleanedAlamat)) {
                result.alamatLengkap = cleanFieldValue(cleanedAlamat);
            }
        }
        if (!result.alamatLengkap && rtIndex > 0) {
            const candidate = labeledLines[rtIndex - 1];
            if (candidate && !isLabelLine(candidate)) {
                if (isLikelyAddressValue(candidate.raw)) {
                    result.alamatLengkap = cleanFieldValue(candidate.raw);
                }
            }
        }
    }

    if (!result.desaKelurahan) {
        const desaIndex = findLineIndex(/KELURAHAN|KEL\b|DESA/i);
        if (desaIndex >= 0) {
            const value = pickLineValue(labeledLines[desaIndex].raw);
            if (isLikelyRegionValue(value)) {
                result.desaKelurahan = cleanFieldValue(value, { normalize: true });
            }
        } else if (rtIndex >= 0 && labeledLines[rtIndex + 1] && !isLabelLine(labeledLines[rtIndex + 1])) {
            const value = labeledLines[rtIndex + 1].raw;
            if (isLikelyRegionValue(value)) {
                result.desaKelurahan = cleanFieldValue(value, { normalize: true });
            }
        }
    }

    if (!result.kecamatan) {
        const kecIndex = findLineIndex(/KECAMATAN/i);
        if (kecIndex >= 0) {
            const value = pickLineValue(labeledLines[kecIndex].raw);
            if (isLikelyRegionValue(value)) {
                result.kecamatan = cleanFieldValue(value, { normalize: true });
            }
        } else {
            const desaIndex = findLineIndex(/KELURAHAN|KEL\b|DESA/i);
            if (desaIndex >= 0 && labeledLines[desaIndex + 1] && !isLabelLine(labeledLines[desaIndex + 1])) {
                const value = labeledLines[desaIndex + 1].raw;
                if (isLikelyRegionValue(value)) {
                    result.kecamatan = cleanFieldValue(value, { normalize: true });
                }
            }
        }
    }

    if (!result.kabupaten) {
        const kabIndex = findLineIndex(/KABUPATEN|KOTA/i);
        if (kabIndex >= 0) {
            const value = pickLineValue(labeledLines[kabIndex].raw);
            if (isLikelyRegionValue(value)) {
                result.kabupaten = cleanFieldValue(value, { normalize: true });
            }
        }
    }

    if (!result.provinsi) {
        const provIndex = findLineIndex(/PROVINSI/i);
        if (provIndex >= 0) {
            const value = pickLineValue(labeledLines[provIndex].raw);
            if (isLikelyRegionValue(value)) {
                result.provinsi = cleanFieldValue(value, { normalize: true });
            }
        }
    }

    if (!result.agama) {
        const agamaValue = RELIGION_VALUES.find((value) => upperText.includes(value));
        if (agamaValue) result.agama = agamaValue;
    }

    if (!result.statusPerkawinan) {
        const statusValue = MARITAL_STATUS_VALUES.find((value) => upperText.includes(value));
        if (statusValue) result.statusPerkawinan = statusValue;
    }

    if (!result.kewarganegaraan) {
        if (/\bWNI\b/.test(upperText)) result.kewarganegaraan = "WNI";
        if (/\bWNA\b/.test(upperText)) result.kewarganegaraan = "WNA";
    }

    if (!result.jenispekerjaan) {
        const pekerjaanIndex = findLineIndex(/PEKERJAAN/i);
        if (pekerjaanIndex >= 0) {
            const value = pickLineValue(labeledLines[pekerjaanIndex].raw);
            if (isLikelyJobValue(value)) {
                result.jenispekerjaan = cleanFieldValue(value, { normalize: true });
            }
        } else {
            const statusIndex = findLineIndex(/STATUS|PERKAW/i);
            const kewIndex = findLineIndex(/KEWARGANEGARAAN|WNI|WNA/i);
            const start = statusIndex >= 0 ? statusIndex + 1 : 0;
            const end = kewIndex > start ? kewIndex : labeledLines.length;
            for (let i = start; i < end; i += 1) {
                const candidate = labeledLines[i];
                if (!candidate || isLabelLine(candidate)) continue;
                if (/[A-Z]{3,}/i.test(candidate.raw)) {
                    if (isLikelyJobValue(candidate.raw)) {
                        result.jenispekerjaan = cleanFieldValue(candidate.raw, { normalize: true });
                        break;
                    }
                }
            }
        }
    }
};

const fillMissingFields = (target, source) => {
    if (!target || !source) return;
    for (const [key, value] of Object.entries(source)) {
        if (key.startsWith("_")) continue;
        if (!value) continue;
        if (!target[key] || shouldReplaceField(key, target[key], value)) {
            target[key] = value;
        }
    }
};

const parseFromRawText = (rawText, confidence) => {
    const text = normalizeText(rawText);
    const match = (regex) => text.match(regex)?.[1]?.trim() || null;

    const nikKTP = extractNik(rawText);
    const namaLengkap = text.match(/NAMA\s*:?\s*([^\r\n]+)/i)?.[1]?.trim() || null;
    const ttl = rawText.match(
        /Tempat\/?Tg[il]\s*Lahir\s*:?\s*([^\r\n,]+)\s*,\s*(\d{2}[-\/]\d{2}[-\/]\d{4})/i
    );
    const tempatLahir = ttl?.[1]?.trim() || null;
    const tanggalLahir = ttl?.[2]?.trim() || null;
    const jenisKelamin = text.includes("LAKI")
        ? "LAKI-LAKI"
        : text.includes("PEREMPUAN")
        ? "PEREMPUAN"
        : null;
    const agama = match(/AGAMA\s*:?\s*([A-Z]+)/);

    const statusPerkawinan = rawText.match(
        /STATUS\s*PERKAW[I1]NAN\s*\.?\s*:?\s*([^\r\n]+)(?=\n\s*PEKERJAAN|\n\s*KEWARGANEGARAAN|$)/i
    )?.[1]?.trim().replace(/\.+$/, "") || null;

    const alamatMatch = rawText.match(/ALAMAT\s*:?\s*([\s\S]*?)\n\s*RT\s*\/?\s*RW/i);
    const alamatLengkap = alamatMatch?.[1]?.trim() || null;

    const rtMatch = rawText.match(/RT\s*\/?\s*RW\s*:?\s*(\d{1,3})\s*\/\s*(\d{1,3})/i);
    const rt = rtMatch?.[1] || null;
    const rw = rtMatch?.[2] || null;

    const desaMatch = rawText.match(/(?:KEL|KELURAHAN|DESA)\s*:?\s*([^\r\n]+)(?=\n\s*KECAMATAN|\n\s*KEC)/i);
    const desaKelurahan = desaMatch?.[1]?.trim() || null;

    const kecamatan = rawText.match(/KECAMATAN\s*:?\s*([^\r\n]+)(?=\n|AGAMA|STATUS|PEKERJAAN)/i)?.[1]?.trim() || null;
    const kabupatenMatch = rawText.match(
        /KABUPATEN\s*\/?\s*KOTA\s*:?\s*([^\r\n]+)(?=\n|PROVINSI|NIK)/i
    ) || rawText.match(/(?:KABUPATEN|KOTA)\s*:?\s*([^\r\n]+)(?=\n|PROVINSI|NIK)/i);
    const kabupaten = kabupatenMatch?.[1]?.trim() || null;
    const provinsiMatch = rawText.match(/PROVINSI\s*:?\s*([^\r\n]+)(?=\n(?:KABUPATEN|KOTA)|\nNIK|$)/i);
    const provinsi = provinsiMatch?.[1]?.trim() || null;

    const pekerjaanMatch = rawText.match(/Pekerjaan\s*[:.]?\s*([^\r\n]+?)(?=\nKewarganegaraan|\r\nKewarganegaraan|$)/i);
    let jenispekerjaan = pekerjaanMatch?.[1]?.trim() || null;

    if (jenispekerjaan) {
        const parts = jenispekerjaan.split(" ");
        if (parts.length > 1) {
            parts.pop();
            jenispekerjaan = parts.join(" ");
        }
    }

    const kewarganegaraanMatch = rawText.match(/Kewarganegaraan\s*[:.]?\s*([^\r\n]+)/i);
    const kewarganegaraan = kewarganegaraanMatch?.[1]?.trim() || null;

    const baseResult = sanitizeParsedFields({
        nikKTP,
        namaLengkap,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        agama,
        statusPerkawinan,
        alamatLengkap,
        rt,
        rw,
        desaKelurahan,
        kecamatan,
        kabupaten,
        provinsi,
        jenispekerjaan,
        kewarganegaraan,
        _rawText: rawText,
        _confidence: confidence,
    });

    fillMissingFields(baseResult, parseFieldsFromLines(rawText));
    fillMissingFields(baseResult, parseFieldsFromFlatText(rawText));
    inferFromHeuristics(baseResult, rawText);

    return sanitizeParsedFields(baseResult);
};

const findBrightBounds = (data, width, height) => {
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    let count = 0;

    for (let y = 0; y < height; y += 1) {
        const rowOffset = y * width;
        for (let x = 0; x < width; x += 1) {
            if (data[rowOffset + x] > 0) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                count += 1;
            }
        }
    }

    const minForeground = Math.floor(width * height * OCR_MIN_FOREGROUND_RATIO);
    if (count < minForeground) {
        return null;
    }

    return {
        minX,
        minY,
        maxX,
        maxY,
    };
};

const autoCropKtp = async (imageBuffer) => {
    const metadata = await sharp(imageBuffer).metadata();
    if (!metadata.width || !metadata.height) return null;

    const previewWidth = Math.min(metadata.width, OCR_PREVIEW_WIDTH);
    const { data, info } = await sharp(imageBuffer)
        .resize({ width: previewWidth, withoutEnlargement: true })
        .grayscale()
        .blur(1)
        .normalize()
        .threshold(OCR_BRIGHT_THRESHOLD)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const bounds = findBrightBounds(data, info.width, info.height);
    if (!bounds) return null;

    const cropWidth = bounds.maxX - bounds.minX + 1;
    const cropHeight = bounds.maxY - bounds.minY + 1;
    const minRatio = OCR_MIN_CROP_RATIO;
    const maxRatio = OCR_MAX_CROP_RATIO;
    if (cropWidth < info.width * minRatio || cropHeight < info.height * minRatio) {
        return null;
    }
    if (cropWidth > info.width * maxRatio && cropHeight > info.height * maxRatio) {
        return null;
    }

    const scaleX = metadata.width / info.width;
    const scaleY = metadata.height / info.height;
    let left = Math.floor(bounds.minX * scaleX);
    let top = Math.floor(bounds.minY * scaleY);
    let right = Math.ceil((bounds.maxX + 1) * scaleX);
    let bottom = Math.ceil((bounds.maxY + 1) * scaleY);

    const padX = Math.round((right - left) * 0.04);
    const padY = Math.round((bottom - top) * 0.04);
    left = Math.max(0, left - padX);
    top = Math.max(0, top - padY);
    right = Math.min(metadata.width, right + padX);
    bottom = Math.min(metadata.height, bottom + padY);

    const width = right - left;
    const height = bottom - top;
    if (width <= 0 || height <= 0) return null;
    if (width >= metadata.width && height >= metadata.height) return null;

    return sharp(imageBuffer).extract({ left, top, width, height }).toBuffer();
};

const tryTrim = async (imageBuffer) => {
    try {
        return await sharp(imageBuffer).trim(OCR_TRIM_THRESHOLD).toBuffer();
    } catch {
        return null;
    }
};

const extractNik = (rawText) => {
    if (!rawText) return null;

    const nikBlock = rawText.match(/N[I1]K[^0-9A-Z]{0,12}([0-9A-Z\s]{10,24})/i)?.[1];
    if (nikBlock) {
        const normalized = toDigits(nikBlock);
        if (normalized.length >= 16) {
            return normalized.slice(0, 16);
        }
    }

    const digits = toDigits(rawText);
    if (digits.length >= 16) {
        return digits.slice(0, 16);
    }

    return null;
};

const parseOcrPayload = (payload) => {
    const parsedText = payload?.ParsedResults?.[0]?.ParsedText || "";
    const overlayLines = payload?.ParsedResults?.[0]?.TextOverlay?.Lines;
    const overlayText = Array.isArray(overlayLines) && overlayLines.length
        ? overlayLines
            .map((line) => line.LineText || line.Words?.map((word) => word.WordText).join(" "))
            .filter(Boolean)
            .join("\n")
        : "";

    const meanConfidence = Number(payload?.ParsedResults?.[0]?.MeanConfidence);
    const confidence = Number.isFinite(meanConfidence) ? meanConfidence : undefined;

    const primaryText = overlayText || parsedText;
    const baseResult = parseFromRawText(primaryText, confidence);

    if (overlayText && parsedText && overlayText !== parsedText) {
        const altResult = parseFromRawText(parsedText, confidence);
        fillMissingFields(baseResult, altResult);
        if (altResult._rawText && (!baseResult._rawText || altResult._rawText.length > baseResult._rawText.length)) {
            baseResult._rawText = altResult._rawText;
        }
        if (altResult._confidence !== undefined && (baseResult._confidence === undefined || altResult._confidence > baseResult._confidence)) {
            baseResult._confidence = altResult._confidence;
        }
    }

    return baseResult;
};

const SCORE_FIELDS = [
    "nikKTP",
    "namaLengkap",
    "tempatLahir",
    "tanggalLahir",
    "jenisKelamin",
    "agama",
    "statusPerkawinan",
    "alamatLengkap",
    "rt",
    "rw",
    "desaKelurahan",
    "kecamatan",
    "kabupaten",
    "provinsi",
    "jenispekerjaan",
    "kewarganegaraan",
];

const scoreOcrResult = (result) => {
    if (!result) return 0;
    let score = 0;
    for (const key of SCORE_FIELDS) {
        if (result[key]) score += 1;
    }
    if (result.nikKTP) score += 3;
    if (result._rawText) score += Math.min(5, Math.floor(result._rawText.length / 120));
    return score;
};

const getMissingFields = (result) => OCR_REQUIRED_FIELDS.filter((field) => !result?.[field]);

const isComplete = (result) => getMissingFields(result).length === 0;

const mergeResults = (base, incoming) => {
    if (!incoming) return base;
    if (!base) return { ...incoming };

    const merged = { ...base };
    for (const [key, value] of Object.entries(incoming)) {
        if (key.startsWith("_")) continue;
        if (!value) continue;
        if (!merged[key] || shouldReplaceField(key, merged[key], value)) {
            merged[key] = value;
        }
    }

    if (incoming._rawText && (!merged._rawText || incoming._rawText.length > merged._rawText.length)) {
        merged._rawText = incoming._rawText;
    }
    if (incoming._confidence !== undefined && (merged._confidence === undefined || incoming._confidence > merged._confidence)) {
        merged._confidence = incoming._confidence;
    }

    return merged;
};

const isGoodEnough = (result, score) => {
    if (!result?.nikKTP) return false;
    const hasCore = Boolean(
        result.namaLengkap ||
        result.tanggalLahir ||
        result.alamatLengkap ||
        result.tempatLahir
    );
    return hasCore && score >= OCR_MIN_SCORE;
};

const isSmallerThanBase = async (candidateBuffer, baseMeta) => {
    if (!candidateBuffer || !baseMeta?.width || !baseMeta?.height) return false;
    const meta = await sharp(candidateBuffer).metadata();
    if (!meta.width || !meta.height) return false;
    return meta.width < baseMeta.width - 10 || meta.height < baseMeta.height - 10;
};

const buildCandidates = async (rotatedBuffer) => {
    const candidates = [];
    const baseMeta = await sharp(rotatedBuffer).metadata();
    const baseHasSize = Boolean(baseMeta?.width && baseMeta?.height);
    const cropped = await autoCropKtp(rotatedBuffer);
    if (cropped && (!baseHasSize || await isSmallerThanBase(cropped, baseMeta))) {
        candidates.push({ label: "crop", buffer: cropped });
    }
    const trimmed = await tryTrim(rotatedBuffer);
    if (trimmed && (!baseHasSize || await isSmallerThanBase(trimmed, baseMeta))) {
        candidates.push({ label: "trim", buffer: trimmed });
    }
    candidates.push({ label: "base", buffer: rotatedBuffer });
    return candidates;
};

const resolvePresetOptions = async (candidateBuffer, preset) => {
    if (!preset?.options) return {};
    if (typeof preset.options === "function") {
        return await preset.options(candidateBuffer);
    }
    return preset.options;
};

const runOcrPreset = async (candidateBuffer, preset) => {
    const options = await resolvePresetOptions(candidateBuffer, preset);
    const processedImage = await preprocessForOcr(candidateBuffer, options);
    const payload = await requestOcrWithFallback(processedImage);
    const parsed = parseOcrPayload(payload);
    const score = scoreOcrResult(parsed);
    return { parsed, score };
};

export const scanKTP = async (imageInput) => {
    const rotatedBuffer = await sharp(imageInput).rotate().toBuffer();
    const candidates = await buildCandidates(rotatedBuffer);

    let best = null;
    let bestScore = -1;
    let bestBuffer = null;
    let merged = null;

    const updateBest = (parsed, score, buffer) => {
        if (score > bestScore) {
            best = parsed;
            bestScore = score;
            bestBuffer = buffer;
        }
    };

    const handleResult = (parsed, score, buffer) => {
        updateBest(parsed, score, buffer);
        merged = mergeResults(merged, parsed);
        if (isComplete(parsed)) {
            parsed._missingFields = [];
            parsed._isComplete = true;
            return parsed;
        }
        if (isComplete(merged)) {
            merged._missingFields = [];
            merged._isComplete = true;
            return merged;
        }
        return null;
    };

    for (const candidate of candidates) {
        for (const preset of OCR_PRESETS_PRIMARY) {
            const result = await runOcrPreset(candidate.buffer, preset);
            const done = handleResult(result.parsed, result.score, candidate.buffer);
            if (done) return done;
        }
    }

    if (bestBuffer && (!best || !isGoodEnough(best, bestScore) || !isComplete(merged))) {
        for (const preset of OCR_PRESETS_SECONDARY) {
            const result = await runOcrPreset(bestBuffer, preset);
            const done = handleResult(result.parsed, result.score, bestBuffer);
            if (done) return done;
        }
    }

    if (!isComplete(merged)) {
        for (const candidate of candidates) {
            if (bestBuffer && candidate.buffer === bestBuffer) continue;
            for (const preset of OCR_PRESETS_SECONDARY) {
                const result = await runOcrPreset(candidate.buffer, preset);
                const done = handleResult(result.parsed, result.score, candidate.buffer);
                if (done) return done;
            }
        }
    }

    const finalResult = merged || best || parseOcrPayload({ ParsedResults: [{ ParsedText: "" }] });
    finalResult._missingFields = getMissingFields(finalResult);
    finalResult._isComplete = finalResult._missingFields.length === 0;
    return finalResult;
};
