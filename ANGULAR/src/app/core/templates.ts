import type { Graph, Roadmap, RoadmapSummary } from './models';
export interface StudyTemplate {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  steps: string[];
  theme: string;
}
export const templates: StudyTemplate[] = [
  {
    slug: 'desenvolvimento-web',
    title: 'Desenvolvimento Web Completo',
    description:
      'Do primeiro HTML à sua primeira aplicação. Construa uma base sólida, um projeto por vez.',
    category: 'Tecnologia',
    tags: ['Programação', 'Do zero'],
    icon: 'code',
    theme: 'blue',
    steps: [
      'Fundamentos da web',
      'HTML e CSS',
      'JavaScript',
      'Seu primeiro projeto',
      'Aplicações e APIs',
    ],
  },
  {
    slug: 'product-design',
    title: 'Product Design do Zero',
    description: 'Transforme boas perguntas em experiências que fazem sentido para as pessoas.',
    category: 'Criatividade',
    tags: ['Design', 'Produto'],
    icon: 'layers',
    theme: 'teal',
    steps: [
      'Entender o problema',
      'Pesquisa com pessoas',
      'Arquitetura da informação',
      'Prototipar ideias',
      'Testar e aprender',
    ],
  },
  {
    slug: 'inteligencia-artificial',
    title: 'Inteligência Artificial na Prática',
    description: 'Entenda os conceitos, explore ferramentas e crie seus primeiros experimentos.',
    category: 'Tecnologia',
    tags: ['IA', 'Prática'],
    icon: 'sparkles',
    theme: 'coral',
    steps: [
      'O que é inteligência artificial',
      'Dados e modelos',
      'Aprender com exemplos',
      'Primeiro experimento',
      'Avaliar os resultados',
    ],
  },
  {
    slug: 'ingles',
    title: 'Inglês para Novos Caminhos',
    description:
      'Uma rotina possível para ampliar seu vocabulário e ganhar confiança ao conversar.',
    category: 'Idiomas',
    tags: ['Inglês', 'Rotina'],
    icon: 'globe',
    theme: 'violet',
    steps: [
      'Comece pelo cotidiano',
      'Escuta ativa',
      'Vocabulário em contexto',
      'Conversas curtas',
      'Leitura e prática',
    ],
  },
  {
    slug: 'fotografia',
    title: 'Um Novo Olhar para a Fotografia',
    description: 'Aprenda a observar luz, composição e histórias antes do próximo clique.',
    category: 'Criatividade',
    tags: ['Fotografia', 'Criação'],
    icon: 'camera',
    theme: 'amber',
    steps: [
      'Aprender a observar',
      'Luz e exposição',
      'Composição',
      'Fotografar uma história',
      'Selecionar e editar',
    ],
  },
  {
    slug: 'estudo',
    title: 'Aprender a Aprender',
    description:
      'Encontre uma rotina de estudos que respeite seu tempo e transforme intenção em prática.',
    category: 'Desenvolvimento pessoal',
    tags: ['Estudos', 'Organização'],
    icon: 'book',
    theme: 'mint',
    steps: [
      'Defina um objetivo',
      'Prepare seu ambiente',
      'Estudo ativo',
      'Revisão espaçada',
      'Acompanhe sua evolução',
    ],
  },
];
export function templateGraph(template: StudyTemplate): Graph {
  const nodes = template.steps.map((title, i) => ({
    id: crypto.randomUUID(),
    title,
    type: i === template.steps.length - 1 ? 'project' : 'module',
    description: 'Adicione suas anotações, materiais e atividades para esta etapa.',
    required: true,
    position: { x: i === 0 ? 300 : i % 2 === 1 ? 140 : 460, y: 60 + Math.ceil(i / 2) * 170 },
    color: i === 0 ? '#a855f7' : i === template.steps.length - 1 ? '#d946ef' : '#7c3aed',
    resources: [],
  }));
  return {
    nodes,
    edges: nodes.slice(1).map((node, i) => ({
      id: crypto.randomUUID(),
      source: nodes[i === 0 ? 0 : Math.max(0, i - 1)].id,
      target: node.id,
      type: 'path',
    })),
  };
}
export function templateRoadmap(template: StudyTemplate): Roadmap & RoadmapSummary {
  return {
    id: template.slug,
    title: template.title,
    description: template.description,
    category: template.category,
    tags: template.tags,
    graph: templateGraph(template),
    ownerId: '',
    authorName: 'Modelo de inspiração',
    visibility: 'public',
    revision: 1,
    nodeCount: template.steps.length,
    likes: 0,
    followers: 0,
    createdAt: '',
    updatedAt: '',
    publishedAt: null,
  };
}
