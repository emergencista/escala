# 🧪 Guia de Teste - Refatoração Escala

## Pré-requisitos
- Estar logado como preceptor no dashboard
- Ter residentes cadastrados no sistema
- Ter dados de faltas, reposições confirmadas e reposições previstas

## Testes no Dashboard do Preceptor

### 1. **Estrutura Principal** ✅
- [ ] Card "Carga Horária a Repor" se exibe no topo
- [ ] Aba "Residentes" está selecionada por padrão
- [ ] Abas "Cadastro de residentes" e "Edição de residentes" ainda existem (se admin)

### 2. **Calendário Mensal**
- [ ] Calendário aparece abaixo do "Outstanding Balance Panel"
- [ ] Seta "Anterior" permite voltar ao mês anterior
- [ ] Seta "Próxima" permite avançar ao próximo mês
- [ ] Mês atual é exibido corretamente
- [ ] Dias estão alinhados corretamente (dom-sab)
- [ ] Indicadores aparecem nos dias corretos:
  - [ ] Ponto vermelho = existe falta registrada
  - [ ] Ponto azul = existe reposição prevista
  - [ ] Ponto verde = existe reposição confirmada
  - [ ] Múltiplos pontos = múltiplos eventos no mesmo dia

### 3. **Seleção de Residentes**
- [ ] Ao selecionar um residente no sidebar, o calendário atualiza
- [ ] Calendário mostra apenas eventos do residente selecionado
- [ ] Ao desselecionar, o calendário desaparece ou mostra mensagem

### 4. **Histórico e Detalhes**
- [ ] Seção "Histórico de Faltas" continua visível
- [ ] Seção "Reposições lançadas" continua visível
- [ ] Seção "Reposições previstas" continua visível
- [ ] Cartões de ações (editar, remover) funcionam normalmente
- [ ] Botão "Confirmar" em reposições previstas funciona
- [ ] Após confirmar uma reposição prevista, o calendário atualiza (azul → verde)

### 5. **Criação de Registros**
- [ ] Botão "Novo lançamento" cria modal de criação
- [ ] Modal de falta funciona
- [ ] Modal de reposição confirmada funciona
- [ ] Modal de reposição prevista funciona
- [ ] Após salvar, o calendário se atualiza

### 6. **Responsividade Desktop**
- [ ] Layout em grid 2 colunas funciona (sidebar + conteúdo)
- [ ] Calendário usa largura apropriada
- [ ] Sem overflow de conteúdo

## Testes na Interface do Residente

### 1. **Página Principal**
- [ ] Título muda para "Previsão de Reposição"
- [ ] Subtítulo mostra R + nível + nome do residente (ex: R3 • Maria Carolina)
- [ ] Botão "Sair" está presente e funciona

### 2. **Conteúdo Exibido**
- [ ] Card "Reposições Que Estão Por Vir" se exibe
- [ ] Se não houver reposições previstas:
  - [ ] Mensagem "Nenhuma reposição prevista no momento" aparece
  - [ ] Submensagem informatva aparece
- [ ] Se houver reposições previstas:
  - [ ] Lista mostra cada reposição com:
    - [ ] Data formatada (ex: seg, 2 de abril de 2026)
    - [ ] Turno (Diurno SD / Noturno SN)
    - [ ] Horas com badge am amber (ex: +4h)
    - [ ] Observação (se existir)

### 3. **Informação de Suporte**
- [ ] Card com ícone "ℹ️" aparece abaixo do card principal
- [ ] Texto explica o fluxo das reposições previstas

### 4. **Responsividade Mobile**
- [ ] Interface se adapta a telas pequenas
- [ ] Nenhum overflow
- [ ] Botão logout visível em mobile

### 5. **Sem Abas Desnecessárias**
- [ ] Nenhuma aba de "Faltas", "Reposições", etc. visível
- [ ] Interface é minimalista e focada

## Testes de Integração

### 1. **Confirmar Reposição Prevista**
- [ ] No preceptor: Reposição prevista está com bolinha azul no calendário
- [ ] No preceptor: Botão "Confirmar" na seção de reposições previstas
- [ ] Após confirmar:
  - [ ] No calendário: bolinha fica verde
  - [ ] Na seção de "Reposições lançadas": reposição aparece
  - [ ] No residente: reposição ainda aparece em "Previsão de Reposição"? (Ou já sai porque foi confirmada?)

### 2. **Criação de Nova Reposição Prevista**
- [ ] No preceptor: clica "Novo lançamento" → seleciona "Reposição prevista"
- [ ] Preenche: data, horas, turno, observação
- [ ] Salva
- [ ] No calendário: novo ponto azul aparece na data
- [ ] No residente: nova reposição aparece em "Previsão de Reposição"

### 3. **Navegação de Meses**
- [ ] Cria reposição prevista para mês diferente
- [ ] No calendário: navega para esse mês
- [ ] Reposição aparece com indicador correto

## Regressão - Não Quebrou Nada

- [ ] Criação de faltas funciona normalmente
- [ ] Criação de reposições confirmadas funciona normalmente
- [ ] Edição de registros funciona normalmente
- [ ] Remover registros funciona normalmente
- [ ] Abas de "Cadastro de residentes" e "Edição" funcionam
- [ ] Modal de criação de formulários funciona
- [ ] Logout funciona
- [ ] Paginação/filtros funcionam

## 📊 Checklist de Validação Final

- [ ] Não há erro

s em console (F12)
- [ ] Não há warnings de TypeScript
- [ ] Não há componentes quebrados
- [ ] Performance está boa (sem lag ao mudar meses)
- [ ] Estilos são consistentes com o restante da app
- [ ] Cores das bolinhas são bem visíveis e consistentes

---

**Nota**: Todos os testes devem ser feitos em desktop e mobile quando possível.

