# Gembify — Consultoria Lean Manufacturing com IA

Aplicação Web SaaS industrial com arquitetura desacoplada (**API REST** no backend + **SPA React** responsivo no frontend) para diagnóstico automatizado de gargalos no chão de fábrica com metodologia **Lean Manufacturing / MFV (Mapeamento de Fluxo de Valor)**.

---

## Principais Funcionalidades

- **Diagnóstico Lean Estruturado (IA):**
  - Mapeamento dos 8 desperdícios **TIMWOODS** com justificativas técnicas.
  - Análise de causa raiz (**5 Porquês**).
  - Recomendação de ferramentas Lean reais (MFV, 5S, Kaizen, SMED, Kanban, Poka-Yoke, Trabalho Padronizado, etc.).
- **Fluxograma Comparativo Visual (`Mermaid.js`):** compara automaticamente o fluxo atual (com gargalo) vs. fluxo otimizado, com controles de zoom, alternância visual/código e fallback de segurança.
- **Planos de Ação em 3 Faixas de Investimento:**
  - **Zero / Baixo Custo** (Quick Wins)
  - **Médio Custo** (Melhorias Estruturais e Ergonomia)
  - **Alto Custo** (MFV Futuro e Transformação)
  - Inclui prazo estimado, ferramenta Lean aplicada, impacto esperado e `prompt_imagem` isométrico pronto para geração visual futura.
- **Mesa de Discussão Consultiva (Chat IA):** debate em tempo real sobre cada relatório gerado, com perguntas estratégicas clicáveis e adaptação a novas restrições (espaço, verba, turnos, NRs).
- **UI Industrial Moderna:** alternância animada entre **Modo Claro** e **Modo Preto Absoluto (AMOLED)**, sidebar retrátil com histórico, modal de **Nova Consultoria** com identificação da empresa e exemplos rápidos em 1 clique.

---

## Arquitetura

- **Isolamento total da IA:** todas as chamadas ao SDK `@google/genai` ficam restritas exclusivamente a `backend/services/aiService.js` (exportando apenas `generateLeanReport` e `discussReport`), com fallback automático entre modelos em caso de pico de demanda.
- **Persistência isolada:** armazenamento MVP em JSON local encapsulado em `backend/repositories/reportRepository.js`, pronto para migração futura para banco relacional ou NoSQL.

---

## Stack Tecnológica

- **Backend:** Node.js, Express, `@google/genai`, `cors`, `dotenv`
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Lucide React, Mermaid.js

---

## Como Rodar Localmente

### 1. Instale as dependências
```bash
npm run install:all
```

### 2. Configure as variáveis de ambiente do Backend
Copie `backend/.env.example` para `backend/.env` e adicione sua chave da API do Google Gemini:

```env
GEMINI_API_KEY=sua_chave_aqui
AI_MODEL=gemini-3.5-flash
PORT=3001
```

### 3. Inicie Backend + Frontend juntos
```bash
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:3001`
