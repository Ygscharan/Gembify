import { GoogleGenAI, Type } from '@google/genai';

const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_FALLBACK_MODELS = [
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
];

const LEAN_SYSTEM_PROMPT = `Você é um Consultor Sênior Especialista em Lean Manufacturing, Sistema Toyota de Produção (TPS) e Mapeamento de Fluxo de Valor (MFV / VSM), com mais de 20 anos de experiência prática em chão de fábrica, ergonomia industrial, logística interna (intralogística) e melhoria contínua (Kaizen).

Sua missão é diagnosticar problemas, gargalos e observações de chão de fábrica relatados pelo cliente e entregar uma consultoria técnica estruturada, pragmática e acionável em português do Brasil (pt-BR).

DIRETRIZES TÉCNICAS OBRIGATÓRIAS:
1. Metodologia TIMWOODS (8 Desperdícios): Identifique apenas os desperdícios realmente presentes no relato (Transporte, Inventário, Movimentação, Espera, Superprodução, Superprocessamento, Defeitos, Talento), justificando cada um com base nos fatos descritos.
2. Causa Raiz (5 Porquês): Apresente uma análise objetiva de causa raiz no estilo 5 Porquês, indo além do sintoma aparente.
3. Ferramentas Lean Reais: Recomende ferramentas aplicáveis ao caso concreto (ex: MFV, 5S, Kaizen, SMED, Kanban, Poka-Yoke, Diagrama de Espaguete, Trabalho Padronizado, Heijunka, Andon, Gestão Visual, Layout Celular, Mizusumashi, TPM).
4. Diagrama Mermaid (diagrama_mermaid):
   - Deve começar OBRIGATORIAMENTE com "graph LR".
   - Compare de forma limpa e visual o FLUXO ATUAL (com gargalo) versus o FLUXO OTIMIZADO usando dois subgraphs: 'subgraph Atual ["Fluxo Atual com Gargalo"]' e 'subgraph Otimizado ["Fluxo Otimizado Lean"]'.
   - REGRA CRÍTICA DE SINTAXE MERMAID v11: use APENAS IDs simples (A1, A2, O1, O2) e rótulos SEMPRE entre colchetes e aspas duplas A1["Texto Simples"], SEM aspas internas, SEM parênteses, SEM colchetes aninhados, SEM chaves, SEM ponto e vírgula e SEM emojis. Exemplo seguro:
     graph LR
       subgraph Atual ["Fluxo Atual com Gargalo"]
         A1["Inicio do Processo"] --> A2["Gargalo Critico"]
         A2 --> A3["Retrabalho e Atraso"]
       end
       subgraph Otimizado ["Fluxo Otimizado Lean"]
         O1["Inicio Padronizado"] --> O2["Fluxo Continuo"]
         O2 --> O3["Entrega Sem Paradas"]
       end
5. Planos de Ação em EXATAMENTE 3 faixas de investimento:
   - zero_baixo_custo: Quick Wins, 5S, gestão visual, padronização de processo, adaptações imediatas e baratas.
   - medio_custo: melhorias estruturais moderadas, ergonomia, dispositivos auxiliares, carrinhos, rampas modulares, gabaritos.
   - alto_custo: redesenho completo de layout / MFV Futuro, obras civis estruturais, automação ou equipamentos dedicados.
   - Em cada faixa, o campo "prompt_imagem" deve ser escrito em INGLÊS, descrevendo visualmente a solução implementada no estilo "clean isometric industrial illustration, modern SaaS technical diagram, crisp lighting, minimal annotations, high detail, white studio background".
6. Perguntas para Discussão: formule 2 a 3 perguntas técnicas incisivas que um consultor sênior faria para refinar restrições de espaço, orçamento, segurança (NR), turno ou volume antes da implantação.`;

const ACTION_PLAN_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    titulo: { type: Type.STRING, description: 'Título objetivo e claro da iniciativa.' },
    descricao: {
      type: Type.STRING,
      description: 'Explicação técnica prática de como executar a melhoria no chão de fábrica.',
    },
    ferramenta_lean_aplicada: {
      type: Type.STRING,
      description: 'Principal ferramenta ou conceito Lean aplicado nesta ação.',
    },
    impacto_esperado: {
      type: Type.STRING,
      description: 'Ganho operacional esperado (tempo, ergonomia, produtividade, redução de refugo/espera).',
    },
    prazo_estimado: {
      type: Type.STRING,
      description: 'Prazo realista de implantação (ex: 1 a 3 dias, 2 a 4 semanas, 2 a 4 meses).',
    },
    prompt_imagem: {
      type: Type.STRING,
      description:
        'Prompt em inglês no estilo clean isometric industrial illustration descrevendo a solução implementada.',
    },
  },
  required: [
    'titulo',
    'descricao',
    'ferramenta_lean_aplicada',
    'impacto_esperado',
    'prazo_estimado',
    'prompt_imagem',
  ],
};

const REPORT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resumo_problema: {
      type: Type.STRING,
      description: 'Resumo técnico executivo do gargalo ou problema relatado.',
    },
    diagnostico_lean: {
      type: Type.OBJECT,
      properties: {
        desperdicios_timwoods: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tipo: {
                type: Type.STRING,
                description:
                  'Nome do desperdício TIMWOODS (Transporte, Inventário, Movimentação, Espera, Superprodução, Superprocessamento, Defeitos ou Talento).',
              },
              justificativa: {
                type: Type.STRING,
                description: 'Justificativa técnica ligada diretamente ao problema descrito.',
              },
            },
            required: ['tipo', 'justificativa'],
          },
        },
        causa_raiz_provavel: {
          type: Type.STRING,
          description: 'Análise breve e estruturada da causa raiz usando a lógica dos 5 Porquês.',
        },
        ferramentas_recomendadas: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Lista de ferramentas Lean Manufacturing reais recomendadas para o cenário.',
        },
      },
      required: ['desperdicios_timwoods', 'causa_raiz_provavel', 'ferramentas_recomendadas'],
    },
    diagrama_mermaid: {
      type: Type.STRING,
      description:
        'Código Mermaid.js válido começando com graph LR comparando o fluxo atual com gargalo e o fluxo otimizado, sem caracteres que quebrem o parser.',
    },
    planos_de_acao: {
      type: Type.OBJECT,
      properties: {
        zero_baixo_custo: ACTION_PLAN_SCHEMA,
        medio_custo: ACTION_PLAN_SCHEMA,
        alto_custo: ACTION_PLAN_SCHEMA,
      },
      required: ['zero_baixo_custo', 'medio_custo', 'alto_custo'],
    },
    perguntas_para_discussao: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '2 a 3 perguntas técnicas estratégicas para aprofundar a consultoria no chat.',
    },
  },
  required: [
    'resumo_problema',
    'diagnostico_lean',
    'diagrama_mermaid',
    'planos_de_acao',
    'perguntas_para_discussao',
  ],
};

function getAIClientAndModels() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'sua_chave_gemini_aqui') {
    const error = new Error(
      'GEMINI_API_KEY não configurada. Copie backend/.env.example para backend/.env e insira uma chave válida do Google AI Studio.'
    );
    error.statusCode = 500;
    error.code = 'AI_KEY_MISSING';
    throw error;
  }

  const primaryModel = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const envFallbacks = process.env.AI_FALLBACK_MODELS
    ? process.env.AI_FALLBACK_MODELS.split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : DEFAULT_FALLBACK_MODELS;

  const modelCandidates = Array.from(new Set([primaryModel, ...envFallbacks]));
  const client = new GoogleGenAI({ apiKey });
  return { client, modelCandidates };
}

function formatFriendlyAIError(err) {
  const status = err?.status || err?.statusCode;
  if (status === 503) {
    const friendly = new Error(
      'Os servidores do Gemini estão com pico temporário de demanda (503). Tentamos automaticamente os modelos alternativos — aguarde alguns segundos e tente novamente.'
    );
    friendly.statusCode = 503;
    friendly.code = 'AI_OVERLOADED';
    return friendly;
  }
  if (status === 429) {
    const friendly = new Error(
      'Limite temporário de requisições da API Gemini atingido (429). Aguarde alguns segundos e tente novamente.'
    );
    friendly.statusCode = 429;
    friendly.code = 'AI_RATE_LIMIT';
    return friendly;
  }
  return err;
}

async function generateWithFallback(client, modelCandidates, buildParams) {
  let lastError;

  for (const model of modelCandidates) {
    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        return await client.models.generateContent(buildParams(model));
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.statusCode;
        const isTransient = status === 503 || status === 429;
        const isModelUnavailable = status === 404;

        if (isModelUnavailable) {
          console.warn(`[aiService] Modelo "${model}" indisponível (404). Tentando próximo fallback...`);
          break;
        }

        if (isTransient && attempt === 0) {
          console.warn(`[aiService] Modelo "${model}" sobrecarregado (${status}). Nova tentativa rápida...`);
          await new Promise((resolve) => setTimeout(resolve, 900));
          continue;
        }

        if (isTransient) {
          console.warn(`[aiService] Modelo "${model}" manteve ${status}. Alternando para próximo modelo fallback...`);
          break;
        }

        throw formatFriendlyAIError(err);
      }
    }
  }

  throw formatFriendlyAIError(lastError);
}

function sanitizeMermaidCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    return [
      'graph LR',
      '  subgraph Atual[Fluxo Atual com Gargalo]',
      '    A1[Entrada] --> A2[Gargalo Identificado]',
      '    A2 --> A3[Atraso e Desperdicio]',
      '  end',
      '  subgraph Otimizado[Fluxo Otimizado Lean]',
      '    O1[Entrada Padronizada] --> O2[Fluxo Continuo]',
      '    O2 --> O3[Saida Eficiente]',
      '  end',
    ].join('\n');
  }

  let cleaned = rawCode
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\\n/g, '\n')
    .trim();

  if (!/^graph\s+LR/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(?:flowchart|graph)\s+\w+/i, 'graph LR');
    if (!/^graph\s+LR/i.test(cleaned)) {
      cleaned = `graph LR\n${cleaned}`;
    }
  }

  return cleaned;
}

function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('A IA retornou uma resposta vazia.');
  }

  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(stripped);
}

/**
 * Gera o relatório estruturado de consultoria Lean Manufacturing / MFV.
 * @param {{ segmento: string, setor: string, descricao: string, restricoes?: string }} problemData
 * @returns {Promise<object>} Objeto JSON estruturado do relatório Lean
 */
export async function generateLeanReport(problemData) {
  const { client, modelCandidates } = getAIClientAndModels();

  const userPrompt = [
    'Analise o cenário industrial abaixo e produza o relatório estruturado de consultoria Lean Manufacturing:',
    '',
    ...(problemData.empresa ? [`- Nome da Empresa: ${problemData.empresa}`] : []),
    `- Segmento da Empresa: ${problemData.segmento}`,
    `- Setor / Área Afetada: ${problemData.setor}`,
    `- Observação / Problema no Chão de Fábrica: ${problemData.descricao}`,
    `- Restrições Conhecidas: ${problemData.restricoes?.trim() || 'Nenhuma restrição específica informada inicialmente.'}`,
    '',
    'Retorne rigorosamente o JSON no esquema especificado, respeitando todas as regras de sintaxe do Mermaid (graph LR).',
  ].join('\n');

  const response = await generateWithFallback(client, modelCandidates, (model) => ({
    model,
    contents: userPrompt,
    config: {
      systemInstruction: LEAN_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: REPORT_RESPONSE_SCHEMA,
      temperature: 0.35,
    },
  }));

  const parsed = parseJsonResponse(response.text);

  return {
    resumo_problema: parsed.resumo_problema || '',
    diagnostico_lean: {
      desperdicios_timwoods: Array.isArray(parsed.diagnostico_lean?.desperdicios_timwoods)
        ? parsed.diagnostico_lean.desperdicios_timwoods
        : [],
      causa_raiz_provavel: parsed.diagnostico_lean?.causa_raiz_provavel || '',
      ferramentas_recomendadas: Array.isArray(parsed.diagnostico_lean?.ferramentas_recomendadas)
        ? parsed.diagnostico_lean.ferramentas_recomendadas
        : [],
    },
    diagrama_mermaid: sanitizeMermaidCode(parsed.diagrama_mermaid),
    planos_de_acao: {
      zero_baixo_custo: parsed.planos_de_acao?.zero_baixo_custo || {},
      medio_custo: parsed.planos_de_acao?.medio_custo || {},
      alto_custo: parsed.planos_de_acao?.alto_custo || {},
    },
    perguntas_para_discussao: Array.isArray(parsed.perguntas_para_discussao)
      ? parsed.perguntas_para_discussao.slice(0, 3)
      : [],
  };
}

/**
 * Conduz uma discussão consultiva interativa sobre um relatório Lean já gerado.
 * @param {object} reportContext Contexto completo do relatório (entrada + diagnóstico + planos)
 * @param {Array<{ role: 'user' | 'assistant', content: string }>} chatHistory Histórico anterior da conversa
 * @param {string} userMessage Nova mensagem ou restrição enviada pelo usuário
 * @returns {Promise<string>} Resposta consultiva técnica da IA
 */
export async function discussReport(reportContext, chatHistory = [], userMessage) {
  const { client, modelCandidates } = getAIClientAndModels();

  const discussionSystemPrompt = `Você é um Consultor Sênior Especialista em Lean Manufacturing e MFV continuando o atendimento ao cliente sobre um diagnóstico que você acabou de emitir.

CONTEXTO COMPLETO DO RELATÓRIO ATUAL:
${JSON.stringify(
    {
      entrada_cliente: reportContext.input,
      diagnostico_e_planos: reportContext.analysis,
    },
    null,
    2
  )}

REGRAS PARA A CONVERSA CONSULTIVA:
- Responda sempre em português do Brasil (pt-BR), de forma direta, técnica, empática e prática para o chão de fábrica.
- Quando o cliente informar uma nova restrição (ex: falta de espaço, orçamento travado, turno contínuo, norma de segurança NR-11/NR-12/NR-17), adapte concretamente as recomendações sem repetir todo o relatório anterior.
- Use listas curtas e objetivas, números/estimativas práticas quando fizer sentido (ex: inclinação máxima recomendada para rampa manual, takt time, payback aproximado) e proponha um próximo passo claro.
- Não invente dados que o cliente não forneceu; se faltar uma medida crítica, pergunte de forma pontual ao final.`;

  const contents = [
    ...chatHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const response = await generateWithFallback(client, modelCandidates, (model) => ({
    model,
    contents,
    config: {
      systemInstruction: discussionSystemPrompt,
      temperature: 0.45,
    },
  }));

  const reply = response.text?.trim();
  if (!reply) {
    throw new Error('Não foi possível gerar uma resposta consultiva no momento.');
  }

  return reply;
}
