import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

// Estrutura: { nome, email, login, senha }
const RESIDENTS = [
  // R3
  { nome: "Maria Carolina", login: "maria.carolina", senha: "M472", pgyLevel: 3 },
  { nome: "Bernardo", login: "bernardo", senha: "B819", pgyLevel: 3 },
  { nome: "Jayame", login: "jayame", senha: "J536", pgyLevel: 3 },
  { nome: "Cintia", login: "cintia", senha: "C294", pgyLevel: 3 },
  { nome: "Christiane", login: "christiane", senha: "C715", pgyLevel: 3 },
  { nome: "Paulino", login: "paulino", senha: "P648", pgyLevel: 3 },
  // R2
  { nome: "Maria Eduarda", login: "maria.eduarda", senha: "M381", pgyLevel: 2 },
  { nome: "Ariel", login: "ariel", senha: "A925", pgyLevel: 2 },
  { nome: "Tamiris", login: "tamiris", senha: "T167", pgyLevel: 2 },
  { nome: "Maria Clara", login: "maria.clara", senha: "M543", pgyLevel: 2 },
  { nome: "Levi", login: "levi", senha: "L829", pgyLevel: 2 },
  { nome: "Giuliana", login: "giuliana", senha: "G472", pgyLevel: 2 },
  // R1
  { nome: "Vinicius", login: "vinicius", senha: "V316", pgyLevel: 1 },
  { nome: "Edvaldo", login: "edvaldo", senha: "E954", pgyLevel: 1 },
  { nome: "Antônio", login: "antonio", senha: "A287", pgyLevel: 1 },
  // Adicionais
  { nome: "João Oliveira", login: "joao.gustavo", senha: "J402", pgyLevel: 1 },
  { nome: "Taiara Lohana", login: "taiara.lohana", senha: "T453", pgyLevel: 1 },
  { nome: "Isadora Simonassi", login: "isadora.simonassi", senha: "I921", pgyLevel: 1 },
];

const PRECEPTORS = [
  { nome: "Ana Beatriz", login: "ana.beatriz", senha: "A59151" },
  { nome: "Bianca Oliveira", login: "bianca.oliveira", senha: "B29592" },
  { nome: "Cindy Herrera", login: "cindy.herrera", senha: "C31111" },
  { nome: "Djario Costa", login: "djario.costa", senha: "D97009" },
  { nome: "Felicia Machado", login: "felicia.machado", senha: "F93742" },
  { nome: "Ian Publio", login: "ian.publio", senha: "I60257" },
  { nome: "Igor Torres", login: "igor.torres", senha: "I67837" },
  { nome: "Julia Melo", login: "julia.melo", senha: "J19897" },
  { nome: "Kesia Martins", login: "kesia.martins", senha: "K60354" },
  { nome: "Ludmila Viana", login: "ludmila.viana", senha: "L84363" },
  { nome: "Thais Bomfim", login: "thais.bomfim", senha: "T41787" },
  { nome: "Vanessa Wallau", login: "vanessa.wallau", senha: "V54307" },
  { nome: "Marion Wiedemann", login: "marion.wiedemann", senha: "M58321" },
];

async function main() {
  console.log("🌱 Iniciando seed com credenciais validadas...");

  // Criar residents
  console.log("👨‍⚕️ Adicionando residentes...");
  for (const resident of RESIDENTS) {
    const email = `${resident.login}@escala.local`;
    const hashedPassword = await bcrypt.hash(resident.senha, 10);
    
    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
          email,
          password: hashedPassword,
          name: resident.nome,
          role: "RESIDENT",
        },
      });
      console.log(`   ✓ ${resident.nome} (${resident.login}) - R${resident.pgyLevel}`);
    } catch (error) {
      console.error(`   ✗ Erro ao criar ${resident.nome}:`, error);
    }
  }

  // Criar preceptors
  console.log("👨‍🏫 Adicionando preceptores...");
  for (const preceptor of PRECEPTORS) {
    const email = `${preceptor.login}@escala.local`;
    const hashedPassword = await bcrypt.hash(preceptor.senha, 10);
    
    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashedPassword },
        create: {
          email,
          password: hashedPassword,
          name: preceptor.nome,
          role: "ADMIN",
        },
      });
      console.log(`   ✓ ${preceptor.nome} (${preceptor.login})`);
    } catch (error) {
      console.error(`   ✗ Erro ao criar ${preceptor.nome}:`, error);
    }
  }

  console.log("✅ Seed completado com sucesso!");
  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Erro no seed:", e);
  process.exit(1);
});
