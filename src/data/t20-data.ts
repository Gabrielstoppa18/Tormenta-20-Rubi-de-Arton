export interface T20Class {
  name: string;
  initialPV: number;
  pvPerLevel: number;
  initialPM: number;
  pmPerLevel: number;
  trainedSkills: string[];
  additionalSkills: number;
}

export interface T20Origin {
  name: string;
  description: string;
  benefits: string[];
}

export const ORIGINS: Record<string, T20Origin> = {
  acolito: {
    name: "Acólito",
    description: "Você serviu em um templo, como noviço ou assistente.",
    benefits: ["Vontade", "Religião", "Membro da Igreja", "Símbolo Sagrado"],
  },
  amigo_dos_animais: {
    name: "Amigo dos Animais",
    description: "Você cresceu entre bichos ou tem uma afinidade natural com eles.",
    benefits: ["Adestramento", "Cavalgar", "Amigo Especial", "Voz dos Bichos"],
  },
  amnesico: {
    name: "Amnésico",
    description: "Você não se lembra de nada do seu passado.",
    benefits: ["Duas perícias quaisquer", "Um poder de destino qualquer"],
  },
  aristocrata: {
    name: "Aristocrata",
    description: "Você nasceu em uma família nobre e influente.",
    benefits: ["Diplomacia", "Nobreza", "Sangue Azul", "Riqueza"],
  },
  artesao: {
    name: "Artesão",
    description: "Você aprendeu um ofício e viveu de seu trabalho manual.",
    benefits: ["Ofício", "Vontade", "Frutos do Trabalho", "Ferramentas de Mestre"],
  },
  assistente_de_laboratorio: {
    name: "Assistente de Laboratório",
    description: "Você ajudou um alquimista ou mago em suas experiências.",
    benefits: ["Ofício (Alquimia)", "Conhecimento", "Cientista", "Mistura Alquímica"],
  },
  batedor: {
    name: "Batedor",
    description: "Você serviu como guia ou explorador em regiões selvagens.",
    benefits: ["Percepção", "Sobrevivência", "Sentidos Aguçados", "Caminho da Floresta"],
  },
  capanga: {
    name: "Capanga",
    description: "Você trabalhou como guarda-costas ou cobrador para criminosos.",
    benefits: ["Intimidação", "Luta", "Confissão", "Valentão"],
  },
  charlatao: {
    name: "Charlatão",
    description: "Você viveu de enganar os outros com truques e lábia.",
    benefits: ["Enganação", "Jogatina", "Impostor", "Lábia"],
  },
  circense: {
    name: "Circense",
    description: "Você viajou com uma trupe de artistas, apresentando-se para o público.",
    benefits: ["Acrobacia", "Atuação", "Equilibrista", "Truque de Mestre"],
  },
  criminoso: {
    name: "Criminoso",
    description: "Você viveu à margem da lei, como ladrão ou contrabandista.",
    benefits: ["Enganação", "Furtividade", "Ladinagem", "Pivete"],
  },
  curandeiro: {
    name: "Curandeiro",
    description: "Você aprendeu a tratar ferimentos e doenças com ervas e rezas.",
    benefits: ["Cura", "Vontade", "Médico", "Mãos de Cura"],
  },
  eremita: {
    name: "Eremita",
    description: "Você viveu isolado do mundo, em meditação ou estudo.",
    benefits: ["Misticismo", "Religião", "Busca Interior", "Solidão"],
  },
  escravo: {
    name: "Escravo",
    description: "Você foi propriedade de outra pessoa e trabalhou sob coerção.",
    benefits: ["Fortitude", "Furtividade", "Duro de Matar", "Vontade de Ferro"],
  },
  estudioso: {
    name: "Estudioso",
    description: "Você dedicou sua vida aos livros e ao conhecimento acadêmico.",
    benefits: ["Conhecimento", "Nobreza", "Palpites", "Biblioteca Pessoal"],
  },
  fazendeiro: {
    name: "Fazendeiro",
    description: "Você trabalhou na terra, cultivando alimentos ou criando gado.",
    benefits: ["Adestramento", "Ofício (Fazendeiro)", "Água no Feijão", "Vigor Rural"],
  },
  forasteiro: {
    name: "Forasteiro",
    description: "Você veio de uma terra distante e exótica.",
    benefits: ["Cultura", "Sobrevivência", "Língua Exótica", "Adaptação"],
  },
  gladiador: {
    name: "Gladiador",
    description: "Você lutou em arenas para o entretenimento das massas.",
    benefits: ["Luta", "Intimidação", "Pão e Circo", "Técnica de Luta"],
  },
  guarda: {
    name: "Guarda",
    description: "Você serviu na milícia de uma cidade ou como guarda de caravana.",
    benefits: ["Investigação", "Luta", "Sentinela", "Abordagem"],
  },
  herdeiro: {
    name: "Herdeiro",
    description: "Você recebeu uma herança inesperada ou um título de família.",
    benefits: ["Nobreza", "Vontade", "Herança", "Contatos"],
  },
  heroi_campones: {
    name: "Herói Camponês",
    description: "Você era uma pessoa comum que se levantou contra uma injustiça.",
    benefits: ["Adestramento", "Ofício", "Voz do Povo", "Coração Valente"],
  },
  mercador: {
    name: "Mercador",
    description: "Você viveu de comprar e vender mercadorias.",
    benefits: ["Diplomacia", "Ofício (Mercador)", "Negociação", "Olho para o Lucro"],
  },
  minerador: {
    name: "Minerador",
    description: "Você trabalhou em minas, extraindo metais ou pedras preciosas.",
    benefits: ["Fortitude", "Ofício (Minerador)", "Sentido do Ouro", "Resistência"],
  },
  nomade: {
    name: "Nômade",
    description: "Você nunca teve um lar fixo, viajando constantemente.",
    benefits: ["Cavalgar", "Sobrevivência", "Mochileiro", "Sentido de Direção"],
  },
  pivete: {
    name: "Pivete",
    description: "Você cresceu nas ruas, sobrevivendo por conta própria.",
    benefits: ["Furtividade", "Ladinagem", "Conhecimento de Ruas", "Agilidade"],
  },
  refugiado: {
    name: "Refugiado",
    description: "Você fugiu de sua terra natal devido a uma guerra ou desastre.",
    benefits: ["Fortitude", "Furtividade", "Sobrevivente", "Resiliência"],
  },
  seguidor: {
    name: "Seguidor",
    description: "Você serviu a um mestre ou mentor, aprendendo com ele.",
    benefits: ["Uma perícia do mestre", "Um poder do mestre"],
  },
  selvagem: {
    name: "Selvagem",
    description: "Você cresceu longe da civilização, em harmonia com a natureza.",
    benefits: ["Percepção", "Sobrevivência", "Vida Selvagem", "Instinto"],
  },
  soldado: {
    name: "Soldado",
    description: "Você serviu em um exército profissional.",
    benefits: ["Fortitude", "Luta", "Influência Militar", "Treinamento"],
  },
  taberneiro: {
    name: "Taberneiro",
    description: "Você trabalhou em uma estalagem ou taverna.",
    benefits: ["Diplomacia", "Ofício (Culinária)", "Bom de Papo", "Vigor"],
  },
  trabalhador: {
    name: "Trabalhador",
    description: "Você realizou trabalhos braçais pesados.",
    benefits: ["Fortitude", "Atletismo", "Esforço Físico", "Resistência"],
  },
};

export interface T20Race {
  name: string;
  description: string;
  modifiers: Record<string, number>;
  abilities: string[];
}

export const DEITIES: Record<string, { name: string; description: string; powers: string[] }> = {
  Khalmyr: {
    name: "Khalmyr",
    description: "O Deus da Justiça.",
    powers: ["Coragem Total", "Espada Justiceira"],
  },
  Nimb: {
    name: "Nimb",
    description: "O Deus do Caos.",
    powers: ["Sorte Maldita", "Poder Oculto"],
  },
  Lena: {
    name: "Lena",
    description: "A Deusa da Vida.",
    powers: ["Cura Gentil", "Aura de Vida"],
  },
};

export const ITEMS: Record<string, { name: string; type: string; damage?: string; weight: number; cost: string }> = {
  "Espada Longa": { name: "Espada Longa", type: "Arma Marcial", damage: "1d8", weight: 1.5, cost: "15 T$" },
  "Arco Curto": { name: "Arco Curto", type: "Arma Simples", damage: "1d6", weight: 1, cost: "30 T$" },
  "Armadura de Couro": { name: "Armadura de Couro", type: "Armadura Leve", weight: 7, cost: "10 T$" },
  "Escudo Leve": { name: "Escudo Leve", type: "Escudo", weight: 2.5, cost: "5 T$" },
};

export const CLASSES: Record<string, T20Class> = {
  paladin: {
    name: "Paladino",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Vontade"],
    additionalSkills: 2,
  },
  warrior: {
    name: "Guerreiro",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Fortitude"],
    additionalSkills: 2,
  },
  arcanist: {
    name: "Arcanista",
    initialPV: 8,
    pvPerLevel: 2,
    initialPM: 6,
    pmPerLevel: 6,
    trainedSkills: ["Misticismo", "Vontade"],
    additionalSkills: 1,
  },
  cleric: {
    name: "Clérigo",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 5,
    pmPerLevel: 5,
    trainedSkills: ["Religião", "Vontade"],
    additionalSkills: 2,
  },
  barbarian: {
    name: "Bárbaro",
    initialPV: 24,
    pvPerLevel: 6,
    initialPM: 2,
    pmPerLevel: 2,
    trainedSkills: ["Fortitude", "Luta"],
    additionalSkills: 4,
  },
  bard: {
    name: "Bardo",
    initialPV: 12,
    pvPerLevel: 3,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Atuação", "Reflexos"],
    additionalSkills: 6,
  },
  rogue: {
    name: "Ladino",
    initialPV: 12,
    pvPerLevel: 3,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Furtividade", "Ladinagem", "Reflexos"],
    additionalSkills: 8,
  },
  knight: {
    name: "Cavaleiro",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Fortitude"],
    additionalSkills: 2,
  },
  ranger: {
    name: "Caçador",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Luta", "Sobrevivência"],
    additionalSkills: 6,
  },
  noble: {
    name: "Nobre",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Diplomacia", "Nobreza"],
    additionalSkills: 4,
  },
  inventor: {
    name: "Inventor",
    initialPV: 12,
    pvPerLevel: 3,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Ofício", "Vontade"],
    additionalSkills: 4,
  },
  druid: {
    name: "Druida",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Sobrevivência", "Vontade"],
    additionalSkills: 4,
  },
  buccaneer: {
    name: "Bucaneiro",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Reflexos"],
    additionalSkills: 4,
  },
  fighter: {
    name: "Lutador",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 2,
    pmPerLevel: 2,
    trainedSkills: ["Luta", "Fortitude"],
    additionalSkills: 4,
  },
};

export const RACES: Record<string, T20Race> = {
  human: {
    name: "Humano",
    description: "Adaptáveis e ambiciosos, os humanos são o povo mais numeroso de Arton.",
    modifiers: {},
    abilities: ["+1 em Três Atributos Diferentes", "Versátil (2 Perícias ou 1 Perícia e 1 Poder Geral)"],
  },
  dwarf: {
    name: "Anão",
    description: "Resilientes e tradicionais, vivem em cidades subterrâneas e são mestres da forja.",
    modifiers: { con: 4, sab: 2, des: -2 },
    abilities: ["Conhecimento das Rochas", "Devagar e Sempre", "Duro como Pedra", "Tradição de Heredrimm"],
  },
  dahllan: {
    name: "Dahllan",
    description: "Meio-dríades com forte ligação com a natureza e as plantas.",
    modifiers: { sab: 4, des: 2, int: -2 },
    abilities: ["Amiga das Plantas", "Armadura de Allihanna", "Empatia Selvagem"],
  },
  elf: {
    name: "Elfo",
    description: "Seres de vida longa e grande afinidade mágica, outrora orgulhosos, hoje buscam seu destino.",
    modifiers: { int: 4, des: 2, con: -2 },
    abilities: ["Graça de Glórienn", "Sangue Mágico", "Sentidos Élficos"],
  },
  goblin: {
    name: "Goblin",
    description: "Pequenos, engenhosos e frequentemente subestimados, sobrevivem em qualquer lugar.",
    modifiers: { des: 4, int: 2, car: -2 },
    abilities: ["Engenhoso", "Rato de Esgoto", "Tamanho Pequeno"],
  },
  lefeu: {
    name: "Lefou",
    description: "Indivíduos tocados pela Tormenta, carregando deformidades e poderes aberrantes.",
    modifiers: { car: -2 },
    abilities: ["Deformidade (2 Poderes da Tormenta)", "Visão no Escuro"],
  },
  minotaur: {
    name: "Minotauro",
    description: "Povo forte e honrado, com cabeça de touro e grande força física.",
    modifiers: { for: 4, con: 2, sab: -2 },
    abilities: ["Chifres", "Faro", "Medo de Altura"],
  },
  qareen: {
    name: "Qareen",
    description: "Descendentes de gênios, possuem magia no sangue e o desejo de servir.",
    modifiers: { car: 4, int: 2 },
    abilities: ["Desejos", "Resistência Elemental"],
  },
  golem: {
    name: "Golem",
    description: "Constructos animados por magia ou tecnologia, sem necessidades biológicas.",
    modifiers: { for: 4, con: 2, car: -2 },
    abilities: ["Canalizar Energia", "Sem Fôlego", "Chassi de Metal/Madeira/Pedra"],
  },
  hynne: {
    name: "Hynne",
    description: "Pequenos e ágeis, conhecidos por sua sorte e habilidade com arremessos.",
    modifiers: { des: 4, car: 2, for: -2 },
    abilities: ["Arremesso", "Sorte Pequena", "Tamanho Pequeno"],
  },
  medusa: {
    name: "Medusa",
    description: "Seres com serpentes no lugar de cabelos e um olhar que pode paralisar.",
    modifiers: { car: 4, des: 2 },
    abilities: ["Olhar Petrificante", "Serpentes"],
  },
  osteon: {
    name: "Osteon",
    description: "Mortos-vivos esqueléticos que mantêm sua consciência e buscam um propósito.",
    modifiers: { con: -2 },
    abilities: ["Armadura de Ossos", "Memória Póstuma", "Natureza Esquelética"],
  },
  silfide: {
    name: "Sílfide",
    description: "Pequenas fadas das florestas, curiosas e dotadas de magia natural.",
    modifiers: { car: 4, des: 2, for: -2 },
    abilities: ["Asas", "Magia de Fada", "Tamanho Minúsculo"],
  },
  sereia_tritao: {
    name: "Sereia/Tritão",
    description: "Povo dos mares, capazes de viver tanto na água quanto na terra.",
    modifiers: { car: 2, sab: 2, for: 2 },
    abilities: ["Anfíbio", "Mestre das Marés"],
  },
  kliren: {
    name: "Kliren",
    description: "Híbridos de humanos e gnomos, mestres da tecnologia e engenhosidade.",
    modifiers: { int: 4, car: 2, for: -2 },
    abilities: ["Híbrido", "Vanguarda Tecnológica"],
  },
  trog: {
    name: "Trog (Torg)",
    description: "Homens-lagarto brutais e resistentes, conhecidos por seu mau cheiro defensivo.",
    modifiers: { con: 4, for: 2, int: -2 },
    abilities: ["Mordida", "Pele de Musgo", "Mau Cheiro"],
  },
  aggelus: {
    name: "Aggelus (Suraggel)",
    description: "Descendentes de seres celestiais, os Aggelus são conhecidos por sua sabedoria e luz interior.",
    modifiers: { sab: 4, car: 2 },
    abilities: ["Herança Divina", "Luz", "Visão no Escuro"],
  },
  sulfure: {
    name: "Sulfure (Suraggel)",
    description: "Descendentes de seres abissais, os Sulfure possuem uma natureza sombria e astuta.",
    modifiers: { des: 4, int: 2 },
    abilities: ["Herança Sombria", "Escuridão", "Visão no Escuro"],
  },
};

export const SKILLS_ATTRIBUTES: Record<string, string> = {
  "Acrobacia": "des",
  "Adestramento": "car",
  "Atletismo": "for",
  "Atuação": "car",
  "Cavalaria": "des",
  "Conhecimento": "int",
  "Cura": "sab",
  "Diplomacia": "car",
  "Enganação": "car",
  "Fortitude": "con",
  "Furtividade": "des",
  "Guerra": "int",
  "Iniciativa": "des",
  "Intimidação": "car",
  "Intuição": "sab",
  "Investigação": "int",
  "Jogatina": "car",
  "Ladinagem": "des",
  "Luta": "for",
  "Misticismo": "int",
  "Nobreza": "int",
  "Ofício": "int",
  "Percepção": "sab",
  "Pilotagem": "des",
  "Pontaria": "des",
  "Reflexos": "des",
  "Religião": "sab",
  "Sobrevivência": "sab",
  "Vontade": "sab",
};

export interface T20Power {
  id?: string;
  name: string;
  description: string;
  requirements: string[];
}

export const POWERS: T20Power[] = [
  // --- Poderes Gerais ---
  {
    name: "Ataque Poderoso",
    description: "Você pode sofrer -2 em testes de ataque para receber +5 em testes de dano.",
    requirements: ["FOR 13", "Luta treinada"],
  },
  {
    name: "Reflexos de Combate",
    description: "Você recebe uma ação de movimento extra na primeira rodada.",
    requirements: ["DES 13"],
  },
  {
    name: "Vitalidade",
    description: "Você recebe +2 PV por nível.",
    requirements: ["CON 13"],
  },
  {
    name: "Vontade de Ferro",
    description: "Você recebe +1 PM por nível.",
    requirements: ["SAB 13"],
  },
  {
    name: "Esquiva",
    description: "Você recebe +2 em Defesa e Reflexos.",
    requirements: ["DES 13"],
  },
  {
    name: "Foco em Arma",
    description: "Você recebe +2 em testes de ataque com uma arma escolhida.",
    requirements: ["Luta ou Pontaria treinada"],
  },
  // --- Habilidades de Raça (Poderes) ---
  {
    name: "Versátil",
    description: "Você se torna treinado em duas perícias a sua escolha ou uma perícia e um poder geral.",
    requirements: ["Raça: Humano"],
  },
  {
    name: "Conhecimento das Rochas",
    description: "Você recebe visão no escuro e +2 em testes de Percepção e Sobrevivência realizados no subterrâneo.",
    requirements: ["Raça: Anão"],
  },
  {
    name: "Devagar e Sempre",
    description: "Seu deslocamento é 6m, mas não é reduzido por uso de armadura ou excesso de carga.",
    requirements: ["Raça: Anão"],
  },
  {
    name: "Duro como Pedra",
    description: "Você recebe +3 PV no 1º nível e +1 por nível seguinte.",
    requirements: ["Raça: Anão"],
  },
  {
    name: "Tradição de Heredrimm",
    description: "Você é perito nas armas tradicionais anãs e recebe +2 em ataques com elas.",
    requirements: ["Raça: Anão"],
  },
  {
    name: "Amiga das Plantas",
    description: "Você pode lançar a magia Controlar Plantas (SAB). Se aprender novamente, custo diminui em -1 PM.",
    requirements: ["Raça: Dahllan"],
  },
  {
    name: "Armadura de Allihanna",
    description: "Pode gastar ação de movimento e 1 PM para receber +2 na Defesa até o fim da cena.",
    requirements: ["Raça: Dahllan"],
  },
  {
    name: "Empatia Selvagem",
    description: "Pode se comunicar com animais e usar Adestramento para mudar atitude e persuasão.",
    requirements: ["Raça: Dahllan"],
  },
  {
    name: "Graça de Glórienn",
    description: "Seu deslocamento é 12m (em vez de 9m).",
    requirements: ["Raça: Elfo"],
  },
  {
    name: "Sangue Mágico",
    description: "Você recebe +1 ponto de mana por nível.",
    requirements: ["Raça: Elfo"],
  },
  {
    name: "Sentidos Élficos",
    description: "Você recebe visão na penumbra e +2 em Misticismo e Percepção.",
    requirements: ["Raça: Elfo"],
  },
  {
    name: "Engenhoso",
    description: "Você recebe +2 em testes de perícias baseadas em Inteligência e pode usar qualquer perícia de Inteligência mesmo sem ser treinado.",
    requirements: ["Raça: Goblin"],
  },
  {
    name: "Rato de Esgoto",
    description: "Você recebe +2 em Fortitude e é imune a doenças.",
    requirements: ["Raça: Goblin"],
  },
  {
    name: "Chifres",
    description: "Você possui uma arma natural de chifres (dano 1d6, crítico x2, perfuração).",
    requirements: ["Raça: Minotauro"],
  },
  {
    name: "Faro",
    description: "Você recebe +2 em testes de Percepção e Sobrevivência para rastrear usando o olfato.",
    requirements: ["Raça: Minotauro"],
  },
  {
    name: "Desejos",
    description: "Se alguém pedir algo e você cumprir, a magia custa -1 PM.",
    requirements: ["Raça: Qareen"],
  },
  {
    name: "Resistência Elemental",
    description: "Conforme sua ascendência, você recebe resistência 10 a um elemento.",
    requirements: ["Raça: Qareen"],
  },
  {
    name: "Olhar Petrificante",
    description: "Pode gastar 1 PM para paralisar um alvo com o olhar (vontade anula).",
    requirements: ["Raça: Medusa"],
  },
  {
    name: "Serpentes",
    description: "Suas serpentes fornecem uma arma natural (dano 1d4, veneno).",
    requirements: ["Raça: Medusa"],
  },
  {
    name: "Armadura de Ossos",
    description: "Você recebe RD 5 contra corte, perfuração e frio.",
    requirements: ["Raça: Osteon"],
  },
  {
    name: "Memória Póstuma",
    description: "Você recebe uma habilidade de raça de sua vida passada.",
    requirements: ["Raça: Osteon"],
  },
  {
    name: "Asas",
    description: "Você possui asas e pode voar com deslocamento de 12m.",
    requirements: ["Raça: Sílfide"],
  },
  {
    name: "Magia de Fada",
    description: "Você pode lançar magias de ilusão ou encantamento com custo reduzido.",
    requirements: ["Raça: Sílfide"],
  },
  {
    name: "Anfíbio",
    description: "Você pode respirar debaixo d'água e possui deslocamento de natação igual ao terrestre.",
    requirements: ["Raça: Sereia/Tritão"],
  },
  {
    name: "Mestre das Marés",
    description: "Você pode lançar magias de água ou gelo com bônus.",
    requirements: ["Raça: Sereia/Tritão"],
  },
  {
    name: "Mau Cheiro",
    description: "Alvos adjacentes devem passar em Fortitude ou ficam enjoados.",
    requirements: ["Raça: Trog (Torg)"],
  },
  {
    name: "Pele de Musgo",
    description: "Você recebe +2 na Defesa.",
    requirements: ["Raça: Trog (Torg)"],
  },
  {
    name: "Herança Divina",
    description: "Você recebe +2 em Diplomacia e Intuição.",
    requirements: ["Raça: Aggelus (Suraggel)"],
  },
  {
    name: "Luz",
    description: "Você pode lançar a magia Luz (como magia divina; atributo-chave Sabedoria).",
    requirements: ["Raça: Aggelus (Suraggel)"],
  },
  {
    name: "Herança Sombria",
    description: "Você recebe +2 em Enganação e Furtividade.",
    requirements: ["Raça: Sulfure (Suraggel)"],
  },
  {
    name: "Escuridão",
    description: "Você pode lançar a magia Escuridão (como magia arcana; atributo-chave Inteligência).",
    requirements: ["Raça: Sulfure (Suraggel)"],
  },
  {
    name: "Híbrido",
    description: "Você recebe +2 em testes de perícia baseados em Inteligência.",
    requirements: ["Raça: Kliren"],
  },
  {
    name: "Vanguarda Tecnológica",
    description: "Você é treinado em Ofício (Engenho) e recebe um item tecnológico.",
    requirements: ["Raça: Kliren"],
  },
  {
    name: "Chifres",
    description: "Você possui uma arma natural de chifres (dano 1d6, perfuração).",
    requirements: ["Raça: Minotauro"],
  },
  {
    name: "Faro",
    description: "Você recebe +2 em Percepção para sentir cheiros e ignora camuflagem por escuridão contra alvos a até 9m.",
    requirements: ["Raça: Minotauro"],
  },
  {
    name: "Medo de Altura",
    description: "Você fica abalado se estiver em um local alto e sem proteção.",
    requirements: ["Raça: Minotauro"],
  },
  {
    name: "Desejos",
    description: "Se lançar uma magia que alguém pediu, o custo da magia diminui em -1 PM.",
    requirements: ["Raça: Qareen"],
  },
  {
    name: "Canalizar Energia",
    description: "Você pode gastar uma ação padrão e 1 PM para recuperar PV igual ao seu nível.",
    requirements: ["Raça: Golem"],
  },
  {
    name: "Sem Fôlego",
    description: "Você não precisa respirar e é imune a efeitos que dependem de respiração.",
    requirements: ["Raça: Golem"],
  },
  {
    name: "Arremesso",
    description: "Você recebe +2 em testes de ataque com armas de arremesso.",
    requirements: ["Raça: Hynne"],
  },
  {
    name: "Sorte Pequena",
    description: "Você pode gastar 1 PM para rolar novamente um teste de perícia (exceto ataque).",
    requirements: ["Raça: Hynne"],
  },
  {
    name: "Natureza Esquelética",
    description: "Você é um morto-vivo. Recebe imunidade a efeitos metabólicos e cansaço.",
    requirements: ["Raça: Osteon"],
  },
  {
    name: "Mordida",
    description: "Você possui uma arma natural de mordida (dano 1d6, corte).",
    requirements: ["Raça: Trog (Torg)"],
  },
  // Poderes de Origem
  {
    name: "Membro da Igreja",
    description: "Você pode conseguir hospedagem e alimentação gratuitas em templos de sua divindade.",
    requirements: ["Origem: Acólito"],
  },
  {
    name: "Amigo Especial",
    description: "Você recebe um animal de estimação que lhe concede +2 em uma perícia.",
    requirements: ["Origem: Amigo dos Animais"],
  },
  {
    name: "Sangue Azul",
    description: "Você recebe +2 em Diplomacia e Nobreza.",
    requirements: ["Origem: Aristocrata"],
  },
  {
    name: "Frutos do Trabalho",
    description: "Você pode fabricar itens em metade do tempo normal.",
    requirements: ["Origem: Artesão"],
  },
  {
    name: "Cientista",
    description: "Você pode usar Inteligência em vez de Sabedoria para Sobrevivência.",
    requirements: ["Origem: Assistente de Laboratório"],
  },
  {
    name: "Sentidos Aguçados",
    description: "Você recebe +2 em Percepção e ignora camuflagem leve.",
    requirements: ["Origem: Batedor"],
  },
  {
    name: "Confissão",
    description: "Você recebe +2 em Intimidação e pode forçar alvos a falar a verdade.",
    requirements: ["Origem: Capanga"],
  },
  {
    name: "Impostor",
    description: "Você pode usar Enganação para substituir qualquer perícia de Conhecimento.",
    requirements: ["Origem: Charlatão"],
  },
  {
    name: "Equilibrista",
    description: "Você recebe +2 em Acrobacia e Atletismo.",
    requirements: ["Origem: Circense"],
  },
  {
    name: "Pivete",
    description: "Você pode usar Ladinagem para bater carteiras como uma ação de movimento.",
    requirements: ["Origem: Criminoso"],
  },
  {
    name: "Médico",
    description: "Você pode usar Cura para estabilizar personagens como uma ação livre.",
    requirements: ["Origem: Curandeiro"],
  },
  {
    name: "Busca Interior",
    description: "Você recebe +2 em Vontade e pode meditar para recuperar PM.",
    requirements: ["Origem: Eremita"],
  },
  {
    name: "Duro de Matar",
    description: "Uma vez por aventura, você pode ignorar um dano que o levaria a 0 PV.",
    requirements: ["Origem: Escravo"],
  },
  {
    name: "Palpites",
    description: "Você pode gastar 1 PM para receber um bônus de +2 em um teste de perícia.",
    requirements: ["Origem: Estudioso"],
  },
  {
    name: "Água no Feijão",
    description: "Você pode alimentar até o dobro de pessoas com uma refeição.",
    requirements: ["Origem: Fazendeiro"],
  },
  {
    name: "Língua Exótica",
    description: "Você fala dois idiomas adicionais.",
    requirements: ["Origem: Forasteiro"],
  },
  {
    name: "Pão e Circo",
    description: "Você recebe +2 em Luta e Atuação.",
    requirements: ["Origem: Gladiador"],
  },
  {
    name: "Sentinela",
    description: "Você não pode ser surpreendido enquanto estiver acordado.",
    requirements: ["Origem: Guarda"],
  },
  {
    name: "Herança",
    description: "Você começa com um item de valor de até 500 T.",
    requirements: ["Origem: Herdeiro"],
  },
  {
    name: "Voz do Povo",
    description: "Você recebe +2 em Diplomacia e pode pedir ajuda a camponeses.",
    requirements: ["Origem: Herói Camponês"],
  },
  {
    name: "Negociação",
    description: "Você recebe 10% de desconto em compras e 10% de bônus em vendas.",
    requirements: ["Origem: Mercador"],
  },
  {
    name: "Sentido do Ouro",
    description: "Você pode sentir a presença de metais preciosos a até 9m.",
    requirements: ["Origem: Minerador"],
  },
  {
    name: "Mochileiro",
    description: "Sua carga máxima é aumentada em 5 espaços.",
    requirements: ["Origem: Nômade"],
  },
  {
    name: "Conhecimento de Ruas",
    description: "Você recebe +2 em Investigação e sabe onde encontrar itens ilegais.",
    requirements: ["Origem: Pivete"],
  },
  {
    name: "Sobrevivente",
    description: "Você recebe +2 em Fortitude e Sobrevivência.",
    requirements: ["Origem: Refugiado"],
  },
  {
    name: "Vida Selvagem",
    description: "Você pode se comunicar com animais e recebe +2 em Adestramento.",
    requirements: ["Origem: Selvagem"],
  },
  {
    name: "Influência Militar",
    description: "Você pode pedir favores a organizações militares.",
    requirements: ["Origem: Soldado"],
  },
  {
    name: "Bom de Papo",
    description: "Você recebe +2 em Diplomacia e Jogatina.",
    requirements: ["Origem: Taberneiro"],
  },
  {
    name: "Esforço Físico",
    description: "Você pode gastar 1 PM para receber +2 em um teste de Atletismo ou Fortitude.",
    requirements: ["Origem: Trabalhador"],
  },
];

export interface T20Spell {
  name: string;
  circle: number;
  school: string;
  description: string;
  type: "Arcana" | "Divina";
}

export const SPELLS: T20Spell[] = [
  {
    name: "Chamas de Khalmyr",
    circle: 1,
    school: "Evocação",
    description: "Um pilar de fogo sagrado desce dos céus.",
    type: "Divina",
  },
  {
    name: "Seta Infalível de Talude",
    circle: 1,
    school: "Evocação",
    description: "Setas de energia mágica que nunca erram.",
    type: "Arcana",
  },
];
