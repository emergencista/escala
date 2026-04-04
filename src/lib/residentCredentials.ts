import bcrypt from "bcryptjs";

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function slugifyWord(value: string): string {
  return value.replace(/[^a-z0-9]/g, "");
}

const RESIDENT_CREDENTIAL_OVERRIDES: Record<
  string,
  {
    login: string;
    password: string;
  }
> = {
  "maria carolina": {
    login: "maria.carolina",
    password: "M472",
  },
  bernardo: {
    login: "bernardo",
    password: "B819",
  },
  jayame: {
    login: "jayame",
    password: "J536",
  },
  cintia: {
    login: "cintia",
    password: "C294",
  },
  christiane: {
    login: "christiane",
    password: "C715",
  },
  paulino: {
    login: "paulino",
    password: "P648",
  },
  "maria eduarda": {
    login: "maria.eduarda",
    password: "M381",
  },
  ariel: {
    login: "ariel",
    password: "A925",
  },
  tamiris: {
    login: "tamiris",
    password: "T167",
  },
  "maria clara": {
    login: "maria.clara",
    password: "M543",
  },
  levi: {
    login: "levi",
    password: "L829",
  },
  giuliana: {
    login: "giuliana",
    password: "G472",
  },
  vinicius: {
    login: "vinicius",
    password: "V316",
  },
  edvaldo: {
    login: "edvaldo",
    password: "E954",
  },
  antonio: {
    login: "antonio",
    password: "A287",
  },
  "joao oliveira": {
    login: "joao.gustavo",
    password: "J402",
  },
  "taiara lohana": {
    login: "taiara.lohana",
    password: "T453",
  },
  "isadora simonassi": {
    login: "isadora.simonassi",
    password: "I921",
  },
};

export function buildResidentLogin(name: string): string {
  const override = RESIDENT_CREDENTIAL_OVERRIDES[normalizeResidentKey(name)];
  if (override) {
    return override.login;
  }

  const words = normalizeName(name)
    .split(/\s+/)
    .map(slugifyWord)
    .filter(Boolean);

  const localPart = words.length > 0 ? words.join(".") : "residente";
  return localPart;
}

export function buildResidentPassword(name: string): string {
  const override = RESIDENT_CREDENTIAL_OVERRIDES[normalizeResidentKey(name)];
  if (override) {
    return override.password;
  }

  const normalized = normalizeName(name).replace(/\s+/g, "");
  const first = normalized[0]?.toUpperCase() || "R";

  const sum = normalized.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const code = ((sum % 900) + 100).toString();

  return `${first}${code}`;
}

export function normalizeResidentKey(name: string): string {
  return normalizeName(name).replace(/\s+/g, " ");
}

export async function buildResidentCredentials(name: string) {
  const email = buildResidentLogin(name);
  const password = buildResidentPassword(name);
  const passwordHash = await bcrypt.hash(password, 10);

  return {
    email,
    password,
    passwordHash,
  };
}
