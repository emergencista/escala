type TelegramMessageInput = {
  text: string;
};

function getTelegramConfig() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return null;
  }

  return { token, chatId };
}

function formatDateBR(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  if (!year || !month || !day) {
    return dateStr;
  }
  return `${day}/${month}/${year}`;
}

function getLocationEmoji(location: string): string {
  switch (location.toUpperCase()) {
    case "REANIMACAO":
      return "🏥";
    case "CRITICOS":
      return "🚨";
    case "MURICI":
      return "🏢";
    case "AULA":
      return "📚";
    case "ESTAGIO_EXTERNO":
      return "🌍";
    default:
      return "📍";
  }
}

function getLocationLabel(location: string): string {
  switch (location.toUpperCase()) {
    case "REANIMACAO":
      return "Reanimação";
    case "CRITICOS":
      return "Críticos";
    case "MURICI":
      return "Murici";
    case "AULA":
      return "Aula";
    case "ESTAGIO_EXTERNO":
      return "Estágio Externo";
    default:
      return location;
  }
}

function getAbsenceTypeEmoji(type: string): string {
  switch (type.toUpperCase()) {
    case "ATESTADO":
      return "📋";
    case "SEM_JUSTIFICATIVA":
      return "❌";
    case "OUTRA":
      return "ℹ️";
    default:
      return "📝";
  }
}

function getAbsenceTypeLabel(type: string): string {
  switch (type.toUpperCase()) {
    case "ATESTADO":
      return "Atestado";
    case "SEM_JUSTIFICATIVA":
      return "Sem Justificativa";
    case "OUTRA":
      return "Outra Justificativa";
    default:
      return type;
  }
}

export async function sendTelegramMessage({ text }: TelegramMessageInput) {
  const config = getTelegramConfig();
  if (!config) {
    return;
  }

  const response = await fetch(`https://api.telegram.org/bot${config.token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: config.chatId,
      text,
      parse_mode: "HTML",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Falha ao enviar mensagem para o Telegram: ${body}`);
  }
}

type AbsenceNotificationInput = {
  residentName: string;
  residentPgyLevel: number;
  date: string;
  hours: number;
  location: string;
  period: string;
  type: string;
  createdByName: string;
};

type MakeupNotificationInput = {
  residentName: string;
  residentPgyLevel: number;
  date: string;
  hours: number;
  createdByName: string;
};

type PlannedMakeupNotificationInput = {
  residentName: string;
  residentPgyLevel: number;
  date: string;
  hours: number;
  period: string;
  createdByName: string;
};

export async function notifyAbsenceCreated(input: AbsenceNotificationInput) {
  const typeEmoji = getAbsenceTypeEmoji(input.type);
  const typeLabel = getAbsenceTypeLabel(input.type);
  const locationEmoji = getLocationEmoji(input.location);
  const locationLabel = getLocationLabel(input.location);

  const message = [
    `<b>❌ NOVA FALTA REGISTRADA</b>`,
    "",
    `<b>👤 Residente:</b> ${input.residentName} (R${input.residentPgyLevel})`,
    `<b>📅 Data:</b> ${formatDateBR(input.date)}`,
    `<b>⏱️ Carga Horária:</b> ${input.hours}h`,
    `<b>${locationEmoji} Local:</b> ${locationLabel}`,
    `<b>🕐 Período:</b> ${input.period}`,
    `<b>${typeEmoji} Tipo:</b> ${typeLabel}`,
    `<b>✍️ Lançado por:</b> ${input.createdByName}`,
    "",
    "═══════════════════════════",
  ].join("\n");

  await sendTelegramMessage({ text: message });
}

export async function notifyMakeupCreated(input: MakeupNotificationInput) {
  const message = [
    `<b>✅ NOVA REPOSIÇÃO REGISTRADA</b>`,
    "",
    `<b>👤 Residente:</b> ${input.residentName} (R${input.residentPgyLevel})`,
    `<b>📅 Data:</b> ${formatDateBR(input.date)}`,
    `<b>⏱️ Carga Horária:</b> ${input.hours}h`,
    `<b>✍️ Lançado por:</b> ${input.createdByName}`,
    "",
    "═══════════════════════════",
  ].join("\n");

  await sendTelegramMessage({ text: message });
}

export async function notifyPlannedMakeupCreated(input: PlannedMakeupNotificationInput) {
  const message = [
    `<b>🟠 NOVA REPOSIÇÃO PREVISTA</b>`,
    "",
    `<b>👤 Residente:</b> ${input.residentName} (R${input.residentPgyLevel})`,
    `<b>📅 Data:</b> ${formatDateBR(input.date)}`,
    `<b>⏱️ Carga Horária:</b> ${input.hours}h`,
    `<b>🕐 Turno:</b> ${input.period}`,
    `<b>✍️ Lançado por:</b> ${input.createdByName}`,
    "",
    "═══════════════════════════",
  ].join("\n");

  await sendTelegramMessage({ text: message });
}
