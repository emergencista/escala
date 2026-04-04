# 📝 Documentação Técnica - Refatoração Escala

## 🎯 Objetivo
Reorganizar as interfaces do preceptor e residente mantendo mínima refatoração e máxa isolamento de features.

## 📁 Arquivos Modificados

### 1. `/src/components/PreceptorCalendar.tsx` [NOVO]
**Status**: ✅ Criado

**Responsabilidades**:
- Renderizar calendário mensal
- Navegação entre meses
- Indicadores visuais de eventos (cores por status)

**Props Esperadas**:
```typescript
interface PreceptorCalendarProps {
  absences: Absence[];
  confirmedMakeups: Makeup[];
  plannedMakeups: PlannedMakeup[];
  residentName?: string;
}
```

**Tipos Internos**:
- Utiliza tipos `Absence`, `Makeup`, `PlannedMakeup` definidos em `AbsenceDashboard.tsx`
- Status de evento: `"absence" | "confirmed_replacement" | "planned_replacement"`

**Dependências**:
- React hooks: `useState`
- lucide-react: `ChevronLeft`, `ChevronRight`

**Funcionalidades**:
- ✅ Navegação mês anterior/próximo
- ✅ Grid de dias do mês
- ✅ Indicadores visuais (bolinhas coloridas)
- ✅ Legenda de cores
- ✅ Responsividade (scroll horizontal em mobile)

**Melhorias Futuras**:
- Clicar em dia para ver detalhes
- Animação ao confirmar reposição (azul → verde)
- Seletor de ano além de mês
- Tooltip com lista de eventos do dia

---

### 2. `/src/components/AbsenceDashboard.tsx` [MODIFICADO]
**Status**: ✅ Atualizado

**Mudanças Específicas**:
1. **Line 5**: Adicionado import
   ```typescript
   import PreceptorCalendar from "@/components/PreceptorCalendar";
   ```

2. **Line ~1090**: Renomeado tab
   ```typescript
   // Antes: "Lançamentos"
   // Depois: "Residentes"
   ```

3. **Line ~1127**: Adicionado calendário na seção desktop
   ```typescript
   {selectedResident ? (
     <section className="mb-8 hidden lg:block">
       <PreceptorCalendar
         absences={selectedResident.absences}
         confirmedMakeups={selectedResident.makeups}
         plannedMakeups={selectedResident.plannedMakeups}
         residentName={selectedResident.resident.name}
       />
     </section>
   ) : null}
   ```

**O Que Não Mudou**:
- ✅ Toda a lógica de state
- ✅ Funções de criação/edição/remoção
- ✅ Modais
- ✅ Sidebar de residentes
- ✅ Seções de histórico
- ✅ Abas de "Cadastro de residentes" e "Edição"
- ✅ Permissões e autenticação

**Impacto**:
- Mínimo: apenas adicionado um novo componente e renomeado uma aba
- Sem quebra de funcionalidade
- Sem alteração de dados ou APIs

---

### 3. `/src/components/ResidentShiftsClient.tsx` [SIMPLIFICADO]
**Status**: ✅ Atualizado

**Mudanças Realizadas**:

1. **Imports Removidos**:
   - `useState` não é mais necessário
   - `ResidentAbsence` não é mais usado
   - Funções de formatação removidas

2. **Tipos Removidos**:
   - `type MobileResidentTab`
   - Formatadores: `formatAbsenceType`, `formatAbsenceLocation`, `formatAbsencePeriod`

3. **State Removido**:
   - `mobileTab` useState
   - `absencesCount`, `plannedMakeupsCount` variáveis

4. **JSX Simplificado**:
   - **Remover**: Seção de abas mobile
   - **Remover**: Conteúdo condicional por aba
   - **Remover**: Grid de métricas
   - **Remover**: Tabela de histórico de faltas
   - **Remover**: Grid de reposições confirmadas
   - **Manter**: Único card "Reposições Que Estão Por Vir"

5. **Header Atualizado**:
   - Título: "Minhas Faltas" → "Previsão de Reposição"
   - Descrição ajustada

**Resultados**:
- Arquivo reduzido de ~343 para ~130 linhas
- Interface 100% focada em reposições previstas
- Sem funcionalidades extras

---

## 🔗 Fluxo de Dados

### Dashboard do Preceptor → Calendário
```
ResidentSummary (selectedResident)
  ├── absences: Absence[]
  ├── makeups: Makeup[] (confirmedMakeups)
  ├── plannedMakeups: PlannedMakeup[]
  └── resident: Resident
       └── name: string
        
↓ (passa para PreceptorCalendar)

PreceptorCalendar renderiza:
  - Cada absence como 🔴 vermelho
  - Cada plannedMakeup como 🔵 azul
  - Cada makeup como 🟢 verde
```

### Confirmação de Reposição Prevista
```
Preceptor clica "Confirmar" em reposição prevista
  ↓
API PATCH /api/planned-makeups/:id (status: CONFIRMED)
  ↓
AbsenceDashboard re-fetcha dados
  ↓
selectedResident.plannedMakeups atualiza (reposição sai)
  ↓
selectedResident.makeups atualiza (reposição entra)
  ↓
PreceptorCalendar re-renderiza
  ↓
Ponto azul vira verde no calendário
```

### Residente Vê Reposições Previstas
```
ResidentShiftsClient recebe resident (ResidentDashboardData)
  ├── plannedMakeups: PlannedMakeup[]
  └── Renderiza APENAS plannedMakeups
```

---

## ✅ Verificações de Tipo

### PreceptorCalendar
```typescript
// Props recebidas de AbsenceDashboard
absences: Absence[] ✅
confirmedMakeups: Makeup[] ✅  
plannedMakeups: PlannedMakeup[] ✅
residentName?: string ✅

// Tipos locais em AbsenceDashboard compatíveis com Calendar
interface Absence {
  id: string;
  date: string; // ISO format YYYY-MM-DD ou com timestamp
  hours: number;
  // ... outros campos
}

interface Makeup {
  id: string;
  date: string; // ISO format
  hours: number;
  // ...
}

interface PlannedMakeup {
  id: string;
  date: string; // ISO format
  hours: number;
  period: "SD" | "SN";
  // ...
}
```

---

## 🚀 Como Testar Localmente

### 1. Iniciar o servidor
```bash
cd /home/ubuntu/escala/escala-medica
npm run dev
# Ou use: npm start
```

### 2. Acessar Dashboard Preceptor
```
http://localhost:3000/escala
```

### 3. Acessar Resident Interface
```
http://localhost:3000/escala/resident/shifts
```

### 4. Verificar Console do Browser (F12)
- Deve estar limpo de erros
- Não deve haver warnings de React

### 5. Testar Calendário
- Criar reposições em datas diferentes
- Navegar meses
- Confirmar reposições e observar mudança de cor

---

## 📦 Dependências Adicionadas
- ❌ Nenhuma nova dependência (usa libs já existentes)

## 🔄 Integração com APIs Existentes
- ✅ `/api/planned-makeups` - GET lista, POST cria
- ✅ `/api/planned-makeups/:id` - PATCH confirma
- ✅ `/api/resident-summary` - GET dados atualizados
- ✅ Sem necessidade de novos endpoints

---

## 🔒 Segurança e Permissões

### Preceptor (AbsenceDashboard)
- ✅ Protegido por autenticação (`canEditResidents`)
- ✅ Acesso limitado a residentes seu domínio
- ✅ CRUD em faltas/reposições requer permissão

### Residente (ResidentShiftsClient)
- ✅ Protegido por autenticação no middleware
- ✅ View-only de suas próprias reposições
- ✅ Sem permissão de editar/remover

---

## 💡 Decisões de Design

1. **Não Usar State Global**
   - Mantém lógica toda em AbsenceDashboard
   - Evita complexidade de Context/Redux
   
2. **Calendar como Componente Isolado**
   - Recebe dados via props
   - Fácil de reutilizar em outras telas se necessário
   
3. **Simplified Resident Interface**
   - Remove bloat e confusão
   - Foca na informação relevante (previsões)
   
4. **Mínima Refatoração**
   - Não reescrever componentes existentes
   - Apenas adicionar e renomear
   - Mantém estabilidade

---

## 🎓 Lições Aprendidas

1. **Monolithic Components**: AbsenceDashboard é muito grande (2276 linhas)
   - Considerar split futuro em componentes menores
   - Mas para esta refatoração, foi a abordagem mais segura

2. **Type Compatibility**: Types definidos locais funcionam bem
   - Componentes no mesmo arquivo podem compartilhar tipos implicitamente
   - Para uso em arquivos diferentes, considerar exportar tipos

3. **Responsividade**: O calendário precisa ser testado bem em mobile
   - Scroll horizontal pode não ser ideal
   - Considerar grid adaptativo no futuro

---

## 🔮 Próximas Melhorias (Sugestões)

1. **Melhorar Calendário**
   - [ ] Clicar em dia para ver lista de eventos
   - [ ] Tooltips ao passar mouse
   - [ ] Animação ao confirmar

2. **Melhorar Resident Interface**
   - [ ] Notificação quando nova reposição é prevista
   - [ ] Ícone de status (confirmada/pendente/vencida)

3. **Refatoração Estrutural**
   - [ ] Extrair calendar-related state em hook
   - [ ] Separar CRUD logic do componente main
   - [ ] Melhorar tipagem com exports

4. **Performance**
   - [ ] Memoizar componentes se necessário
   - [ ] Lazy load de dados por mês

---

**Data**: 01/04/2026  
**Status**: ✅ Completo e Testado  
**Responsável**: Refatoração Cirúrgica Escala
