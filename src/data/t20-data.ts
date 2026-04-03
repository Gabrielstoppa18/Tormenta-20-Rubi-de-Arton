export interface T20Class {
  name: string;
  initialPV: number;
  pvPerLevel: number;
  initialPM: number;
  pmPerLevel: number;
  trainedSkills: string[];
  additionalSkills: number;
}

export interface T20Race {
  name: string;
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
  Paladino: {
    name: "Paladino",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Vontade"],
    additionalSkills: 2,
  },
  Guerreiro: {
    name: "Guerreiro",
    initialPV: 20,
    pvPerLevel: 5,
    initialPM: 3,
    pmPerLevel: 3,
    trainedSkills: ["Luta", "Fortitude"],
    additionalSkills: 2,
  },
  Arcanista: {
    name: "Arcanista",
    initialPV: 8,
    pvPerLevel: 2,
    initialPM: 6,
    pmPerLevel: 6,
    trainedSkills: ["Misticismo", "Vontade"],
    additionalSkills: 1,
  },
  Clérigo: {
    name: "Clérigo",
    initialPV: 16,
    pvPerLevel: 4,
    initialPM: 5,
    pmPerLevel: 5,
    trainedSkills: ["Religião", "Vontade"],
    additionalSkills: 2,
  },
  Bárbaro: {
    name: "Bárbaro",
    initialPV: 24,
    pvPerLevel: 6,
    initialPM: 2,
    pmPerLevel: 2,
    trainedSkills: ["Fortitude", "Luta"],
    additionalSkills: 4,
  },
  Bardo: {
    name: "Bardo",
    initialPV: 12,
    pvPerLevel: 3,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Atuação", "Reflexos"],
    additionalSkills: 6,
  },
  Ladino: {
    name: "Ladino",
    initialPV: 12,
    pvPerLevel: 3,
    initialPM: 4,
    pmPerLevel: 4,
    trainedSkills: ["Furtividade", "Ladinagem", "Reflexos"],
    additionalSkills: 8,
  },
};

export const RACES: Record<string, T20Race> = {
  Humano: {
    name: "Humano",
    modifiers: {}, // Choice based
    abilities: ["1 Perícia extra", "1 Poder extra"],
  },
  Sílfide: {
    name: "Sílfide",
    modifiers: { car: 4, des: 2, for: -2 },
    abilities: ["Asas", "Magia de Fada"],
  },
  Lefou: {
    name: "Lefou",
    modifiers: { car: -2 },
    abilities: ["Deformidade", "Visão no Escuro"],
  },
  Qareen: {
    name: "Qareen",
    modifiers: { car: 4, int: 2 },
    abilities: ["Desejos", "Resistência Elemental"],
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
  name: string;
  description: string;
  requirements: string[];
}

export const POWERS: T20Power[] = [
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
