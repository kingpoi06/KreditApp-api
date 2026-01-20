const DEFAULT_BOT_NUMBER = "6282147354774";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_META_VERSION = "v20.0";
const DEFAULT_TEMPLATE_LANG = "id";

const BOT_NUMBER_RAW = process.env.WHATSAPP_BOT_NUMBER || DEFAULT_BOT_NUMBER;
const WHATSAPP_PROVIDER = (process.env.WHATSAPP_PROVIDER || "").toLowerCase();
const WHATSAPP_CLOUD_TOKEN = process.env.WHATSAPP_CLOUD_TOKEN;
const WHATSAPP_CLOUD_PHONE_ID = process.env.WHATSAPP_CLOUD_PHONE_ID;
const WHATSAPP_CLOUD_VERSION =
  process.env.WHATSAPP_CLOUD_API_VERSION || DEFAULT_META_VERSION;
const WHATSAPP_CLOUD_TEMPLATE_NAME = process.env.WHATSAPP_CLOUD_TEMPLATE_NAME;
const WHATSAPP_CLOUD_TEMPLATE_LANG =
  process.env.WHATSAPP_CLOUD_TEMPLATE_LANG || DEFAULT_TEMPLATE_LANG;

const normalizePhoneNumber = (value) => {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
};

const BOT_NUMBER = normalizePhoneNumber(BOT_NUMBER_RAW);

const withTimeout = (timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
};

const sendViaGateway = async (to, message) => {
  const url = process.env.WHATSAPP_GATEWAY_URL;
  const token = process.env.WHATSAPP_GATEWAY_TOKEN;
  if (!url || !token) {
    throw new Error("WHATSAPP_GATEWAY_URL/WHATSAPP_GATEWAY_TOKEN belum diisi");
  }

  const payload = {
    sender: BOT_NUMBER,
    to,
    message,
  };

  const timeout = Number.parseInt(
    process.env.WHATSAPP_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS),
    10
  );
  const { signal, cancel } = withTimeout(timeout);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `WhatsApp gateway error ${response.status}: ${text.slice(0, 200)}`
      );
    }

    return await response.json().catch(() => null);
  } finally {
    cancel();
  }
};

const buildMetaTextPayload = (to, message) => ({
  messaging_product: "whatsapp",
  to,
  type: "text",
  text: {
    body: message,
  },
});

const buildMetaTemplatePayload = ({
  to,
  templateName,
  templateLang,
  templateParams,
}) => {
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
    },
  };

  if (Array.isArray(templateParams) && templateParams.length > 0) {
    payload.template.components = [
      {
        type: "body",
        parameters: templateParams.map((value) => ({
          type: "text",
          text: String(value),
        })),
      },
    ];
  }

  return payload;
};

const sendViaMeta = async (to, message, options = {}) => {
  if (!WHATSAPP_CLOUD_TOKEN || !WHATSAPP_CLOUD_PHONE_ID) {
    throw new Error("WHATSAPP_CLOUD_TOKEN/WHATSAPP_CLOUD_PHONE_ID belum diisi");
  }

  const url = `https://graph.facebook.com/${WHATSAPP_CLOUD_VERSION}/${WHATSAPP_CLOUD_PHONE_ID}/messages`;
  const templateName = options.templateName || WHATSAPP_CLOUD_TEMPLATE_NAME;
  const templateLang = options.templateLang || WHATSAPP_CLOUD_TEMPLATE_LANG;
  const templateParams = options.templateParams;
  const payload = templateName
    ? buildMetaTemplatePayload({
        to,
        templateName,
        templateLang,
        templateParams,
      })
    : buildMetaTextPayload(to, message);

  const timeout = Number.parseInt(
    process.env.WHATSAPP_TIMEOUT_MS || String(DEFAULT_TIMEOUT_MS),
    10
  );
  const { signal, cancel } = withTimeout(timeout);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_CLOUD_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const raw = await response.text();
      let details = raw;
      try {
        const parsed = JSON.parse(raw);
        const error = parsed?.error;
        const code = error?.code ? ` code ${error.code}` : "";
        const messageText = error?.message || raw;
        details = `${messageText}${code}`;
      } catch {
        details = raw;
      }
      throw new Error(
        `WhatsApp Cloud API error ${response.status}: ${details.slice(0, 200)}`
      );
    }

    return await response.json().catch(() => null);
  } finally {
    cancel();
  }
};

const resolveProvider = () => {
  if (WHATSAPP_PROVIDER) return WHATSAPP_PROVIDER;
  if (WHATSAPP_CLOUD_TOKEN && WHATSAPP_CLOUD_PHONE_ID) return "meta";
  if (process.env.WHATSAPP_GATEWAY_URL) return "gateway";
  return "meta";
};

export const sendWhatsAppMessage = async (to, message, options = {}) => {
  const normalized = normalizePhoneNumber(to);
  if (!normalized) {
    return { ok: false, skipped: true, reason: "nomor tidak valid" };
  }

  const provider = resolveProvider();
  if (provider === "gateway") {
    await sendViaGateway(normalized, message);
    return { ok: true, provider, to: normalized };
  }
  if (provider === "meta") {
    await sendViaMeta(normalized, message, options);
    return { ok: true, provider, to: normalized };
  }

  throw new Error(`Provider WhatsApp tidak dikenal: ${provider}`);
};

export const sendWhatsAppBulk = async (recipients, message, options = {}) => {
  const result = {
    sent: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  for (const recipient of recipients) {
    try {
      const response = await sendWhatsAppMessage(recipient, message, options);
      if (response.skipped) {
        result.skipped += 1;
      } else {
        result.sent += 1;
      }
      result.details.push({ recipient, ...response });
    } catch (error) {
      result.failed += 1;
      result.details.push({
        recipient,
        ok: false,
        error: error?.message || "unknown error",
      });
    }
  }

  return result;
};
