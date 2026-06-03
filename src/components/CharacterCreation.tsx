import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Plus, Minus, Sparkles, Check, Book, Sword, Star } from 'lucide-react';
import { compendiumService, type Race as CompendiumRace, type Class as CompendiumClass, type Origin as CompendiumOrigin } from '../lib/compendium';
import { characterService } from '../lib/character';
import { cn } from '../lib/utils';
import { CLASSES, RACES, SPELLS, POWERS, ITEMS, SKILLS_ATTRIBUTES, T20Power } from '../data/t20-data';
import { CLASS_POWERS } from '../data/class-powers';
import { calculatePV, calculatePM } from '../lib/t20-logic';

// ---------------------------------------------------------------------------
// Canonical class data (source: T20 JdA Capítulo 1, Tabela 1-3 + class pages)
// ---------------------------------------------------------------------------

interface MandatoryGroup {
  type: 'fixed';
  skill: string;
}
interface ChoiceGroup {
  type: 'choice';
  options: string[];
}
type SkillGroup = MandatoryGroup | ChoiceGroup;

interface ClassSkillData {
  mandatory: SkillGroup[];
  optionalPool: string[];
  optionalCount: number;
  isSpellcaster: boolean;
  spellType?: 'arcana' | 'divina' | 'universal';
  initialSpells: number;
}

const CLASS_SKILL_DATA: Record<string, ClassSkillData> = {
  arcanist: {
    mandatory: [{ type: 'fixed', skill: 'Misticismo' }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Conhecimento', 'Diplomacia', 'Enganação', 'Guerra', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Nobreza', 'Ofício', 'Percepção'],
    optionalCount: 2,
    isSpellcaster: true,
    spellType: 'arcana',
    initialSpells: 3,
  },
  barbarian: {
    mandatory: [{ type: 'fixed', skill: 'Fortitude' }, { type: 'fixed', skill: 'Luta' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Iniciativa', 'Intimidação', 'Ofício', 'Percepção', 'Pontaria', 'Sobrevivência', 'Vontade'],
    optionalCount: 4,
    isSpellcaster: false,
    initialSpells: 0,
  },
  bard: {
    mandatory: [{ type: 'fixed', skill: 'Atuação' }, { type: 'fixed', skill: 'Reflexos' }],
    optionalPool: ['Acrobacia', 'Cavalgar', 'Conhecimento', 'Diplomacia', 'Enganação', 'Furtividade', 'Iniciativa', 'Intuição', 'Investigação', 'Jogatina', 'Ladinagem', 'Luta', 'Misticismo', 'Nobreza', 'Percepção', 'Pontaria', 'Vontade'],
    optionalCount: 6,
    isSpellcaster: true,
    spellType: 'universal',
    initialSpells: 2,
  },
  buccaneer: {
    mandatory: [{ type: 'choice', options: ['Luta', 'Pontaria'] }, { type: 'fixed', skill: 'Reflexos' }],
    optionalPool: ['Acrobacia', 'Atletismo', 'Atuação', 'Enganação', 'Fortitude', 'Furtividade', 'Iniciativa', 'Intimidação', 'Jogatina', 'Luta', 'Ofício', 'Percepção', 'Pilotagem', 'Pontaria'],
    optionalCount: 4,
    isSpellcaster: false,
    initialSpells: 0,
  },
  ranger: {
    mandatory: [{ type: 'choice', options: ['Luta', 'Pontaria'] }, { type: 'fixed', skill: 'Sobrevivência' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Cura', 'Fortitude', 'Furtividade', 'Iniciativa', 'Investigação', 'Luta', 'Ofício', 'Percepção', 'Pontaria', 'Reflexos'],
    optionalCount: 6,
    isSpellcaster: false,
    initialSpells: 0,
  },
  knight: {
    mandatory: [{ type: 'fixed', skill: 'Fortitude' }, { type: 'fixed', skill: 'Luta' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Diplomacia', 'Guerra', 'Iniciativa', 'Intimidação', 'Nobreza', 'Percepção', 'Vontade'],
    optionalCount: 2,
    isSpellcaster: false,
    initialSpells: 0,
  },
  cleric: {
    mandatory: [{ type: 'fixed', skill: 'Religião' }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Conhecimento', 'Cura', 'Diplomacia', 'Fortitude', 'Iniciativa', 'Intuição', 'Luta', 'Misticismo', 'Nobreza', 'Ofício', 'Percepção'],
    optionalCount: 2,
    isSpellcaster: true,
    spellType: 'divina',
    initialSpells: 2,
  },
  druid: {
    mandatory: [{ type: 'fixed', skill: 'Sobrevivência' }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Conhecimento', 'Cura', 'Fortitude', 'Iniciativa', 'Intuição', 'Luta', 'Misticismo', 'Ofício', 'Percepção', 'Religião'],
    optionalCount: 4,
    isSpellcaster: true,
    spellType: 'divina',
    initialSpells: 2,
  },
  warrior: {
    mandatory: [{ type: 'choice', options: ['Luta', 'Pontaria'] }, { type: 'fixed', skill: 'Fortitude' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Guerra', 'Iniciativa', 'Intimidação', 'Luta', 'Ofício', 'Percepção', 'Pontaria', 'Reflexos'],
    optionalCount: 2,
    isSpellcaster: false,
    initialSpells: 0,
  },
  inventor: {
    mandatory: [{ type: 'fixed', skill: 'Ofício' }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Conhecimento', 'Cura', 'Diplomacia', 'Fortitude', 'Iniciativa', 'Investigação', 'Luta', 'Misticismo', 'Ofício', 'Pilotagem', 'Percepção', 'Pontaria'],
    optionalCount: 4,
    isSpellcaster: false,
    initialSpells: 0,
  },
  rogue: {
    mandatory: [{ type: 'fixed', skill: 'Ladinagem' }, { type: 'fixed', skill: 'Reflexos' }],
    optionalPool: ['Acrobacia', 'Atletismo', 'Atuação', 'Cavalgar', 'Conhecimento', 'Diplomacia', 'Enganação', 'Furtividade', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Jogatina', 'Luta', 'Ofício', 'Percepção', 'Pilotagem', 'Pontaria'],
    optionalCount: 8,
    isSpellcaster: false,
    initialSpells: 0,
  },
  fighter: {
    mandatory: [{ type: 'fixed', skill: 'Fortitude' }, { type: 'fixed', skill: 'Luta' }],
    optionalPool: ['Acrobacia', 'Adestramento', 'Atletismo', 'Enganação', 'Furtividade', 'Iniciativa', 'Intimidação', 'Ofício', 'Percepção', 'Pontaria', 'Reflexos'],
    optionalCount: 4,
    isSpellcaster: false,
    initialSpells: 0,
  },
  noble: {
    mandatory: [{ type: 'choice', options: ['Diplomacia', 'Intimidação'] }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Adestramento', 'Atuação', 'Cavalgar', 'Conhecimento', 'Diplomacia', 'Enganação', 'Fortitude', 'Guerra', 'Iniciativa', 'Intimidação', 'Intuição', 'Investigação', 'Jogatina', 'Luta', 'Nobreza', 'Ofício', 'Percepção', 'Pontaria'],
    optionalCount: 4,
    isSpellcaster: false,
    initialSpells: 0,
  },
  paladin: {
    mandatory: [{ type: 'fixed', skill: 'Luta' }, { type: 'fixed', skill: 'Vontade' }],
    optionalPool: ['Adestramento', 'Atletismo', 'Cavalgar', 'Cura', 'Diplomacia', 'Fortitude', 'Guerra', 'Iniciativa', 'Intuição', 'Nobreza', 'Percepção', 'Religião'],
    optionalCount: 2,
    isSpellcaster: false,
    initialSpells: 0,
  },
};

// ---------------------------------------------------------------------------
// Origin benefit data (source: T20 JdA Tabela 1-19 + origin descriptions)
// Each origin: player chooses 2 from (skills + powers combined)
// ---------------------------------------------------------------------------

interface OriginBenefitData {
  skills: string[];
  powers: string[];
  uniquePower: string;
}

const ORIGIN_BENEFITS: Record<string, OriginBenefitData> = {
  acolito:               { skills: ['Cura', 'Religião', 'Vontade'],                powers: ['Medicina', 'Vontade de Ferro'],                      uniquePower: 'Membro da Igreja' },
  amigo_dos_animais:     { skills: ['Adestramento', 'Cavalgar'],                  powers: [],                                                    uniquePower: 'Amigo Especial' },
  amnesico:              { skills: [],                                              powers: [],                                                    uniquePower: 'Lembranças Graduais' },
  aristocrata:           { skills: ['Diplomacia', 'Enganação', 'Nobreza'],         powers: ['Comandar'],                                          uniquePower: 'Sangue Azul' },
  artesao:               { skills: ['Ofício', 'Vontade'],                          powers: ['Sortudo'],                                           uniquePower: 'Frutos do Trabalho' },
  artista:               { skills: ['Atuação', 'Enganação'],                       powers: ['Atraente', 'Sortudo', 'Torcida'],                    uniquePower: 'Dom Artístico' },
  assistente_de_laboratorio: { skills: ['Ofício (alquimista)', 'Misticismo'],      powers: ['Venefício'],                                         uniquePower: 'Esse Cheiro...' },
  batedor:               { skills: ['Furtividade', 'Percepção', 'Sobrevivência'],  powers: ['Estilo de Disparo', 'Sentidos Aguçados'],            uniquePower: 'À Prova de Tudo' },
  capanga:               { skills: ['Luta', 'Intimidação'],                        powers: [],                                                    uniquePower: 'Confissão' },
  charlatao:             { skills: ['Enganação', 'Jogatina'],                      powers: ['Aparência Inofensiva', 'Sortudo'],                   uniquePower: 'Alpinista Social' },
  circense:              { skills: ['Acrobacia', 'Atuação', 'Reflexos'],           powers: ['Acrobático', 'Torcida'],                             uniquePower: 'Truque de Mágica' },
  criminoso:             { skills: ['Enganação', 'Furtividade', 'Ladinagem'],      powers: ['Venefício'],                                         uniquePower: 'Punguista' },
  curandeiro:            { skills: ['Cura', 'Vontade'],                            powers: ['Medicina', 'Venefício'],                             uniquePower: 'Médico de Campo' },
  eremita:               { skills: ['Misticismo', 'Religião', 'Sobrevivência'],    powers: ['Lobo Solitário'],                                    uniquePower: 'Busca Interior' },
  escravo:               { skills: ['Atletismo', 'Fortitude', 'Furtividade'],      powers: ['Vitalidade'],                                        uniquePower: 'Desejo de Liberdade' },
  estudioso:             { skills: ['Conhecimento', 'Guerra', 'Misticismo'],       powers: ['Aparência Inofensiva'],                              uniquePower: 'Palpite Fundamentado' },
  fazendeiro:            { skills: ['Adestramento', 'Cavalgar', 'Ofício', 'Sobrevivência'], powers: ['Ginete'],                                   uniquePower: 'Água no Feijão' },
  forasteiro:            { skills: ['Cavalgar', 'Pilotagem', 'Sobrevivência'],     powers: ['Lobo Solitário'],                                    uniquePower: 'Cultura Exótica' },
  gladiador:             { skills: ['Atuação', 'Luta'],                            powers: ['Atraente', 'Torcida'],                               uniquePower: 'Pão e Circo' },
  guarda:                { skills: ['Investigação', 'Luta', 'Percepção'],          powers: ['Investigador'],                                      uniquePower: 'Detetive' },
  herdeiro:              { skills: ['Misticismo', 'Nobreza', 'Ofício'],            powers: ['Comandar'],                                          uniquePower: 'Herança' },
  heroi_campones:        { skills: ['Adestramento', 'Ofício'],                     powers: ['Sortudo', 'Surto Heroico', 'Torcida'],               uniquePower: 'Coração Heroico' },
  marujo:                { skills: ['Atletismo', 'Jogatina', 'Pilotagem'],         powers: ['Acrobático'],                                        uniquePower: 'Passagem de Navio' },
  mateiro:               { skills: ['Atletismo', 'Furtividade', 'Sobrevivência'],  powers: ['Lobo Solitário', 'Sentidos Aguçados'],               uniquePower: 'Vendedor de Carcaças' },
  membro_de_guilda:      { skills: ['Diplomacia', 'Enganação', 'Misticismo', 'Ofício'], powers: ['Foco em Perícia'],                              uniquePower: 'Rede de Contatos' },
  mercador:              { skills: ['Diplomacia', 'Intuição', 'Ofício'],           powers: ['Proficiência', 'Sortudo'],                           uniquePower: 'Negociação' },
  minerador:             { skills: ['Atletismo', 'Fortitude', 'Ofício (minerador)'], powers: ['Ataque Poderoso', 'Sentidos Aguçados'],            uniquePower: 'Escavador' },
  nomade:                { skills: ['Cavalgar', 'Pilotagem', 'Sobrevivência'],     powers: ['Lobo Solitário', 'Sentidos Aguçados'],               uniquePower: 'Mochileiro' },
  pivete:                { skills: ['Furtividade', 'Iniciativa', 'Ladinagem'],     powers: ['Acrobático', 'Aparência Inofensiva'],                uniquePower: 'Quebra-Galho' },
  refugiado:             { skills: ['Fortitude', 'Reflexos', 'Vontade'],           powers: ['Vontade de Ferro'],                                  uniquePower: 'Estoico' },
  seguidor:              { skills: ['Adestramento', 'Ofício'],                     powers: ['Proficiência', 'Surto Heroico'],                     uniquePower: 'Antigo Mestre' },
  selvagem:              { skills: ['Percepção', 'Reflexos', 'Sobrevivência'],     powers: ['Lobo Solitário', 'Vitalidade'],                      uniquePower: 'Vida Rústica' },
  soldado:               { skills: ['Fortitude', 'Guerra', 'Luta', 'Pontaria'],    powers: ['Influência Militar'],                                uniquePower: 'Influência Militar' },
  taberneiro:            { skills: ['Diplomacia', 'Jogatina', 'Ofício (cozinheiro)'], powers: ['Proficiência', 'Vitalidade'],                     uniquePower: 'Gororoba' },
  trabalhador:           { skills: ['Atletismo', 'Fortitude'],                     powers: [],                                                    uniquePower: 'Esforçado' },
};

// ---------------------------------------------------------------------------
// Class ID normalization (compendium may return PT or EN ids)
// ---------------------------------------------------------------------------

const CLASS_ID_MAP: Record<string, string> = {
  // Portuguese → English canonical
  arcanista: 'arcanist', guerreiro: 'warrior', bárbaro: 'barbarian', barbaro: 'barbarian',
  bardo: 'bard', bucaneiro: 'buccaneer', caçador: 'ranger', cacador: 'ranger',
  cavaleiro: 'knight', clérigo: 'cleric', clerigo: 'cleric', druida: 'druid',
  inventor: 'inventor', ladino: 'rogue', lutador: 'fighter', nobre: 'noble', paladino: 'paladin',
  // English passthrough
  arcanist: 'arcanist', warrior: 'warrior', barbarian: 'barbarian', bard: 'bard',
  buccaneer: 'buccaneer', ranger: 'ranger', knight: 'knight', cleric: 'cleric',
  druid: 'druid', rogue: 'rogue', fighter: 'fighter', noble: 'noble', paladin: 'paladin',
};

/** Resolves any compendium class ID to the canonical English key used in local data. */
function normalizeClassId(id: string): string {
  return CLASS_ID_MAP[id.toLowerCase()] ?? id;
}

// ---------------------------------------------------------------------------
// Step ID system
// ---------------------------------------------------------------------------

type StepId = 'name_attrs' | 'race' | 'class' | 'subclass' | 'skills' | 'origin' | 'benefits' | 'spells' | 'equipment';

// ---------------------------------------------------------------------------
// Arcanist subclass data
// ---------------------------------------------------------------------------

interface ArcanistSubclassData { id: string; name: string; description: string; spellNote: string }
const ARCANIST_SUBCLASSES: ArcanistSubclassData[] = [
  {
    id: 'mago',
    name: 'Mago',
    description: 'Estudioso das artes arcanas que usa um grimório para registrar suas magias. Pode copiar magias de pergaminhos e grimórios encontrados durante aventuras.',
    spellNote: 'Aprende magias de qualquer escola arcana; grimório necessário',
  },
  {
    id: 'feiticeiro',
    name: 'Feiticeiro',
    description: 'Tem uma linhagem sobrenatural que confere poder mágico inato. Não precisa de grimório — seus feitiços fluem naturalmente do sangue. Deve escolher uma linhagem.',
    spellNote: 'Aprende magias instintivamente; ligado à linhagem sobrenatural',
  },
  {
    id: 'bruxo',
    name: 'Bruxo',
    description: 'Fez um pacto com uma entidade poderosa em troca de poder arcano. Recebe Foco Vital como poder de classe gratuito. Deve escolher um pacto com seu patrono.',
    spellNote: 'Aprende magias ligadas ao patrono; Foco Vital incluso',
  },
];

interface FeiticeirLineageData { id: string; name: string; description: string }
const FEITICEIRO_LINEAGES: FeiticeirLineageData[] = [
  { id: 'linhagem_draconica', name: 'Dracônica', description: 'Resist. 5 ao elemento do dragão; magias do elemento com −1 PM e +1 dano/dado' },
  { id: 'linhagem_abissal', name: 'Abissal', description: 'Resist. 5 a ácido; +1d6 de ácido em acertos (1 PM/vez)' },
  { id: 'linhagem_tormenta', name: 'Da Tormenta', description: 'Resist. 5 a eletricidade; magias de elétrico com +1 dano/dado e CD+1' },
  { id: 'linhagem_fada', name: 'De Fada', description: '+2 em Enganação e Intuição; invisibilidade 1 rodada (1 PM)' },
  { id: 'linhagem_infernal', name: 'Infernal', description: 'Resist. 5 a fogo; magias de fogo com +1 de dano por dado' },
  { id: 'linhagem_anao', name: 'De Anão', description: 'Resist. mágica +2; pode usar Fortitude em vez de Vontade contra efeitos mágicos' },
];

interface BruxoPactData { id: string; name: string; description: string }
const BRUXO_PACTS: BruxoPactData[] = [
  { id: 'pacto_corrente', name: 'Da Corrente', description: 'Familiar poderoso e independente; ver/ouvir pelos sentidos dele (ação de movimento)' },
  { id: 'pacto_tomo', name: 'Do Tomo', description: 'Aprende +2 magias extras; recupera PM=INT ao estudar o tomo (1h/dia)' },
  { id: 'pacto_lamina', name: 'Da Lâmina', description: 'Arma mágica vinculada à alma; +1 ataque e +1d6 de dano; invocada como ação livre' },
];

// ---------------------------------------------------------------------------
// Equipment data
// ---------------------------------------------------------------------------

const CLASS_STARTING_GOLD: Record<string, number> = {
  arcanist: 120,
  barbarian: 150,
  bard: 200,
  buccaneer: 240,
  ranger: 200,
  knight: 300,
  cleric: 200,
  druid: 150,
  warrior: 240,
  inventor: 200,
  rogue: 200,
  fighter: 160,
  noble: 400,
  paladin: 240,
};

const ITEM_CATEGORIES = ['Arma Simples', 'Arma Marcial', 'Armadura Leve', 'Armadura Pesada', 'Escudo', 'Item Geral', 'Consumível'];

function parseCost(cost: string): number {
  return parseFloat(cost.replace(/\s*T\$\s*/i, '').replace(',', '.')) || 0;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTR_LABELS: Record<string, string> = {
  for: 'FOR', des: 'DES', con: 'CON', int: 'INT', sab: 'SAB', car: 'CAR',
};

const POINT_COSTS: Record<number, number> = { [-1]: -1, 0: 0, 1: 1, 2: 2, 3: 4, 4: 7 };

// Raças que precisam que o jogador escolha quais atributos recebem +1
const FLEX_RACES: Record<string, { count: number; excluded?: string[] }> = {
  human:         { count: 3 },
  lefeu:         { count: 3, excluded: ['car'] },   // +1 em 3 atributos exceto CAR
  osteon:        { count: 3, excluded: ['con'] },   // +1 em 3 atributos exceto CON
  sereia_tritao: { count: 3 },
};

function getAllOriginBenefits(id: string): Array<{ label: string; isSkill: boolean; isUnique: boolean }> {
  const data = ORIGIN_BENEFITS[id];
  if (!data) return [];
  return [
    ...data.skills.map(s => ({ label: s, isSkill: true, isUnique: false })),
    ...data.powers.map(p => ({ label: p, isSkill: false, isUnique: false })),
    { label: data.uniquePower, isSkill: false, isUnique: true },
  ].filter(b => b.label);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CharacterCreationProps {
  onComplete: (characterId: string) => void;
  onCancel: () => void;
  userId: string;
}

type Attributes = { for: number; des: number; con: number; int: number; sab: number; car: number };

interface CharacterFormData {
  name: string;
  race_id: string;
  class_id: string;
  origin_id: string;
  attributes_base: Attributes;
  race_attr_bonuses: string[];              // chosen attrs for flex races (+1 each)
  mandatory_choices: Record<number, string>;
  optional_skills: string[];
  int_bonus_skills: string[];
  origin_benefits: string[];
  initial_spells: string[];
  // Arcanist subclass
  arcanist_subclass: string;               // 'mago' | 'feiticeiro' | 'bruxo' | ''
  feiticeiro_lineage: string;              // lineage power id or ''
  bruxo_pact: string;                      // pact power id or ''
  // Equipment
  purchased_items: Record<string, number>; // item name -> quantity
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CharacterCreation({ onComplete, onCancel, userId }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState<CompendiumRace[]>([]);
  const [classes, setClasses] = useState<CompendiumClass[]>([]);
  const [origins, setOrigins] = useState<CompendiumOrigin[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CharacterFormData>({
    name: '',
    race_id: '',
    class_id: '',
    origin_id: '',
    attributes_base: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    race_attr_bonuses: [],
    mandatory_choices: {},
    optional_skills: [],
    int_bonus_skills: [],
    origin_benefits: [],
    initial_spells: [],
    arcanist_subclass: '',
    feiticeiro_lineage: '',
    bruxo_pact: '',
    purchased_items: {},
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, c, o] = await Promise.all([
          compendiumService.getRaces(),
          compendiumService.getClasses(),
          compendiumService.getOrigins(),
        ]);
        setRaces(r);
        setClasses(c);
        setOrigins(o);
      } catch (err) {
        console.error('Error loading compendium data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived — normalise class_id so PT and EN ids both work
  const canonicalClassId = formData.class_id ? normalizeClassId(formData.class_id) : '';
  const classData = canonicalClassId ? CLASS_SKILL_DATA[canonicalClassId] : null;
  const originBenefitOptions = formData.origin_id ? getAllOriginBenefits(formData.origin_id) : [];

  const intBonus = Math.max(0, formData.attributes_base.int);
  const totalPoints = (Object.values(formData.attributes_base) as number[]).reduce((acc: number, v: number) => acc + (POINT_COSTS[v] ?? 0), 0);
  const remaining = 10 - totalPoints;

  const hasIntBonus = intBonus > 0;
  const isCaster = classData?.isSpellcaster ?? false;

  // Dynamic step order based on class choice
  const computedSteps: StepId[] = React.useMemo(() => {
    const s: StepId[] = ['name_attrs', 'race', 'class'];
    if (canonicalClassId === 'arcanist') s.push('subclass');
    s.push('skills', 'origin', 'benefits');
    if (isCaster && (classData?.initialSpells ?? 0) > 0) s.push('spells');
    s.push('equipment');
    return s;
  }, [formData.class_id, isCaster, classData?.initialSpells]);

  const maxStep = computedSteps.length;
  const currentStep: StepId = computedSteps[step - 1] ?? 'name_attrs';

  // Clamp step when steps change (e.g. class changed from arcanist to something else)
  React.useEffect(() => {
    if (step > computedSteps.length) setStep(computedSteps.length);
  }, [computedSteps.length]);

  // Equipment gold tracking
  const startingGold = CLASS_STARTING_GOLD[canonicalClassId] || 160;
  const remainingGold = React.useMemo((): number => {
    return startingGold - (Object.entries(formData.purchased_items) as [string, number][]).reduce((sum, [name, qty]) => {
      const item = ITEMS[name];
      if (!item) return sum;
      return sum + parseCost(item.cost) * qty;
    }, 0);
  }, [formData.purchased_items, startingGold]);

  // Validation per step
  const stepValid = (): boolean => {
    switch (currentStep) {
      case 'name_attrs': return !!formData.name.trim() && remaining === 0;
      case 'race': {
        if (!formData.race_id) return false;
        const flex = FLEX_RACES[formData.race_id];
        if (flex && formData.race_attr_bonuses.length !== flex.count) return false;
        return true;
      }
      case 'class': return !!formData.class_id && !!canonicalClassId;
      case 'subclass': {
        if (!formData.arcanist_subclass) return false;
        if (formData.arcanist_subclass === 'feiticeiro' && !formData.feiticeiro_lineage) return false;
        if (formData.arcanist_subclass === 'bruxo' && !formData.bruxo_pact) return false;
        return true;
      }
      case 'skills': {
        if (!classData) return false;
        const choiceGroups = classData.mandatory.filter(g => g.type === 'choice');
        const allChoicesMade = choiceGroups.every((_, i) => !!formData.mandatory_choices[i]);
        const hasEnough = formData.optional_skills.length === classData.optionalCount;
        const intDone = !hasIntBonus || formData.int_bonus_skills.length === intBonus;
        return allChoicesMade && hasEnough && intDone;
      }
      case 'origin': return !!formData.origin_id;
      case 'benefits': return formData.origin_benefits.length === 2;
      case 'spells': return !isCaster || formData.initial_spells.length >= (classData?.initialSpells ?? 0);
      case 'equipment': return true; // equipment is optional
      default: return true;
    }
  };

  const handleNext = () => {
    if (!stepValid()) return;
    if (step >= maxStep) {
      handleCreate();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (step <= 1) onCancel();
    else setStep(s => s - 1);
  };

  const toggleOptionalSkill = (skill: string) => {
    setFormData(f => {
      const existing = f.optional_skills.includes(skill);
      if (existing) return { ...f, optional_skills: f.optional_skills.filter(s => s !== skill) };
      if (f.optional_skills.length >= (classData?.optionalCount ?? 0)) return f;
      return { ...f, optional_skills: [...f.optional_skills, skill] };
    });
  };

  const toggleIntBonusSkill = (skill: string) => {
    setFormData(f => {
      const existing = f.int_bonus_skills.includes(skill);
      if (existing) return { ...f, int_bonus_skills: f.int_bonus_skills.filter(s => s !== skill) };
      if (f.int_bonus_skills.length >= intBonus) return f;
      return { ...f, int_bonus_skills: [...f.int_bonus_skills, skill] };
    });
  };

  const toggleOriginBenefit = (label: string) => {
    setFormData(f => {
      const existing = f.origin_benefits.includes(label);
      if (existing) return { ...f, origin_benefits: f.origin_benefits.filter(b => b !== label) };
      if (f.origin_benefits.length >= 2) return f;
      return { ...f, origin_benefits: [...f.origin_benefits, label] };
    });
  };

  const toggleSpell = (name: string) => {
    setFormData(f => {
      const existing = f.initial_spells.includes(name);
      const maxSpells = classData?.initialSpells ?? 0;
      if (existing) return { ...f, initial_spells: f.initial_spells.filter(s => s !== name) };
      if (f.initial_spells.length >= maxSpells) return f;
      return { ...f, initial_spells: [...f.initial_spells, name] };
    });
  };

  const handleCreate = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      // 1. Race modifiers
      const raceEntry = RACES[formData.race_id];
      const raceModifiers = raceEntry?.modifiers || {};

      const finalAttrs: Attributes = {
        for: formData.attributes_base.for + (raceModifiers.for || 0),
        des: formData.attributes_base.des + (raceModifiers.des || 0),
        con: formData.attributes_base.con + (raceModifiers.con || 0),
        int: formData.attributes_base.int + (raceModifiers.int || 0),
        sab: formData.attributes_base.sab + (raceModifiers.sab || 0),
        car: formData.attributes_base.car + (raceModifiers.car || 0),
      };

      // Flex race bonuses: +1 in each player-chosen attribute
      for (const attr of formData.race_attr_bonuses) {
        (finalAttrs as any)[attr] += 1;
      }

      // 2. HP/PM
      const cls = CLASSES[canonicalClassId];
      if (!cls) throw new Error(`Classe "${formData.class_id}" (${canonicalClassId}) não encontrada.`);

      const hasSangueMagico = raceEntry?.abilities?.includes('Sangue Mágico') ?? false;
      const maxHP = calculatePV(cls, 1, finalAttrs.con, false);
      const maxPM = calculatePM(cls, 1, false, hasSangueMagico);

      // 3. Build trained skills
      const trainedSkills = new Set<string>();

      // Mandatory fixed skills
      if (classData) {
        classData.mandatory.forEach((group, idx) => {
          if (group.type === 'fixed') {
            trainedSkills.add(group.skill);
          } else {
            const chosen = formData.mandatory_choices[idx];
            if (chosen) trainedSkills.add(chosen);
          }
        });
      }

      // Optional class skills
      formData.optional_skills.forEach(s => trainedSkills.add(s));

      // INT bonus skills
      formData.int_bonus_skills.forEach(s => trainedSkills.add(s));

      // 4. Build origin powers and additional skills from chosen benefits
      const benefitData = ORIGIN_BENEFITS[formData.origin_id] || { skills: [], powers: [], uniquePower: '' };
      const initialPowers: T20Power[] = [];

      for (const benefit of formData.origin_benefits) {
        const isSkill = benefitData.skills.includes(benefit);
        if (isSkill) {
          trainedSkills.add(benefit);
        } else {
          const found = POWERS.find(p => p.name.toLowerCase() === benefit.toLowerCase());
          if (found) {
            initialPowers.push({
              ...found,
              id: found.name.toLowerCase().replace(/\s+/g, '_'),
              type: 'Origem',
            });
          } else {
            initialPowers.push({
              id: benefit.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
              name: benefit,
              description: '',
              requirements: [],
              type: 'Origem',
            });
          }
        }
      }

      // 5. Arcanist subclass power
      if (canonicalClassId === 'arcanist' && formData.arcanist_subclass) {
        const subId = `subclasse_arcanista_${formData.arcanist_subclass}`;
        const subPower = CLASS_POWERS.find(p => p.id === subId);
        if (subPower) initialPowers.push({ ...subPower, type: 'Classe' });

        if (formData.arcanist_subclass === 'feiticeiro' && formData.feiticeiro_lineage) {
          const lp = CLASS_POWERS.find(p => p.id === formData.feiticeiro_lineage);
          if (lp) initialPowers.push({ ...lp, type: 'Classe' });
        }
        if (formData.arcanist_subclass === 'bruxo' && formData.bruxo_pact) {
          const pp = CLASS_POWERS.find(p => p.id === formData.bruxo_pact);
          if (pp) initialPowers.push({ ...pp, type: 'Classe' });
          // Bruxo always gets Foco Vital for free
          const focoVital = CLASS_POWERS.find(p => p.id === 'foco_vital');
          if (focoVital && !initialPowers.some(p => p.id === 'foco_vital')) {
            initialPowers.push({ ...focoVital, type: 'Classe' });
          }
        }
      }

      // 6. Initial spells
      const spellsData = formData.initial_spells.map(name => {
        return SPELLS.find(s => s.name === name) ?? null;
      }).filter(Boolean);

      // 7. Purchased equipment
      const inventoryItems = (Object.entries(formData.purchased_items) as [string, number][])
        .filter(([, qty]) => qty > 0)
        .map(([name, qty]) => {
          const item = ITEMS[name];
          return {
            id: crypto.randomUUID(),
            name,
            type: item?.type || 'Item',
            weight: item?.weight || 0,
            cost: item?.cost || '0 T$',
            quantity: qty,
            isEquipped: false,
            description: item?.description,
          };
        });

      const remainingGoldFinal = Math.max(0,
        startingGold - (Object.entries(formData.purchased_items) as [string, number][]).reduce((sum, [name, qty]) => {
          const item = ITEMS[name];
          if (!item) return sum;
          return sum + parseCost(item.cost) * qty;
        }, 0)
      );

      // 8. Create character
      const character = await characterService.createCharacter({
        name: formData.name,
        user_id: userId,
        race_id: formData.race_id,
        class_id: formData.class_id,
        origin_id: formData.origin_id,
        level: 1,
        attributes_base: finalAttrs,
        current_hp: maxHP,
        current_mp: maxPM,
        deity: '',
        trained_skills: Array.from(trainedSkills),
        conditions: [],
        defense_bonus: 0,
        powers_data: initialPowers as any,
        spells_data: spellsData as any,
        inventory_data: inventoryItems as any,
        notes: `tibar:${remainingGoldFinal}`,
      });

      onComplete(character.id);
    } catch (err: any) {
      console.error('Error creating character:', err);
      setError(`Erro: ${err.message || 'Erro ao criar personagem.'}`);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gothic-bg flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-gothic-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-cinzel text-gothic-gold tracking-widest animate-pulse">Invocando Dados do Compêndio...</p>
        </div>
      </div>
    );
  }

  const stepLabel = () => {
    switch (currentStep) {
      case 'name_attrs': return 'Nome e Atributos';
      case 'race': return 'Raça';
      case 'class': return 'Classe';
      case 'subclass': return 'Subclasse de Arcanista';
      case 'skills': return 'Perícias';
      case 'origin': return 'Origem';
      case 'benefits': return 'Benefícios de Origem';
      case 'spells': return 'Magias Iniciais';
      case 'equipment': return 'Equipamento e Ouro';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-gothic-bg z-50 overflow-y-auto gothic-scroll">
      <div className="max-w-4xl mx-auto p-4 md:p-8 py-8 md:py-16">
        <header className="text-center mb-8 md:mb-12 relative">
          <button
            onClick={onCancel}
            className="md:absolute left-0 top-0 text-gothic-gold/40 hover:text-gothic-gold transition-colors font-cinzel text-[10px] md:text-xs flex items-center gap-1 mb-4 md:mb-0"
          >
            <ChevronLeft size={14} /> CANCELAR
          </button>
          <h1 className="font-cinzel text-2xl md:text-4xl font-bold text-gothic-gold mb-2 tracking-tighter">Criação de Personagem</h1>
          <div className="h-1 w-24 md:w-32 bg-gothic-red mx-auto mb-3" />
          <p className="text-gothic-text/60 text-[10px] uppercase tracking-[0.3em]">
            Passo {step} — {stepLabel()}
          </p>
          {/* Step progress dots */}
          <div className="flex justify-center gap-2 mt-3">
            {Array.from({ length: maxStep }, (_, i) => (
              <div
                key={i}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  i + 1 < step ? 'bg-gothic-gold' : i + 1 === step ? 'bg-gothic-red w-4' : 'bg-gothic-gold/20',
                )}
              />
            ))}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {/* ─── STEP: Name + Attributes ─── */}
          {currentStep === 'name_attrs' && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20">
                <label className="block font-cinzel text-xs text-gothic-gold mb-3 uppercase tracking-widest">Nome do Personagem</label>
                <input
                  type="text"
                  placeholder="Ex: Sir Alistair, o Audaz"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-black/40 border border-gothic-gold/20 p-3 font-cinzel text-lg text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                />
              </div>

              <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20">
                <div className="flex justify-between items-center mb-6">
                  <label className="font-cinzel text-xs text-gothic-gold uppercase tracking-widest">Distribuir Atributos</label>
                  <span className={cn('font-cinzel text-sm font-bold px-3 py-1 border', remaining === 0 ? 'text-gothic-gold border-gothic-gold/40' : remaining < 0 ? 'text-gothic-red border-gothic-red/40' : 'text-gothic-text/60 border-gothic-gold/20')}>
                    {remaining} ponto{remaining !== 1 ? 's' : ''} restante{remaining !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  {(Object.keys(formData.attributes_base) as (keyof Attributes)[]).map(attr => (
                    <div key={attr} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">{ATTR_LABELS[attr]}</span>
                      <div className="flex items-center gap-3">
                        <button
                          disabled={formData.attributes_base[attr] <= -1}
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] - 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors disabled:opacity-20"
                        ><Minus size={14} /></button>
                        <span className="font-cinzel text-2xl font-bold text-gothic-text w-8 text-center">{formData.attributes_base[attr]}</span>
                        <button
                          disabled={formData.attributes_base[attr] >= 4 || remaining < ((POINT_COSTS[formData.attributes_base[attr] + 1] ?? 99) - (POINT_COSTS[formData.attributes_base[attr]] ?? 0))}
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] + 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors disabled:opacity-20"
                        ><Plus size={14} /></button>
                      </div>
                      <span className="text-[9px] text-gothic-text/40 uppercase tracking-tighter">custo: {POINT_COSTS[formData.attributes_base[attr]] ?? '?'} pt</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gothic-text/30 mt-6 text-center uppercase tracking-widest">
                  10 pontos • Atributos de -1 a 4 • Custo: 1=1pt, 2=2pt, 3=4pt, 4=7pt
                </p>
              </div>

              <NavButtons onBack={handleBack} backLabel="Cancelar" onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Race ─── */}
          {currentStep === 'race' && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {races.map(race => (
                  <button key={race.id}
                    onClick={() => setFormData(f => ({ ...f, race_id: race.id, race_attr_bonuses: [] }))}
                    className={cn('p-5 text-left border transition-all duration-200 flex flex-col',
                      formData.race_id === race.id ? 'bg-gothic-gold/10 border-gothic-gold' : 'bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40'
                    )}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-cinzel text-lg font-bold text-gothic-gold">{race.name}</h3>
                      {formData.race_id === race.id && <Check size={16} className="text-gothic-gold mt-1" />}
                    </div>
                    <p className="text-[10px] text-gothic-text/60 mb-3 leading-relaxed">{race.description}</p>
                    {race.abilities && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {race.abilities.split(', ').map((a, i) => (
                          <span key={i} className="text-[8px] px-1.5 py-0.5 bg-gothic-gold/5 border border-gothic-gold/15 text-gothic-gold/70 rounded-sm">{a}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Flex race attribute selection */}
              {formData.race_id && FLEX_RACES[formData.race_id] && (() => {
                const flex = FLEX_RACES[formData.race_id];
                const allAttrs = ['for', 'des', 'con', 'int', 'sab', 'car'] as const;
                const available = allAttrs.filter(a => !flex.excluded?.includes(a));
                return (
                  <div className="bg-gothic-card p-5 border border-gothic-gold/20">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">
                        Bônus Racial — +1 em {flex.count} Atributos
                      </h3>
                      <span className={cn('font-cinzel text-xs font-bold',
                        formData.race_attr_bonuses.length === flex.count ? 'text-gothic-gold' : 'text-gothic-text/40'
                      )}>
                        {formData.race_attr_bonuses.length}/{flex.count}
                      </span>
                    </div>
                    {flex.excluded && (
                      <p className="text-[9px] text-gothic-text/40 mb-3">
                        Não pode escolher: {flex.excluded.map(a => ATTR_LABELS[a]).join(', ')}
                      </p>
                    )}
                    <div className="flex gap-3 flex-wrap">
                      {available.map(attr => {
                        const chosen = formData.race_attr_bonuses.includes(attr);
                        return (
                          <button
                            key={attr}
                            disabled={!chosen && formData.race_attr_bonuses.length >= flex.count}
                            onClick={() => setFormData(f => {
                              const already = f.race_attr_bonuses.includes(attr);
                              return {
                                ...f,
                                race_attr_bonuses: already
                                  ? f.race_attr_bonuses.filter(a => a !== attr)
                                  : [...f.race_attr_bonuses, attr],
                              };
                            })}
                            className={cn(
                              'px-4 py-2 border font-cinzel text-sm font-bold transition-all',
                              chosen
                                ? 'bg-gothic-gold border-gothic-gold text-gothic-bg'
                                : 'border-gothic-gold/30 text-gothic-gold/60 hover:border-gothic-gold disabled:opacity-30',
                            )}
                          >
                            {ATTR_LABELS[attr]}
                            {chosen && ' +1'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Class ─── */}
          {currentStep === 'class' && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map(cls => (
                  <button key={cls.id}
                    onClick={() => setFormData(f => ({ ...f, class_id: cls.id, mandatory_choices: {}, optional_skills: [], int_bonus_skills: [], arcanist_subclass: '', feiticeiro_lineage: '', bruxo_pact: '' }))}
                    className={cn('p-5 text-left border transition-all duration-200',
                      formData.class_id === cls.id ? 'bg-gothic-gold/10 border-gothic-gold' : 'bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40'
                    )}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-cinzel text-lg font-bold text-gothic-gold">{cls.name}</h3>
                      <div className="flex gap-1.5">
                        <span className="text-[8px] px-1.5 py-0.5 bg-gothic-red/10 text-gothic-red border border-gothic-red/20">{cls.hp_initial} PV</span>
                        <span className="text-[8px] px-1.5 py-0.5 bg-gothic-blue/10 text-gothic-blue border border-gothic-blue/20">{cls.mana_per_level} PM</span>
                        {CLASS_SKILL_DATA[cls.id]?.isSpellcaster && (
                          <span className="text-[8px] px-1.5 py-0.5 bg-gothic-gold/10 text-gothic-gold border border-gothic-gold/20">Conjurador</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-gothic-text/50 line-clamp-2 leading-relaxed">{cls.description}</p>
                  </button>
                ))}
              </div>
              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Subclass (Arcanist only) ─── */}
          {currentStep === 'subclass' && (
            <motion.div key="s_subclass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-gothic-card p-5 border border-gothic-gold/20">
                <p className="text-[10px] text-gothic-text/50 leading-relaxed">
                  O Arcanista pode trilhar três caminhos diferentes. Sua escolha determina como você aprende magias e quais poderes exclusivos estão disponíveis.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ARCANIST_SUBCLASSES.map(sub => {
                  const selected = formData.arcanist_subclass === sub.id;
                  return (
                    <button key={sub.id}
                      onClick={() => setFormData(f => ({ ...f, arcanist_subclass: sub.id, feiticeiro_lineage: '', bruxo_pact: '' }))}
                      className={cn('p-5 text-left border transition-all flex flex-col gap-3',
                        selected ? 'bg-gothic-gold/10 border-gothic-gold' : 'bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40'
                      )}>
                      <div className="flex items-start justify-between">
                        <h3 className="font-cinzel text-xl font-bold text-gothic-gold">{sub.name}</h3>
                        {selected && <Check size={16} className="text-gothic-gold mt-1 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-gothic-text/60 leading-relaxed flex-1">{sub.description}</p>
                      <p className="text-[9px] text-gothic-gold/40 italic border-t border-gothic-gold/10 pt-2">{sub.spellNote}</p>
                    </button>
                  );
                })}
              </div>

              {/* Lineage selection for Feiticeiro */}
              {formData.arcanist_subclass === 'feiticeiro' && (
                <div className="bg-gothic-card p-5 border border-gothic-gold/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Escolha sua Linhagem</h3>
                    {!formData.feiticeiro_lineage && (
                      <span className="text-[9px] text-gothic-red uppercase tracking-widest">Obrigatório</span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FEITICEIRO_LINEAGES.map(lin => {
                      const sel = formData.feiticeiro_lineage === lin.id;
                      return (
                        <button key={lin.id}
                          onClick={() => setFormData(f => ({ ...f, feiticeiro_lineage: lin.id }))}
                          className={cn('p-3 border text-left transition-all',
                            sel ? 'bg-gothic-gold/10 border-gothic-gold' : 'border-gothic-gold/15 hover:border-gothic-gold/40'
                          )}>
                          <p className="font-cinzel text-xs font-bold text-gothic-gold">{lin.name}</p>
                          <p className="text-[9px] text-gothic-text/40 mt-1 leading-relaxed">{lin.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Pact selection for Bruxo */}
              {formData.arcanist_subclass === 'bruxo' && (
                <div className="bg-gothic-card p-5 border border-gothic-gold/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Escolha seu Pacto</h3>
                    {!formData.bruxo_pact && (
                      <span className="text-[9px] text-gothic-red uppercase tracking-widest">Obrigatório</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {BRUXO_PACTS.map(pact => {
                      const sel = formData.bruxo_pact === pact.id;
                      return (
                        <button key={pact.id}
                          onClick={() => setFormData(f => ({ ...f, bruxo_pact: pact.id }))}
                          className={cn('p-4 border text-left transition-all',
                            sel ? 'bg-gothic-gold/10 border-gothic-gold' : 'border-gothic-gold/15 hover:border-gothic-gold/40'
                          )}>
                          <p className="font-cinzel text-sm font-bold text-gothic-gold mb-1">{pact.name}</p>
                          <p className="text-[9px] text-gothic-text/40 leading-relaxed">{pact.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-gothic-gold/40 mt-3 italic">
                    ✦ Bruxos recebem Foco Vital gratuitamente como poder de classe.
                  </p>
                </div>
              )}

              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Skills ─── */}
          {currentStep === 'skills' && classData && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              {/* Mandatory fixed skills */}
              <div className="bg-gothic-card p-5 border border-gothic-gold/10">
                <div className="flex items-center gap-3 mb-4">
                  <Star size={16} className="text-gothic-gold" />
                  <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Perícias Obrigatórias</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classData.mandatory.map((group, idx) => {
                    if (group.type === 'fixed') {
                      return (
                        <span key={idx} className="px-3 py-1 bg-gothic-gold/10 border border-gothic-gold/30 text-gothic-gold text-[10px] font-bold uppercase tracking-widest">
                          {group.skill}
                        </span>
                      );
                    }
                    return (
                      <div key={idx} className="flex gap-1">
                        {group.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => setFormData(f => ({ ...f, mandatory_choices: { ...f.mandatory_choices, [idx]: opt } }))}
                            className={cn('px-3 py-1 border text-[10px] font-bold uppercase tracking-widest transition-all',
                              formData.mandatory_choices[idx] === opt
                                ? 'bg-gothic-gold border-gothic-gold text-gothic-bg'
                                : 'border-gothic-gold/30 text-gothic-gold/60 hover:border-gothic-gold'
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                        <span className="text-gothic-text/30 self-center text-[9px]">(escolha um)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional skills */}
              <div className="bg-gothic-card p-5 border border-gothic-gold/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Sword size={16} className="text-gothic-gold" />
                    <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Perícias Opcionais</h3>
                  </div>
                  <span className={cn('font-cinzel text-xs font-bold',
                    formData.optional_skills.length === classData.optionalCount ? 'text-gothic-gold' : 'text-gothic-text/40'
                  )}>
                    {formData.optional_skills.length}/{classData.optionalCount}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {classData.optionalPool.map(skill => {
                    const isFixed = classData.mandatory.some(g => g.type === 'fixed' && g.skill === skill);
                    const isChosenMandatory = Object.values(formData.mandatory_choices).includes(skill);
                    const disabled = isFixed || isChosenMandatory;
                    const selected = formData.optional_skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        disabled={disabled || (!selected && formData.optional_skills.length >= classData.optionalCount)}
                        onClick={() => toggleOptionalSkill(skill)}
                        className={cn('px-3 py-1 border text-[10px] font-bold uppercase tracking-widest transition-all',
                          disabled ? 'border-gothic-gold/5 text-gothic-text/20 cursor-not-allowed' :
                          selected ? 'bg-gothic-gold border-gothic-gold text-gothic-bg' :
                          'border-gothic-gold/20 text-gothic-gold/50 hover:border-gothic-gold/60 disabled:opacity-30'
                        )}
                      >
                        {skill}
                        {disabled && ' ✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INT bonus skills */}
              {hasIntBonus && (
                <div className="bg-gothic-card p-5 border border-gothic-blue/20">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Book size={16} className="text-gothic-blue" />
                      <h3 className="font-cinzel text-sm font-bold text-gothic-blue uppercase tracking-widest">Bônus de Inteligência</h3>
                    </div>
                    <span className={cn('font-cinzel text-xs font-bold', formData.int_bonus_skills.length === intBonus ? 'text-gothic-blue' : 'text-gothic-text/40')}>
                      {formData.int_bonus_skills.length}/{intBonus}
                    </span>
                  </div>
                  <p className="text-[10px] text-gothic-text/40 mb-3">INT {formData.attributes_base.int} → escolha {intBonus} perícia{intBonus > 1 ? 's' : ''} extras (qualquer lista)</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(SKILLS_ATTRIBUTES).sort().map(skill => {
                      const alreadyTrained = formData.optional_skills.includes(skill) ||
                        classData.mandatory.some(g => g.type === 'fixed' && (g as any).skill === skill) ||
                        Object.values(formData.mandatory_choices).includes(skill);
                      const selected = formData.int_bonus_skills.includes(skill);
                      if (alreadyTrained && !selected) return null;
                      return (
                        <button
                          key={skill}
                          disabled={!selected && formData.int_bonus_skills.length >= intBonus}
                          onClick={() => toggleIntBonusSkill(skill)}
                          className={cn('px-3 py-1 border text-[10px] font-bold uppercase tracking-widest transition-all',
                            selected ? 'bg-gothic-blue border-gothic-blue text-white' :
                            'border-gothic-blue/20 text-gothic-blue/50 hover:border-gothic-blue/60 disabled:opacity-30'
                          )}
                        >
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Origin ─── */}
          {currentStep === 'origin' && (
            <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {origins.map(origin => {
                  const benefitList: string[] = typeof (origin as any).benefits === 'string'
                    ? (origin as any).benefits.split(',').map((b: string) => b.trim()).filter(Boolean)
                    : Array.isArray((origin as any).benefits) ? (origin as any).benefits : [];
                  return (
                    <button key={origin.id}
                      onClick={() => setFormData(f => ({ ...f, origin_id: origin.id, origin_benefits: [] }))}
                      className={cn('p-5 text-left border transition-all duration-200',
                        formData.origin_id === origin.id ? 'bg-gothic-gold/10 border-gothic-gold' : 'bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40'
                      )}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-cinzel text-base font-bold text-gothic-gold">{origin.name}</h3>
                        {formData.origin_id === origin.id && <Check size={14} className="text-gothic-gold mt-0.5" />}
                      </div>
                      <p className="text-[10px] text-gothic-text/50 mb-3 leading-relaxed">{origin.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {benefitList.slice(0, 4).map((b, i) => (
                          <span key={i} className="text-[8px] px-1.5 py-0.5 bg-gothic-gold/5 border border-gothic-gold/10 text-gothic-gold/60 rounded-sm uppercase tracking-wider">{b}</span>
                        ))}
                        {benefitList.length > 4 && <span className="text-[8px] text-gothic-text/30">+{benefitList.length - 4}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              <NavButtons onBack={handleBack} onNext={handleNext} nextDisabled={!stepValid()} />
            </motion.div>
          )}

          {/* ─── STEP: Origin Benefits (choose 2) ─── */}
          {currentStep === 'benefits' && (
            <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-gothic-card p-5 border border-gothic-gold/10">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Benefícios de Origem</h3>
                  <span className={cn('font-cinzel text-xs font-bold', formData.origin_benefits.length === 2 ? 'text-gothic-gold' : 'text-gothic-text/40')}>
                    {formData.origin_benefits.length}/2 escolhidos
                  </span>
                </div>
                <p className="text-[10px] text-gothic-text/40 mb-5">Escolha 2 benefícios: perícias, poderes gerais ou o poder único da origem.</p>

                {originBenefitOptions.length === 0 ? (
                  <p className="text-gothic-text/40 text-sm italic text-center py-4">Origem com benefícios especiais — definidos com o Mestre.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Skills */}
                    {originBenefitOptions.filter(b => b.isSkill).length > 0 && (
                      <div>
                        <p className="text-[9px] text-gothic-gold/40 uppercase tracking-widest mb-2">Perícias</p>
                        <div className="flex flex-wrap gap-2">
                          {originBenefitOptions.filter(b => b.isSkill).map(b => {
                            const selected = formData.origin_benefits.includes(b.label);
                            return (
                              <button key={b.label}
                                disabled={!selected && formData.origin_benefits.length >= 2}
                                onClick={() => toggleOriginBenefit(b.label)}
                                className={cn('px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all',
                                  selected ? 'bg-gothic-gold border-gothic-gold text-gothic-bg' :
                                  'border-gothic-gold/20 text-gothic-gold/50 hover:border-gothic-gold/50 disabled:opacity-30'
                                )}
                              >
                                <Star size={10} className="inline mr-1" />{b.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Powers */}
                    {originBenefitOptions.filter(b => !b.isSkill && !b.isUnique).length > 0 && (
                      <div>
                        <p className="text-[9px] text-gothic-gold/40 uppercase tracking-widest mb-2">Poderes Gerais</p>
                        <div className="flex flex-wrap gap-2">
                          {originBenefitOptions.filter(b => !b.isSkill && !b.isUnique).map(b => {
                            const selected = formData.origin_benefits.includes(b.label);
                            return (
                              <button key={b.label}
                                disabled={!selected && formData.origin_benefits.length >= 2}
                                onClick={() => toggleOriginBenefit(b.label)}
                                className={cn('px-3 py-1.5 border text-[10px] font-bold uppercase tracking-widest transition-all',
                                  selected ? 'bg-gothic-gold border-gothic-gold text-gothic-bg' :
                                  'border-gothic-gold/20 text-gothic-gold/50 hover:border-gothic-gold/50 disabled:opacity-30'
                                )}
                              >
                                <Sword size={10} className="inline mr-1" />{b.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Unique power */}
                    {originBenefitOptions.filter(b => b.isUnique).map(b => {
                      const selected = formData.origin_benefits.includes(b.label);
                      return (
                        <div key={b.label}>
                          <p className="text-[9px] text-gothic-gold/40 uppercase tracking-widest mb-2">Poder Único da Origem</p>
                          <button
                            disabled={!selected && formData.origin_benefits.length >= 2}
                            onClick={() => toggleOriginBenefit(b.label)}
                            className={cn('px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-all',
                              selected ? 'bg-gothic-red border-gothic-red text-white' :
                              'border-gothic-red/30 text-gothic-red/60 hover:border-gothic-red/60 disabled:opacity-30'
                            )}
                          >
                            ✦ {b.label} (Exclusivo)
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <NavButtons
                onBack={handleBack}
                onNext={handleNext}
                nextLabel="Próximo"
                nextDisabled={!stepValid() || (originBenefitOptions.length > 0 && formData.origin_benefits.length < 2)}
                submitting={submitting}
                error={error}
              />
            </motion.div>
          )}

          {/* ─── STEP: Initial Spells (casters only) ─── */}
          {currentStep === 'spells' && isCaster && (
            <motion.div key="s7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-gothic-card p-5 border border-gothic-gold/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <Book size={16} className="text-gothic-gold" />
                    <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Magias Iniciais (1º Círculo)</h3>
                  </div>
                  <span className={cn('font-cinzel text-xs font-bold', formData.initial_spells.length === classData?.initialSpells ? 'text-gothic-gold' : 'text-gothic-text/40')}>
                    {formData.initial_spells.length}/{classData?.initialSpells}
                  </span>
                </div>
                <p className="text-[10px] text-gothic-text/40 mb-5">
                  Escolha {classData?.initialSpells} magia{(classData?.initialSpells ?? 0) > 1 ? 's' : ''} de 1º círculo
                  {classData?.spellType === 'arcana' ? ' arcana' : classData?.spellType === 'divina' ? ' divina' : ''}.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto gothic-scroll pr-2">
                  {SPELLS
                    .filter(s => s.circle === 1 && (classData?.spellType === 'universal' || s.type === (classData?.spellType === 'arcana' ? 'Arcana' : 'Divina') || s.type === 'Universal'))
                    .map(spell => {
                      const selected = formData.initial_spells.includes(spell.name);
                      return (
                        <button
                          key={spell.name}
                          disabled={!selected && formData.initial_spells.length >= (classData?.initialSpells ?? 0)}
                          onClick={() => toggleSpell(spell.name)}
                          className={cn('p-3 text-left border transition-all',
                            selected ? 'bg-gothic-blue/10 border-gothic-blue' : 'border-gothic-gold/10 hover:border-gothic-gold/30 disabled:opacity-30'
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <h4 className="font-cinzel text-xs font-bold text-gothic-text">{spell.name}</h4>
                            <span className="text-[8px] text-gothic-blue">{spell.cost} PM</span>
                          </div>
                          <p className="text-[9px] text-gothic-text/40 mt-1 line-clamp-2">{spell.description}</p>
                        </button>
                      );
                    })}
                </div>
              </div>

              <NavButtons
                onBack={handleBack}
                onNext={handleNext}
                nextLabel="Próximo"
                nextDisabled={!stepValid()}
              />
            </motion.div>
          )}

          {/* ─── STEP: Equipment & Gold ─── */}
          {currentStep === 'equipment' && (
            <motion.div key="s_equipment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              {/* Gold header */}
              <div className="bg-gothic-card p-5 border border-gothic-gold/20 flex items-center justify-between">
                <div>
                  <h3 className="font-cinzel text-sm font-bold text-gothic-gold uppercase tracking-widest">Tesouro Inicial</h3>
                  <p className="text-[10px] text-gothic-text/40 mt-1">
                    {CLASSES[canonicalClassId]?.name || 'Sua classe'} começa com {startingGold} T$
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn('font-cinzel text-3xl font-bold', remainingGold >= 0 ? 'text-gothic-gold' : 'text-gothic-red')}>
                    {remainingGold.toFixed(1)} T$
                  </span>
                  <p className="text-[9px] text-gothic-text/40 uppercase tracking-widest">restante</p>
                </div>
              </div>

              <p className="text-[10px] text-gothic-text/40 px-1">
                Escolha os itens iniciais do seu personagem. O passo é opcional — você pode pular e comprar depois no inventário.
              </p>

              {/* Items by category */}
              {ITEM_CATEGORIES.map(cat => {
                const catItems = Object.values(ITEMS).filter(item => item.type === cat);
                if (catItems.length === 0) return null;
                return (
                  <div key={cat} className="bg-gothic-card border border-gothic-gold/10 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gothic-gold/10 bg-black/20">
                      <h4 className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-gothic-gold/70">{cat}</h4>
                    </div>
                    <div className="divide-y divide-gothic-gold/5">
                      {catItems.map(item => {
                        const qty = formData.purchased_items[item.name] || 0;
                        const cost = parseCost(item.cost);
                        return (
                          <div key={item.name} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="flex-1 min-w-0">
                              <p className="font-cinzel text-xs font-bold text-gothic-text">{item.name}</p>
                              <div className="flex flex-wrap gap-3 mt-0.5">
                                <span className="text-[9px] text-gothic-gold">{item.cost}</span>
                                {item.damage && <span className="text-[9px] text-gothic-red">{item.damage}</span>}
                                {item.defenseBonus !== undefined && <span className="text-[9px] text-gothic-blue">+{item.defenseBonus} DEF</span>}
                                {item.penalty !== undefined && item.penalty > 0 && <span className="text-[9px] text-gothic-text/30">−{item.penalty} AGL</span>}
                                <span className="text-[9px] text-gothic-text/25">{item.weight}kg</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => setFormData(f => {
                                  const q = (f.purchased_items[item.name] || 0) - 1;
                                  if (q <= 0) {
                                    const { [item.name]: _, ...rest } = f.purchased_items;
                                    return { ...f, purchased_items: rest };
                                  }
                                  return { ...f, purchased_items: { ...f.purchased_items, [item.name]: q } };
                                })}
                                disabled={qty === 0}
                                className="w-7 h-7 border border-gothic-gold/20 text-gothic-gold flex items-center justify-center disabled:opacity-20 hover:border-gothic-gold transition-colors text-base"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="font-cinzel text-sm w-5 text-center text-gothic-text">{qty}</span>
                              <button
                                onClick={() => setFormData(f => {
                                  const newRem = remainingGold - cost;
                                  if (newRem < 0) return f;
                                  return { ...f, purchased_items: { ...f.purchased_items, [item.name]: (f.purchased_items[item.name] || 0) + 1 } };
                                })}
                                disabled={remainingGold < cost}
                                className="w-7 h-7 border border-gothic-gold/20 text-gothic-gold flex items-center justify-center disabled:opacity-20 hover:border-gothic-gold transition-colors"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <NavButtons
                onBack={handleBack}
                onNext={handleCreate}
                nextLabel="Forjar Personagem"
                nextDisabled={false}
                submitting={submitting}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Navigation buttons sub-component
// ---------------------------------------------------------------------------

interface NavButtonsProps {
  onBack: () => void;
  backLabel?: string;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  submitting?: boolean;
  error?: string | null;
}

function NavButtons({ onBack, backLabel = 'Voltar', onNext, nextLabel = 'Próximo', nextDisabled, submitting, error }: NavButtonsProps) {
  return (
    <div className="flex justify-between items-end pt-4">
      <button onClick={onBack} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold hover:text-white transition-colors">
        <ChevronLeft size={18} /> {backLabel.toUpperCase()}
      </button>
      <div className="flex flex-col items-end gap-2">
        {error && <p className="text-gothic-red text-[10px] uppercase font-bold tracking-widest max-w-xs text-right">{error}</p>}
        <button
          disabled={nextDisabled || submitting}
          onClick={onNext}
          className={cn(
            'flex items-center gap-2 px-8 py-3 font-cinzel font-bold transition-colors disabled:opacity-50',
            nextLabel?.toLowerCase().includes('forjar')
              ? 'bg-gothic-red text-white hover:bg-red-600 shadow-[0_0_20px_rgba(139,0,0,0.4)]'
              : 'bg-gothic-gold text-gothic-bg hover:bg-white'
          )}
        >
          {submitting
            ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : nextLabel?.toLowerCase().includes('forjar')
              ? <><Sparkles size={16} />{nextLabel}</>
              : <>{nextLabel} <ChevronRight size={18} /></>
          }
        </button>
      </div>
    </div>
  );
}
