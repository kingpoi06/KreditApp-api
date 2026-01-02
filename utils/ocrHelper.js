const clean = (value) => {
  if (!value) return null;
  return value
    .replace(/\s{2,}/g, " ")
    .replace(/\b(RT|RW|KECAMATAN|AGAMA|PEKERJAAN|KEWARGANEGARAAN)\b.*/g, "")
    .trim();
};
