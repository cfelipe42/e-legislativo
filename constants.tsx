
import { Councilman, Bill, VoteValue } from './types';

export const INITIAL_COUNCILMEN: Councilman[] = [
  { id: '1', name: 'Ana Silva', party: 'PT', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/ana/100/100' },
  { id: '2', name: 'Bruno Mendes', party: 'PL', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/bruno/100/100' },
  { id: '3', name: 'Carla Souza', party: 'MDB', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/carla/100/100' },
  { id: '4', name: 'Diego Ramos', party: 'PSDB', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/diego/100/100' },
  { id: '5', name: 'Elena Costa', party: 'REDE', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/elena/100/100' },
  { id: '6', name: 'Fabio Junior', party: 'PP', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/fabio/100/100' },
  { id: '7', name: 'Gisele B.', party: 'PV', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/gisele/100/100' },
  { id: '8', name: 'Hugo Lima', party: 'PDT', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/hugo/100/100' },
  { id: '9', name: 'Iara Neves', party: 'PSOL', isPresent: false, currentVote: VoteValue.PENDING, avatar: 'https://picsum.photos/seed/iara/100/100' },
];

export const INITIAL_BILLS: Bill[] = [
  {
    id: 'PL-001',
    title: 'Modernização da Iluminação Pública',
    description: 'Substituição de todas as lâmpadas de vapor de sódio por LED em vias públicas.',
    author: 'Ver. Ana Silva',
    category: 'Infraestrutura',
    status: 'PENDING',
    fullText: `Art. 1º - Fica o Poder Executivo Municipal autorizado a implementar o Programa de Modernização da Iluminação Pública, consistente na substituição integral das luminárias de vapor de sódio por tecnologia LED (Light Emitting Diode).\n\nArt. 2º - A modernização abrangerá todas as vias, praças e logradouros públicos do perímetro urbano e distritos.\n\nArt. 3º - Os objetivos primordiais deste projeto são:\nI - Redução do consumo de energia elétrica em até 50%;\nII - Melhoria da segurança pública através de maior luminosidade;\nIII - Redução dos custos de manutenção, dada a maior vida útil dos equipamentos LED.\n\nArt. 4º - As despesas decorrentes desta Lei correrão por conta de dotações orçamentárias próprias, suplementadas se necessário.`
  },
  {
    id: 'PL-002',
    title: 'Programa Merenda Saudável',
    description: 'Inclusão obrigatória de alimentos orgânicos da agricultura familiar nas escolas municipais.',
    author: 'Ver. Elena Costa',
    category: 'Educação',
    status: 'PENDING',
    fullText: `Art. 1º - Institui o Programa Merenda Saudável na rede municipal de ensino, visando a segurança alimentar dos alunos.\n\nArt. 2º - Fica estabelecido o percentual mínimo de 30% para aquisição de gêneros alimentícios diretamente da agricultura familiar e de empreendedores familiares rurais.\n\nArt. 3º - Será dada prioridade aos assentamentos da reforma agrária, comunidades tradicionais indígenas e comunidades quilombolas.\n\nArt. 4º - O cardápio escolar deverá ser elaborado por nutricionista habilitado, priorizando alimentos "in natura" e minimamente processados.`
  }
];
