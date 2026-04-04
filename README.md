# Escala Medica (Controle de Faltas e Reposicoes)

Aplicacao web para controle de faltas e reposicoes de residentes do PRME HMS.

Base tecnica atual:
- Next.js 16 (App Router) com TypeScript
- Prisma + PostgreSQL
- Autenticacao por JWT em cookie HttpOnly
- Interface responsiva para preceptores e residentes
- Notificacao e relatorios via Telegram (scripts operacionais)

## Visao Geral

O sistema separa dois fluxos principais:
- Preceptor/Admin: visualiza todos os residentes, registra/edita/remove faltas e reposicoes, cadastra/remove residentes.
- Residente: visualiza apenas seu proprio resumo (faltas, reposicoes, saldo).

O projeto roda com `basePath` em `/escala`.

## Regras de Acesso (como esta no codigo)

Perfis na base (`UserRole`):
- `ADMIN`
- `USER`
- `RESIDENT`

Permissoes efetivas:
- `RESIDENT`: acesso somente a area de residente e endpoint `/api/resident/shifts`.
- `ADMIN`: acesso completo ao painel e CRUD de faltas/reposicoes/residentes.
- Gerente especial por login local-part (`ana.beatriz`):
	- Pode gerenciar residentes e reposicoes (via `canManageResidents`).
	- Pode ver credenciais de residentes (`canViewResidentCredentials`).

Observacao:
- A criacao de falta em `/api/absences` esta restrita a `ADMIN` (mais restritiva que outras rotas de gestao).

## Fluxo de Negocio

### 1. Falta
1. Preceptor seleciona residente.
2. Informa data, horas, local, periodo, tipo, motivo/observacao.
3. Registro e salvo em `Absence`.
4. Saldo do residente e recalculado: `saldo = horas_falta - horas_repostas`.
5. Opcionalmente, e enviado alerta para Telegram.

### 2. Reposicao
1. Preceptor seleciona residente.
2. Informa data, horas e observacao.
3. Registro e salvo em `Makeup`.
4. Saldo consolidado e recalculado.
5. Opcionalmente, e enviado alerta para Telegram.

### 3. Area do Residente
1. Usuario `RESIDENT` autentica.
2. Sistema identifica o residente pelo nome do usuario.
3. Exibe historico de faltas/reposicoes e indicadores consolidados.

## Estrutura Principal

Pastas mais relevantes:
- `src/app`: paginas e rotas App Router
- `src/app/api`: endpoints de autenticacao e dominio
- `src/components`: dashboards (preceptor e residente)
- `src/lib`: auth, permissao, prisma, telegram e regras auxiliares
- `prisma`: schema, migrations e seed
- `scripts`: relatorios e poller de comandos Telegram

## Endpoints de API

Autenticacao:
- `POST /api/login`
- `POST /api/login-web`
- `GET /api/me`
- `POST /api/logout`

Dominio (faltas/reposicoes/residentes):
- `GET/POST /api/absences`
- `PUT/DELETE /api/absences/[id]`
- `GET/POST /api/makeups`
- `PUT/DELETE /api/makeups/[id]`
- `GET /api/resident-summary`
- `GET/POST /api/residents`
- `DELETE /api/residents/[id]`
- `GET /api/resident/shifts`

Legado:
- `GET/POST /api/shifts` (mantido por compatibilidade, sem uso principal)

## Modelo de Dados (Prisma)

Entidades centrais:
- `User`: autenticacao e papeis
- `Resident`: cadastro de residentes
- `Absence`: faltas
- `Makeup`: reposicoes
- `Shift`: mantido para compatibilidade de fluxo antigo

Enums de dominio:
- `AbsenceType`: `ATESTADO`, `SEM_JUSTIFICATIVA`, `OUTRA`
- `AbsenceLocation`: `REANIMACAO`, `CRITICOS`, `MURICI`, `AULA`, `ESTAGIO_EXTERNO`, `OUTRO`
- `AbsencePeriod`: `SD`, `SN`

## Requisitos

- Node.js 20+
- npm 10+
- PostgreSQL

## Variaveis de Ambiente

Crie um arquivo `.env` na raiz com:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB"
JWT_SECRET="troque-por-um-segredo-forte"
NEXT_PUBLIC_APP_VERSION="2026.03.28.2"

# Opcional (notificacoes e relatorios Telegram)
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
```

## Como Rodar Localmente

1. Instale dependencias:

```bash
npm install
```

2. Aplique migrations:

```bash
npx prisma migrate deploy
```

3. (Opcional) Popular dados iniciais:

```bash
npm run seed
```

4. Inicie em desenvolvimento:

```bash
npm run dev
```

Aplicacao disponivel em:
- `http://localhost:3000/escala`

## Scripts Disponiveis

`package.json`:
- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run seed`

Scripts operacionais (executados diretamente):
- `node scripts/send-monthly-report.cjs`
- `node scripts/poll-telegram-commands.cjs`
- `bash scripts/run-telegram-poller.sh`
- `bash scripts/run-monthly-report.sh`

## Build e Deploy

Build de producao:

```bash
npm run build
npm run start
```

Observacoes operacionais atuais:
- Build Next.js passa no estado atual.
- Lint possui erros e avisos pendentes.
- `scripts/run-monthly-report.sh` chama `npm run report:monthly`, mas este script nao esta declarado no `package.json`.

## PWA e Cache

- Manifest em `/escala/manifest.webmanifest`.
- Versao de app em `NEXT_PUBLIC_APP_VERSION` para bust de cache.
- Middleware aplica header `Cache-Control: no-store` para paginas protegidas.

## Logs e Integracoes

- Eventos de faltas/reposicoes podem gerar mensagens no Telegram.
- Scripts de relatorio usam dados consolidados por periodo e enviam resumo + anexo `.txt`.

## Limitacoes Conhecidas

- Parte das permissoes de gestao usa excecao fixa por local-part de email (`ana.beatriz`).
- Rotas de consulta por `residentId` exigem autenticacao, mas nao validam ownership para `RESIDENT`.
- Credenciais de residentes sao geradas deterministicamente por nome.

## Licenca

Projeto privado.
