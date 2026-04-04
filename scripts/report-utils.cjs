const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

function loadEnvFromDotEnv() {
  const envPath = path.join(__dirname, "..", ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    }),
  });
}

function formatLocation(location) {
  if (location === "REANIMACAO") return "Reanimação";
  if (location === "CRITICOS") return "Críticos";
  if (location === "MURICI") return "Murici";
  if (location === "AULA") return "Aula";
  if (location === "ESTAGIO_EXTERNO") return "Estágio externo";
  return "Outro";
}

function formatType(type) {
  if (type === "ATESTADO") return "Atestado";
  if (type === "SEM_JUSTIFICATIVA") return "Sem justificativa";
  return "Outra justificativa";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function getPreviousMonthRange(referenceDate = new Date()) {
  const start = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1, 0, 0, 0, 0);
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0, 23, 59, 59, 999);
  return { start, end };
}

function getAcademicYearClosedRange(startYear) {
  const start = new Date(startYear, 2, 1, 0, 0, 0, 0);
  const end = new Date(startYear + 1, 2, 0, 23, 59, 59, 999);
  return { start, end };
}

function getCurrentMarchToDateRange(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear();
  const marchThisYear = new Date(currentYear, 2, 1, 0, 0, 0, 0);
  const startYear = referenceDate >= marchThisYear ? currentYear - 1 : currentYear - 2;
  const start = new Date(startYear, 2, 1, 0, 0, 0, 0);
  const end = new Date(referenceDate);
  return { start, end };
}

async function fetchReportData(prisma, { start, end }) {
  const [residents, absences, makeups] = await Promise.all([
    prisma.resident.findMany({
      include: {
        absences: {
          where: { date: { gte: start, lte: end } },
          select: { hours: true },
        },
        makeups: {
          where: { date: { gte: start, lte: end } },
          select: { hours: true },
        },
      },
      orderBy: [{ pgyLevel: "desc" }, { name: "asc" }],
    }),
    prisma.absence.findMany({
      where: { date: { gte: start, lte: end } },
      include: { resident: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { resident: { name: "asc" } }],
    }),
    prisma.makeup.findMany({
      where: { date: { gte: start, lte: end } },
      include: { resident: { select: { name: true } } },
      orderBy: [{ date: "asc" }, { resident: { name: "asc" } }],
    }),
  ]);

  const summarizedResidents = residents.map((resident) => {
    const totalAbsenceHours = resident.absences.reduce((sum, absence) => sum + absence.hours, 0);
    const totalMakeupHours = resident.makeups.reduce((sum, makeup) => sum + makeup.hours, 0);
    return {
      name: resident.name,
      pgyLevel: resident.pgyLevel,
      totalAbsenceHours,
      totalMakeupHours,
      balanceHours: totalAbsenceHours - totalMakeupHours,
    };
  });

  return {
    residents: summarizedResidents,
    absences,
    makeups,
  };
}

function buildTextReport({ start, end, residents, absences, makeups, title }) {
  const summary = residents
    .map((resident) => `${resident.name} (R${resident.pgyLevel}) - faltas: ${resident.totalAbsenceHours}h | reposições: ${resident.totalMakeupHours}h | saldo: ${resident.balanceHours}h`)
    .join("\n");

  const absenceLines = absences
    .map((absence) => `${absence.resident.name} | ${formatDate(absence.date)} | ${formatLocation(absence.location)} | ${formatType(absence.type)} | ${absence.hours}h | obs: ${absence.observation || "-"}`)
    .join("\n");

  const makeupLines = makeups
    .map((makeup) => `${makeup.resident.name} | ${formatDate(makeup.date)} | ${makeup.hours}h`)
    .join("\n");

  return [
    title,
    `Período: ${formatDate(start)} a ${formatDate(end)}`,
    "",
    "Resumo por residente:",
    summary || "Sem dados no período.",
    "",
    "Faltas do período:",
    absenceLines || "Nenhuma falta registrada.",
    "",
    "Reposições do período:",
    makeupLines || "Nenhuma reposição registrada.",
  ].join("\n");
}

function buildSummaryMessage({ start, end, residents, absences, makeups, title }) {
  const outstandingResidents = residents.filter((resident) => resident.balanceHours > 0).length;
  const totalAbsenceHours = residents.reduce((sum, resident) => sum + resident.totalAbsenceHours, 0);
  const totalMakeupHours = residents.reduce((sum, resident) => sum + resident.totalMakeupHours, 0);
  const totalBalanceHours = residents.reduce((sum, resident) => sum + resident.balanceHours, 0);

  return [
    title,
    `Periodo: ${formatDate(start)} a ${formatDate(end)}`,
    `Residentes com saldo pendente: ${outstandingResidents}`,
    `Total de faltas: ${absences.length} registro(s) / ${totalAbsenceHours}h`,
    `Total de reposicoes: ${makeups.length} registro(s) / ${totalMakeupHours}h`,
    `Saldo pendente consolidado: ${totalBalanceHours}h`,
  ].join("\n");
}

async function sendTelegramMessage({ token, chatId, text }) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar mensagem para o Telegram: ${body}`);
  }
}

async function sendTelegramReport({ token, chatId, summaryMessage, reportText, fileName, caption }) {
  await sendTelegramMessage({ token, chatId, text: summaryMessage });

  const formData = new FormData();
  formData.append("chat_id", chatId);
  formData.append("caption", caption || "Relatorio completo em anexo");
  formData.append("document", new Blob([reportText], { type: "text/plain;charset=utf-8" }), fileName);

  const documentResponse = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: formData,
  });

  if (!documentResponse.ok) {
    const body = await documentResponse.text();
    throw new Error(`Falha ao enviar arquivo para o Telegram: ${body}`);
  }
}

module.exports = {
  buildSummaryMessage,
  buildTextReport,
  createPrismaClient,
  fetchReportData,
  formatDate,
  getAcademicYearClosedRange,
  getCurrentMarchToDateRange,
  getPreviousMonthRange,
  loadEnvFromDotEnv,
  sendTelegramMessage,
  sendTelegramReport,
};