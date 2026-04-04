const fs = require("fs");
const path = require("path");
const {
  buildSummaryMessage,
  buildTextReport,
  createPrismaClient,
  fetchReportData,
  formatDate,
  getAcademicYearClosedRange,
  getCurrentMarchToDateRange,
  loadEnvFromDotEnv,
  sendTelegramMessage,
  sendTelegramReport,
} = require("./report-utils.cjs");

const OFFSET_FILE_PATH = "/var/lib/escala-medica/telegram-offset.json";
const POLL_TIMEOUT_SECONDS = 50;
const ERROR_RETRY_DELAY_MS = 5000;

function ensureStateDirectory() {
  fs.mkdirSync(path.dirname(OFFSET_FILE_PATH), { recursive: true });
}

function readOffset() {
  try {
    const content = fs.readFileSync(OFFSET_FILE_PATH, "utf8");
    const parsed = JSON.parse(content);
    return Number.isInteger(parsed.offset) ? parsed.offset : null;
  } catch {
    return null;
  }
}

function writeOffset(offset) {
  ensureStateDirectory();
  fs.writeFileSync(OFFSET_FILE_PATH, JSON.stringify({ offset }), "utf8");
}

function parseCommand(text) {
  const normalized = text.trim();
  if (!normalized.startsWith("/")) {
    return null;
  }

  const [commandWithBot, ...args] = normalized.split(/\s+/);
  const command = commandWithBot.split("@")[0];
  return { command, args };
}

function buildHelpMessage() {
  return [
    "Comandos disponiveis:",
    "/relatorio_total - envia o relatorio do ciclo atual, de marco ate hoje",
    "/relatorio_total ANO - envia o relatorio fechado de 01/03/ANO ate o fim de fevereiro do ano seguinte",
    "Exemplo: /relatorio_total 2025",
  ].join("\n");
}

async function sendTotalReport({ token, chatId, prisma, yearArg }) {
  let range;
  let title;
  let fileName;

  if (yearArg) {
    const parsedYear = Number(yearArg);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 3000) {
      await sendTelegramMessage({
        token,
        chatId,
        text: "Ano invalido. Use /relatorio_total 2025, por exemplo.",
      });
      return;
    }

    range = getAcademicYearClosedRange(parsedYear);
    title = `Relatorio total de faltas e reposicoes (${formatDate(range.start)} a ${formatDate(range.end)})`;
    fileName = `relatorio-total-${parsedYear}-${parsedYear + 1}.txt`;
  } else {
    range = getCurrentMarchToDateRange(new Date());
    title = `Relatorio total de faltas e reposicoes (${formatDate(range.start)} a ${formatDate(range.end)})`;
    fileName = `relatorio-total-${range.start.getFullYear()}-${range.end.getFullYear()}.txt`;
  }

  const data = await fetchReportData(prisma, range);
  const reportText = buildTextReport({ start: range.start, end: range.end, ...data, title });
  const summaryMessage = buildSummaryMessage({ start: range.start, end: range.end, ...data, title });

  await sendTelegramReport({
    token,
    chatId,
    summaryMessage,
    reportText,
    fileName,
    caption: "Relatorio total completo em anexo",
  });
}

async function handleUpdate({ update, token, configuredChatId, prisma }) {
  const message = update.message || update.edited_message;
  if (!message || typeof message.text !== "string") {
    return;
  }

  const chatId = String(message.chat?.id || "");
  if (chatId !== String(configuredChatId)) {
    return;
  }

  const parsed = parseCommand(message.text);
  if (!parsed) {
    return;
  }

  if (parsed.command === "/relatorio_total") {
    await sendTotalReport({
      token,
      chatId,
      prisma,
      yearArg: parsed.args[0],
    });
    return;
  }

  await sendTelegramMessage({
    token,
    chatId,
    text: buildHelpMessage(),
  });
}

async function main() {
  loadEnvFromDotEnv();

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios para processar comandos do Telegram.");
  }

  const prisma = createPrismaClient();

  try {
    while (true) {
      try {
        const offset = readOffset();
        const url = new URL(`https://api.telegram.org/bot${token}/getUpdates`);
        if (offset !== null) {
          url.searchParams.set("offset", String(offset + 1));
        }
        url.searchParams.set("timeout", String(POLL_TIMEOUT_SECONDS));

        const response = await fetch(url);
        if (!response.ok) {
          const body = await response.text();
          throw new Error(`Falha ao consultar updates do Telegram: ${body}`);
        }

        const payload = await response.json();
        const updates = Array.isArray(payload.result) ? payload.result : [];
        if (updates.length === 0) {
          continue;
        }

        let lastProcessedOffset = offset;
        for (const update of updates) {
          await handleUpdate({ update, token, configuredChatId: chatId, prisma });
          lastProcessedOffset = update.update_id;
        }

        if (lastProcessedOffset !== null && lastProcessedOffset !== undefined) {
          writeOffset(lastProcessedOffset);
        }
      } catch (error) {
        console.error(error);
        await new Promise((resolve) => setTimeout(resolve, ERROR_RETRY_DELAY_MS));
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}