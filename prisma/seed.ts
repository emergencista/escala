import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  }),
});

// Preceptores (podem adicionar faltas)
const PRECEPTORS = [
  { name: "Ana Beatriz", email: "ana.beatriz@escala.local" },
  { name: "Bianca Oliveira", email: "bianca.oliveira@escala.local" },
  { name: "Cindy Herrera", email: "cindy.herrera@escala.local" },
  { name: "Djario Costa", email: "djario.costa@escala.local" },
  { name: "Felicia Machado", email: "felicia.machado@escala.local" },
  { name: "Ian Publio", email: "ian.publio@escala.local" },
  { name: "Igor Torres", email: "igor.torres@escala.local" },
  { name: "Julia Melo", email: "julia.melo@escala.local" },
  { name: "Kesia Martins", email: "kesia.martins@escala.local" },
  { name: "Ludmila Viana", email: "ludmila.viana@escala.local" },
  { name: "Thais Bomfim", email: "thais.bomfim@escala.local" },
  { name: "Vanessa Wallau", email: "vanessa.wallau@escala.local" },
];

// Function to generate random password: First letter + random number
function generatePreceptorPassword(name: string): string {
  const firstLetter = name[0].toUpperCase();
  const randomNumber = Math.floor(Math.random() * 90000) + 10000; // 10000-99999
  return `${firstLetter}${randomNumber}`;
}

// Residentes R3
const RESIDENTS_R3 = [
  { name: "Maria Carolina", pgyLevel: 3 },
  { name: "Bernardo", pgyLevel: 3 },
  { name: "Jayame", pgyLevel: 3 },
  { name: "Cintia", pgyLevel: 3 },
  { name: "Christiane", pgyLevel: 3 },
  { name: "Paulino", pgyLevel: 3 },
];

// Residentes R2
const RESIDENTS_R2 = [
  { name: "Maria Eduarda", pgyLevel: 2 },
  { name: "Ariel", pgyLevel: 2 },
  { name: "Tamiris", pgyLevel: 2 },
  { name: "Maria Clara", pgyLevel: 2 },
  { name: "Levi", pgyLevel: 2 },
  { name: "Giuliana", pgyLevel: 2 },
];

// Residentes R1
const RESIDENTS_R1 = [
  { name: "Vinicius", pgyLevel: 1 },
  { name: "Edivaldo", pgyLevel: 1 },
  { name: "Antônio", pgyLevel: 1 },
];

const SEED_DATA = {
  users: [
    {
      email: "admin@escala.local",
      password: "Admin@123456",
      name: "Administrador",
      role: "ADMIN",
    },
    {
      email: "usuario@escala.local",
      password: "Usuario@123456",
      name: "Usuário Padrão",
      role: "USER",
    },
  ],
  residents: [...RESIDENTS_R3, ...RESIDENTS_R2, ...RESIDENTS_R1],
};

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Seed system users
  console.log("👤 Criando usuários do sistema...");
  for (const userData of SEED_DATA.users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role as any,
        },
      });
      console.log(`   ✓ ${user.email} (${user.role}) - Senha: ${userData.password}`);
    } catch (error) {
      console.log(`   ℹ ${userData.email} já existe`);
    }
  }

  // Seed preceptors
  console.log("\n🩺 Criando/Atualizando preceptores (podem adicionar faltas)...");
  const preceptorCredentials: Array<{ email: string; password: string; name: string }> = [];
  for (const preceptor of PRECEPTORS) {
    const password = generatePreceptorPassword(preceptor.name);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      // Try to update if exists, otherwise create
      const user = await prisma.user.upsert({
        where: { email: preceptor.email },
        update: {
          password: hashedPassword,
        },
        create: {
          email: preceptor.email,
          password: hashedPassword,
          name: preceptor.name,
          role: "ADMIN",
        },
      });
      console.log(`   ✓ ${user.email} - Senha: ${password}`);
      preceptorCredentials.push({
        email: preceptor.email,
        password: password,
        name: preceptor.name,
      });
    } catch (error) {
      console.log(`   ❌ Erro ao processar ${preceptor.email}:`, error);
    }
  }

  // Seed residents
  console.log("\n👨‍⚕️ Criando residentes (visualizam apenas suas faltas)...");
  const residentCredentials: Array<{ email: string; password: string; name: string; pgyLevel: number }> = [];
  
  for (const resident of SEED_DATA.residents) {
    const email = resident.name.toLowerCase().replace(/\s+/g, ".") + "@escala.local";
    // Use first name + last initial if exists, otherwise add number
    let nameParts = resident.name.split(" ");
    const password = nameParts.length > 1 
      ? nameParts[0] + nameParts[nameParts.length - 1][0] + "@123456"
      : resident.name + "@123456";

    // Create resident record
    try {
      await prisma.resident.create({
        data: {
          name: resident.name,
          pgyLevel: resident.pgyLevel,
        },
      });
    } catch (error) {
      // Resident já existe
    }

    // Create user account for resident
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const user = await prisma.user.create({
        data: {
          email: email,
          password: hashedPassword,
          name: resident.name,
          role: "RESIDENT" as any,
        },
      });
      console.log(`   ✓ ${resident.name} (R${resident.pgyLevel}) - ${user.email} - Senha: ${password}`);
      residentCredentials.push({
        email: email,
        password: password,
        name: resident.name,
        pgyLevel: resident.pgyLevel,
      });
    } catch (error) {
      console.log(`   ℹ ${email} já existe`);
      residentCredentials.push({
        email: email,
        password: password,
        name: resident.name,
        pgyLevel: resident.pgyLevel,
      });
    }
  }

  // Try to create sample shifts for today
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const residentRecords = await prisma.resident.findMany();
    
    console.log("\n📅 Shifts não são criados (sistema de faltas em uso)");
  } catch (error) {
    console.log("   ℹ Shifts já existem");
  }

  console.log("\n✅ Seed completado com sucesso!");

  console.log("\n┌─────────────────────────────────────────────────────┐");
  console.log("│ CREDENCIAIS DOS PRECEPTORES (Adicionar Faltas)      │");
  console.log("└─────────────────────────────────────────────────────┘");
  for (const cred of preceptorCredentials) {
    console.log(`📧 ${cred.email} | 🔑 ${cred.password}`);
  }

  console.log("\n┌─────────────────────────────────────────────────────┐");
  console.log("│ CREDENCIAIS DOS RESIDENTES (Visualizar Faltas)      │");
  console.log("└─────────────────────────────────────────────────────┘");
  
  console.log("\n✅ R3 (3º ano):");
  for (const cred of residentCredentials.filter(r => r.pgyLevel === 3)) {
    console.log(`📧 ${cred.email} | 🔑 ${cred.password}`);
  }
  
  console.log("\n✅ R2 (2º ano):");
  for (const cred of residentCredentials.filter(r => r.pgyLevel === 2)) {
    console.log(`📧 ${cred.email} | 🔑 ${cred.password}`);
  }
  
  console.log("\n✅ R1 (1º ano):");
  for (const cred of residentCredentials.filter(r => r.pgyLevel === 1)) {
    console.log(`📧 ${cred.email} | 🔑 ${cred.password}`);
  }
}

main()
  .catch((error) => {
    console.error("❌ Erro durante seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


