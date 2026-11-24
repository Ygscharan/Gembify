export const QUICK_EXAMPLES = [
  {
    id: 'sacolas-degrau',
    badge: 'Intralogística & Ergonomia',
    accent: 'emerald',
    title: 'Fábrica de Sacolas: Degrau no Depósito',
    summary: 'Paleteira trava no degrau central e exige descarga manual dos fardos.',
    payload: {
      empresa: 'Sacolas Brasil Embalagens Ltda',
      segmento: 'Indústria de Embalagens e Sacolas Plásticas',
      setor: 'Depósito de Produtos Acabados e Expedição',
      descricao:
        'Há um degrau de aproximadamente 18 cm no meio do corredor principal do depósito onde o palete trava na paleteira manual. Os funcionários precisam parar o transporte, descarregar os fardos de sacolas na mão, passar os fardos por cima do desnível e remontar o palete do outro lado. Isso gera fila na expedição, atraso no carregamento dos caminhões e reclamações frequentes de fadiga lombar.',
      restricoes:
        'A expedição funciona continuamente das 07h às 18h e não pode ficar interditada durante o expediente; orçamento inicial reduzido para grandes obras civis.',
    },
  },
  {
    id: 'metalurgica-setup',
    badge: 'SMED & Produtividade',
    accent: 'amber',
    title: 'Metalúrgica: Setup Lento nas Prensas',
    summary: '55 min perdidos por troca de matriz com busca de ferramentas e refugo inicial.',
    payload: {
      empresa: 'MetalForma Estamparia Industrial',
      segmento: 'Metalúrgica e Estamparia Industrial',
      setor: 'Linha de Prensas e Dobradeiras',
      descricao:
        'Cada troca de lote nas dobradeiras leva cerca de 55 minutos porque os operadores precisam andar até o almoxarifado procurando chaves e matrizes sem identificação, fazer ajustes manuais por tentativa e erro e descartar as primeiras 15 peças como refugo até acertar o ângulo da dobra. Como os clientes estão pedindo lotes menores, passamos quase 30% do turno parados em setup.',
      restricoes:
        'Equipe enxuta de 2 operadores por turno e sem previsão de compra de nova máquina CNC pelos próximos 12 meses.',
    },
  },
];
