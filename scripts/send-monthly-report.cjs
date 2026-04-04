const {
  buildSummaryMessage,
  buildTextReport,
  createPrismaClient,
  fetchReportData,
  getPreviousMonthRange,
  loadEnvFromDotEnv,
  sendTelegramReport,
} = require("./report-utils.cjs");

async function main() {
  loadEnvFromDotEnv();

  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    throw new Error("TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID são obrigatórios para enviar o relatório mensal.");
  }

  const prisma = createPrismaClient();
  const { start, end } = getPreviousMonthRange();

  try {
    const data = await fetchReportData(prisma, { start, end });
    const title = "Relatorio mensal de faltas e reposicoes";
    const reportText = buildTextReport({ start, end, ...data, title });
    const summaryMessage = buildSummaryMessage({ start, end, ...data, title });
    const fileName = `relatorio-faltas-${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}.txt`;

    await sendTelegramReport({
      token: telegramBotToken,
      chatId: telegramChatId,
      summaryMessage,
      reportText,
      fileName,
      caption: "Relatorio mensal completo em anexo",
    });

    console.log("Relatório mensal enviado via Telegram.");
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