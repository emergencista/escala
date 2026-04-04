#!/usr/bin/env node

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

const RESIDENTS = [
  { pgyLevel: 3, name: "Maria Carolina", login: "maria.carolina", password: "M472" },
  { pgyLevel: 3, name: "Bernardo", login: "bernardo", password: "B819" },
  { pgyLevel: 3, name: "Jayame", login: "jayame", password: "J536" },
  { pgyLevel: 3, name: "Cintia", login: "cintia", password: "C294" },
  { pgyLevel: 3, name: "Christiane", login: "christiane", password: "C715" },
  { pgyLevel: 3, name: "Paulino", login: "paulino", password: "P648" },
  { pgyLevel: 2, name: "Maria Eduarda", login: "maria.eduarda", password: "M381" },
  { pgyLevel: 2, name: "Ariel", login: "ariel", password: "A925" },
  { pgyLevel: 2, name: "Tamiris", login: "tamiris", password: "T167" },
  { pgyLevel: 2, name: "Maria Clara", login: "maria.clara", password: "M543" },
  { pgyLevel: 2, name: "Levi", login: "levi", password: "L829" },
  { pgyLevel: 2, name: "Giuliana", login: "giuliana", password: "G472" },
  { pgyLevel: 1, name: "Vinicius", login: "vinicius", password: "V316" },
  { pgyLevel: 1, name: "Edvaldo", login: "edvaldo", password: "E954" },
  { pgyLevel: 1, name: "Antônio", login: "antonio", password: "A287" },
  { pgyLevel: 1, name: "João Oliveira", login: "joao.gustavo", password: "J402" },
  { pgyLevel: 1, name: "Taiara Lohana", login: "taiara.lohana", password: "T453" },
  { pgyLevel: 1, name: "Isadora Simonassi", login: "isadora.simonassi", password: "I921" },
];

const PRECEPTORS = [
  { name: "Ana Beatriz", login: "ana.beatriz", password: "A59151" },
  { name: "Bianca Oliveira", login: "bianca.oliveira", password: "B29592" },
  { name: "Cindy Herrera", login: "cindy.herrera", password: "C31111" },
  { name: "Djario Costa", login: "djario.costa", password: "D97009" },
  { name: "Felicia Machado", login: "felicia.machado", password: "F93742" },
  { name: "Ian Publio", login: "ian.publio", password: "I60257" },
  { name: "Igor Torres", login: "igor.torres", password: "I67837" },
  { name: "Julia Melo", login: "julia.melo", password: "J19897" },
  { name: "Kesia Martins", login: "kesia.martins", password: "K60354" },
  { name: "Ludmila Viana", login: "ludmila.viana", password: "L84363" },
  { name: "Thais Bomfim", login: "thais.bomfim", password: "T41787" },
  { name: "Vanessa Wallau", login: "vanessa.wallau", password: "V54307" },
  { name: "Marion Wiedemann", login: "marion.wiedemann", password: "M58321" },
];

async function upsertResidents() {
  const residents = await prisma.resident.findMany({
    select: { id: true, name: true },
  });

  for (const resident of RESIDENTS) {
    const normalized = normalizeName(resident.name);
    const existing = residents.find((item) => normalizeName(item.name) === normalized);

    if (existing) {
      await prisma.resident.update({
        where: { id: existing.id },
        data: {
          name: resident.name,
          pgyLevel: resident.pgyLevel,
        },
      });
    } else {
      await prisma.resident.create({
        data: {
          name: resident.name,
          pgyLevel: resident.pgyLevel,
        },
      });
    }

    const passwordHash = await bcrypt.hash(resident.password, 10);
    await prisma.user.upsert({
      where: { email: `${resident.login.toLowerCase()}@escala.local` },
      update: {
        name: resident.name,
        role: "RESIDENT",
        password: passwordHash,
      },
      create: {
        email: `${resident.login.toLowerCase()}@escala.local`,
        name: resident.name,
        role: "RESIDENT",
        password: passwordHash,
      },
    });

    console.log(`RESIDENT OK ${resident.login}`);
  }
}

async function upsertPreceptors() {
  for (const preceptor of PRECEPTORS) {
    const passwordHash = await bcrypt.hash(preceptor.password, 10);
    await prisma.user.upsert({
      where: { email: `${preceptor.login.toLowerCase()}@escala.local` },
      update: {
        name: preceptor.name,
        role: "ADMIN",
        password: passwordHash,
      },
      create: {
        email: `${preceptor.login.toLowerCase()}@escala.local`,
        name: preceptor.name,
        role: "ADMIN",
        password: passwordHash,
      },
    });

    console.log(`PRECEPTOR OK ${preceptor.login}`);
  }
}

async function main() {
  await upsertResidents();
  await upsertPreceptors();
  console.log("SYNC COMPLETED");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
