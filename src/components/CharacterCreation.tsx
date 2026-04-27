import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Sword, User, Book, Plus, Minus, ChevronRight, ChevronLeft, Sparkles, 
  AlertCircle, Loader2, Target, Zap, Check 
} from 'lucide-react';
import { 
  compendiumService, 
  Roles, 
  type Race as CompendiumRace, 
  type Class as CompendiumClass, 
  type Origin as CompendiumOrigin, 
  type Power 
} from '../lib/compendium';
import { characterService } from '../lib/character';
import { cn } from '../lib/utils';
import SheetBuilder, { 
  RaceFactory, 
  RoleFactory, 
  OriginFactory, 
  Translator, 
  ArcanistFactory, 
  RoleName, 
  RaceName,
  SkillName,
  Race as T20Race,
  Origin as T20Origin,
  OriginBenefitSkill,
  OriginName,
  ArcanistPathName,
  EquipmentName,
  SpellName
} from 't20-sheet-builder';
import { RACES } from '../data/t20-data';

// Custom Race implementation to support races not in the library
class CustomRace extends T20Race {
  readonly attributeModifiers: any = {};
  readonly abilities: any = {};

  constructor(name: string, modifiers: any) {
    super(name as any);
    this.attributeModifiers = modifiers;
  }

  addToSheet(transaction: any): void {
    const attributes = transaction.sheet.getSheetAttributes();
    if (attributes && typeof attributes.applyRaceModifiers === 'function') {
      attributes.applyRaceModifiers(this.attributeModifiers);
    }
  }

  protected serializeSpecific(): any {
    return { name: this.name as any };
  }
}

// Custom Origin implementation to support origins not in the library
class CustomOrigin extends T20Origin {
  readonly name: any;
  readonly equipments: any[] = [];

  constructor(name: string, skills: SkillName[] = [SkillName.athletics, SkillName.will]) {
    // Provide 2 benefits to satisfy Origin validation (requires exactly 2)
    const benefit1 = new OriginBenefitSkill(skills[0]);
    const benefit2 = new OriginBenefitSkill(skills[1] || skills[0]);
    
    // Provide the corresponding skills in the benefits list to satisfy benefit validation
    super([benefit1, benefit2], { 
      skills: skills, 
      generalPowers: [], 
      originPower: undefined 
    } as any);
    this.name = name;
  }

  serialize(): any {
    return { name: this.name, chosenBenefits: [], equipments: [] };
  }
}

interface CharacterCreationProps {
  onComplete: (characterId: string) => void;
  onCancel: () => void;
  userId: string;
}

// --- Constants ---

const DEFAULT_CLASS_SKILLS: Record<string, SkillName[][]> = {
  arcanist: [[SkillName.knowledge, SkillName.diplomacy]],
  warrior: [[SkillName.fight], [SkillName.animalHandling, SkillName.athletics]],
  barbarian: [[SkillName.animalHandling, SkillName.athletics, SkillName.animalRide, SkillName.initiative]],
  buccaneer: [[SkillName.fight], [SkillName.acrobatics, SkillName.athletics, SkillName.acting, SkillName.cheat]],
  bard: [[SkillName.acrobatics, SkillName.animalRide, SkillName.knowledge, SkillName.diplomacy, SkillName.cheat, SkillName.stealth]],
  ranger: [[SkillName.fight], [SkillName.animalHandling, SkillName.athletics, SkillName.animalRide, SkillName.cure, SkillName.fortitude, SkillName.stealth]],
  knight: [[SkillName.animalHandling, SkillName.athletics]],
  cleric: [[SkillName.knowledge, SkillName.cure]],
  druid: [[SkillName.animalHandling, SkillName.athletics, SkillName.animalRide, SkillName.knowledge]],
  inventor: [[SkillName.knowledge, SkillName.cure, SkillName.diplomacy, SkillName.fortitude]],
  rogue: [[SkillName.acrobatics, SkillName.athletics, SkillName.acting, SkillName.animalRide, SkillName.knowledge, SkillName.diplomacy, SkillName.cheat, SkillName.stealth]],
  fighter: [[SkillName.acrobatics, SkillName.animalHandling, SkillName.athletics, SkillName.cheat]],
  noble: [[SkillName.diplomacy, SkillName.intimidation], [SkillName.animalHandling, SkillName.acting, SkillName.animalRide, SkillName.knowledge]],
  paladin: [[SkillName.animalHandling, SkillName.athletics]],
};

const CLASS_MANDATORY_SKILLS: Record<string, SkillName[]> = {
  arcanist: [SkillName.will, SkillName.mysticism],
  warrior: [SkillName.fight, SkillName.fortitude],
  barbarian: [SkillName.fight, SkillName.fortitude],
  buccaneer: [SkillName.reflexes, SkillName.initiative],
  bard: [SkillName.reflexes, SkillName.will],
  ranger: [SkillName.survival, SkillName.aim],
  knight: [SkillName.fortitude, SkillName.will],
  cleric: [SkillName.religion, SkillName.will],
  druid: [SkillName.survival, SkillName.will],
  inventor: [SkillName.craft, SkillName.will],
  rogue: [SkillName.reflexes, SkillName.thievery],
  fighter: [SkillName.fight, SkillName.fortitude],
  noble: [SkillName.will, SkillName.diplomacy],
  paladin: [SkillName.will, SkillName.fight],
};

const DEFAULT_ORIGIN_BENEFITS: Record<string, string[]> = {
  acolito: ['Vontade', 'Religião', 'Membro da Igreja', 'Símbolo Sagrado'],
  amigo_dos_animais: ['Adestramento', 'Cavalgar', 'Amigo Especial', 'Voz dos Bichos'],
  amnesico: [],
  aristocrata: ['Diplomacia', 'Nobreza', 'Sangue Azul', 'Riqueza'],
  artesao: ['Ofício', 'Vontade', 'Frutos do Trabalho', 'Ferramentas de Mestre'],
  assistente_de_laboratorio: ['Ofício (Alquimia)', 'Conhecimento', 'Cientista', 'Mistura Alquímica'],
  batedor: ['Percepção', 'Sobrevivência', 'Sentidos Aguçados', 'Caminho da Floresta'],
  capanga: ['Intimidação', 'Luta', 'Confissão', 'Valentão'],
  charlatao: ['Enganação', 'Jogatina', 'Impostor', 'Lábia'],
  circense: ['Acrobacia', 'Atuação', 'Equilibrista', 'Truque de Mestre'],
  criminoso: ['Enganação', 'Furtividade', 'Ladinagem', 'Pivete'],
  curandeiro: ['Cura', 'Vontade', 'Médico', 'Mãos de Cura'],
  eremita: ['Misticismo', 'Religião', 'Busca Interior', 'Solidão'],
  escravo: ['Fortitude', 'Furtividade', 'Duro de Matar', 'Vontade de Ferro'],
  estudioso: ['Conhecimento', 'Nobreza', 'Palpites', 'Biblioteca Pessoal'],
  fazendeiro: ['Adestramento', 'Ofício (Fazendeiro)', 'Água no Feijão', 'Vigor Rural'],
  forasteiro: ['Cultura', 'Sobrevivência', 'Língua Exótica', 'Adaptação'],
  gladiador: ['Luta', 'Intimidação', 'Pão e Circo', 'Técnica de Luta'],
  guarda: ['Investigação', 'Luta', 'Sentinela', 'Abordagem'],
  herdeiro: ['Nobreza', 'Vontade', 'Herança', 'Contatos'],
  heroi_campones: ['Adestramento', 'Ofício', 'Voz do Povo', 'Coração Valente'],
  marujo: ['Atletismo', 'Percepção', 'Amigo do Mar', 'Velejador'],
  mercador: ['Diplomacia', 'Ofício (Mercador)', 'Negociação', 'Olho para o Lucro'],
  minerador: ['Fortitude', 'Ofício (Minerador)', 'Sentido do Ouro', 'Resistência'],
  nomade: ['Cavalgar', 'Sobrevivência', 'Mochileiro', 'Sentido de Direção'],
  pivete: ['Furtividade', 'Ladinagem', 'Conhecimento de Ruas', 'Agilidade'],
  refugiado: ['Fortitude', 'Furtividade', 'Sobrevivente', 'Resiliência'],
  seguidor: ['Conhecimento', 'Ofício', 'Fiel', 'Aprendiz'],
  selvagem: ['Adestramento', 'Sobrevivência', 'Vida Selvagem', 'Instinto Selvagem'],
  soldado: ['Fortitude', 'Luta', 'Influência Militar', 'Armamento Pesado'],
  taberneiro: ['Diplomacia', 'Jogatina', 'Bom de Papo', 'Vigor Físico'],
  trabalhador: ['Atletismo', 'Fortitude', 'Esforço Físico', 'Vigor Físico'],
};

export function CharacterCreation({ onComplete, onCancel, userId }: CharacterCreationProps) {
  const [step, setStep] = useState(1);
  const [races, setRaces] = useState<CompendiumRace[]>([]);
  const [classes, setClasses] = useState<CompendiumClass[]>([]);
  const [origins, setOrigins] = useState<CompendiumOrigin[]>([]);
  const [availablePowers, setAvailablePowers] = useState<Power[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    race_id: '',
    class_id: '',
    origin_id: '',
    attributes_base: { for: 0, des: 0, con: 0, int: 0, sab: 0, car: 0 },
    initial_powers: [] as string[]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [r, c, o] = await Promise.all([
          compendiumService.getRaces(),
          compendiumService.getClasses(),
          compendiumService.getOrigins()
        ]);
        
        setRaces(r);
        setClasses(c);
        setOrigins(o);
        
        const p = await compendiumService.getPowers('Geral');
        setAvailablePowers(p);
      } catch (error) {
        console.error('Error loading compendium data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCreate = async () => {
    if (submitting) return;
    console.log('1. Starting handleCreate...');
    console.log('Form Data:', JSON.stringify(formData, null, 2));
    setSubmitting(true);
    setError(null);

    try {
      const builder = new SheetBuilder();
      const trainedSkills = new Set<SkillName>();

      // Helper to pick skills that aren't already trained
      const getSafeChoices = (choices: SkillName[], count: number): SkillName[] => {
        const result: SkillName[] = [];
        for (const s of choices) {
          if (!trainedSkills.has(s)) {
            result.push(s);
            trainedSkills.add(s);
            if (result.length === count) return result;
          }
        }
        // Fallback to any skill not trained
        const allSkills = Object.values(SkillName);
        for (const s of allSkills) {
          if (!trainedSkills.has(s)) {
            result.push(s);
            trainedSkills.add(s);
            if (result.length === count) return result;
          }
        }
        return result;
      };

      // Add class mandatory skills to trained set early to avoid race/origin conflicts
      const classMandatory = CLASS_MANDATORY_SKILLS[formData.class_id] || [];
      classMandatory.forEach(s => trainedSkills.add(s));
      
      // 1. Attributes
      console.log('2. Setting attributes:', formData.attributes_base);
      builder.setInitialAttributes({
        strength: formData.attributes_base.for,
        dexterity: formData.attributes_base.des,
        constitution: formData.attributes_base.con,
        intelligence: formData.attributes_base.int,
        wisdom: formData.attributes_base.sab,
        charisma: formData.attributes_base.car
      });

      // 2. Race
      console.log('3. Adding race:', formData.race_id);
      let race;
      const supportedRaces = [RaceName.human, RaceName.dwarf, RaceName.elf, RaceName.dahllan, RaceName.goblin, RaceName.qareen, RaceName.minotaur];
      
      if (formData.race_id === RaceName.human) {
        const raceSkills = getSafeChoices([SkillName.perception, SkillName.initiative, SkillName.stealth, SkillName.athletics], 2);
        race = RaceFactory.makeFromSerialized({ 
          name: RaceName.human, 
          selectedAttributes: ['strength', 'dexterity', 'constitution'],
          chosenSkills: raceSkills
        } as any);
      } else if (supportedRaces.includes(formData.race_id as any)) {
        race = RaceFactory.makeFromSerialized({ name: formData.race_id as any } as any);
        // Add mandatory race skills to trained set (approximate)
        if (formData.race_id === 'hynne') trainedSkills.add(SkillName.stealth);
        if (formData.race_id === RaceName.dahllan) trainedSkills.add(SkillName.survival);
        if (formData.race_id === RaceName.goblin) trainedSkills.add(SkillName.stealth);
      } else {
        const raceData = (RACES as any)[formData.race_id];
        const modifiers: any = {};
        if (raceData?.modifiers) {
          if (raceData.modifiers.for) modifiers.strength = raceData.modifiers.for;
          if (raceData.modifiers.des) modifiers.dexterity = raceData.modifiers.des;
          if (raceData.modifiers.con) modifiers.constitution = raceData.modifiers.con;
          if (raceData.modifiers.int) modifiers.intelligence = raceData.modifiers.int;
          if (raceData.modifiers.sab) modifiers.wisdom = raceData.modifiers.sab;
          if (raceData.modifiers.car) modifiers.charisma = raceData.modifiers.car;
        }
        race = new CustomRace(formData.race_id, modifiers);
      }
      builder.chooseRace(race);
      
      // 3. Class
      console.log('4. Adding class:', formData.class_id);
      let role;
      
      // Filter default skills to avoid duplicates
      const rawDefaultSkills = DEFAULT_CLASS_SKILLS[formData.class_id] || [[]];
      const filteredDefaultSkills = rawDefaultSkills.map(group => {
        const safe = group.filter(s => !trainedSkills.has(s));
        if (safe.length === 0) {
          // If all skills in group are trained, pick a random safe one
          return getSafeChoices([], 1);
        }
        safe.forEach(s => trainedSkills.add(s));
        return safe;
      });

      if (formData.class_id === RoleName.arcanist) {
        role = ArcanistFactory.makeFromSerialized({ 
          name: RoleName.arcanist, 
          selectedSkillsByGroup: filteredDefaultSkills,
          path: { 
            name: ArcanistPathName.wizard, 
            focus: EquipmentName.staff 
          },
          initialSpells: [SpellName.arcaneArmor, SpellName.mentalDagger, SpellName.illusoryDisguise]
        } as any);
      } else {
        const RoleClass = (Roles as any).get(formData.class_id);
        if (RoleClass) {
          role = new RoleClass(filteredDefaultSkills);
        } else {
          // Fallback for Warrior or others if not in Roles map
          role = RoleFactory.makeFromSerialized({ 
            name: formData.class_id as any, 
            selectedSkillsByGroup: filteredDefaultSkills,
          } as any);
        }
      }
      
      if (role) {
        builder.chooseRole(role);
      }
      
      // 4. Origin
      console.log('5. Adding origin:', formData.origin_id);
      const originIdMap: Record<string, OriginName> = {
        acolito: OriginName.acolyte,
        amigo_dos_animais: OriginName.animalsFriend
      };
      
      const mappedName = originIdMap[formData.origin_id];
      
      let origin: any;
      try {
        if (mappedName) {
          const originSkills = getSafeChoices([SkillName.athletics, SkillName.will], 2);
          origin = OriginFactory.makeFromSerialized({ 
            name: mappedName, 
            chosenBenefits: originSkills.map(s => ({ name: s }))
          } as any);
        } else {
          const originSkills = getSafeChoices([SkillName.athletics, SkillName.will], 2);
          origin = new CustomOrigin(formData.origin_id, originSkills);
        }
      } catch (originErr) {
        console.warn('Error creating standard origin, falling back to custom:', originErr);
        const originSkills = getSafeChoices([SkillName.athletics, SkillName.will], 2);
        origin = new CustomOrigin(formData.origin_id, originSkills);
      }
      builder.chooseOrigin(origin);

      console.log('6. Building sheet...');
      const sheet = builder.build();
      console.log('7. Sheet built successfully.');
      
      const attributes = sheet.getSheetAttributes().getValues();
      const maxHP = sheet.getMaxLifePoints();
      const maxMP = sheet.getMaxManaPoints();
      
      console.log('8. Creating character in database...');
      const character = await characterService.createCharacter({
        name: formData.name,
        user_id: userId,
        race_id: formData.race_id,
        class_id: formData.class_id,
        origin_id: formData.origin_id,
        level: 1,
        attributes_base: {
          for: attributes.strength,
          des: attributes.dexterity,
          con: attributes.constitution,
          int: attributes.intelligence,
          sab: attributes.wisdom,
          car: attributes.charisma
        },
        current_hp: maxHP,
        current_mp: maxMP,
        notes: `CHAR_DATA_JSON:${JSON.stringify({
          inventory: [],
          deity: '',
          spells: formData.class_id === 'arcanist' ? ['armadura_arcana', 'seta_infalível_de_talude', 'disfarce_ilusório'] : []
        })}`
      });
      console.log('9. Character created with ID:', character.id);

      // 10. Add initial powers
      const originBenefits = DEFAULT_ORIGIN_BENEFITS[formData.origin_id] || [];
      console.log('10. Adding origin benefits:', originBenefits);
      
      // Fetch all powers to find the IDs
      const allPowers = await compendiumService.getPowers();
      
      for (const benefitName of originBenefits) {
        // Try to find in compendium
        const power = allPowers.find(p => p.name.toLowerCase() === benefitName.toLowerCase());
        if (power) {
          await characterService.addPowerToCharacter(character.id, power.id, 'origin', 1);
        } else {
          // If not found in compendium, it might be a skill or we use a generated ID
          // For now, let's use the name-based ID as a fallback
          const fallbackId = benefitName.toLowerCase().replace(/\s+/g, '_');
          await characterService.addPowerToCharacter(character.id, fallbackId, 'origin', 1);
        }
      }

      console.log('11. Character creation complete! Advancing...');
      onComplete(character.id);
    } catch (err: any) {
      console.error('CRITICAL ERROR in handleCreate:', err);
      let message = 'Erro ao criar personagem. Verifique se a combinação de raça/classe é válida.';
      
      if (err.message) {
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.error) message = `Erro no Firestore: ${parsed.error}`;
          else message = `Erro: ${err.message}`;
        } catch {
          message = `Erro: ${err.message}`;
        }
      }
      
      setError(message);
    } finally {
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

  const getAttributeCost = (val: number) => {
    const costs: Record<number, number> = {
      [-1]: -1,
      [0]: 0,
      [1]: 1,
      [2]: 2,
      [3]: 4,
      [4]: 7
    };
    return costs[val] ?? 0;
  };

  const totalPointsUsed = (Object.values(formData.attributes_base) as number[]).reduce((acc: number, val: number) => acc + getAttributeCost(val), 0);
  const remainingPoints = 10 - totalPointsUsed;

  const attrMapping = {
    for: 'strength',
    des: 'dexterity',
    con: 'constitution',
    int: 'intelligence',
    sab: 'wisdom',
    car: 'charisma'
  } as const;

  return (
    <div className="fixed inset-0 bg-gothic-bg z-50 overflow-y-auto gothic-scroll">
      <div className="max-w-4xl mx-auto p-4 md:p-8 py-8 md:py-16">
        <header className="text-center mb-8 md:mb-16 relative">
          <button 
            onClick={onCancel}
            className="md:absolute left-0 top-0 text-gothic-gold/40 hover:text-gothic-gold transition-colors font-cinzel text-[10px] md:text-xs flex items-center gap-1 mb-4 md:mb-0"
          >
            <ChevronLeft size={14} /> CANCELAR
          </button>
          <h1 className="font-cinzel text-2xl md:text-4xl font-bold text-gothic-gold mb-2 tracking-tighter">Criação de Personagem</h1>
          <div className="h-1 w-24 md:w-32 bg-gothic-red mx-auto" />
          <p className="text-gothic-text/40 text-[8px] md:text-[10px] uppercase tracking-[0.3em] mt-4">Passo {step} de 4</p>
        </header>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20">
                <label className="block font-cinzel text-xs md:text-sm text-gothic-gold mb-4 uppercase tracking-widest">Como você será conhecido em Arthon?</label>
                <input 
                  type="text"
                  placeholder="Ex: Sir Alistair, o Audaz"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/40 border border-gothic-gold/20 p-3 md:p-4 font-cinzel text-lg md:text-xl text-gothic-text focus:border-gothic-gold outline-none transition-colors"
                />
              </div>

              <div className="bg-gothic-card p-4 md:p-8 border border-gothic-gold/20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                  <label className="block font-cinzel text-xs md:text-sm text-gothic-gold uppercase tracking-widest">Distribua seus Atributos</label>
                  <div className="px-3 py-1 bg-gothic-gold/10 border border-gothic-gold/20 self-start">
                    <span className="text-[10px] text-gothic-gold font-bold uppercase tracking-widest">Pontos: {remainingPoints}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-8">
                  {(Object.keys(formData.attributes_base) as Array<keyof typeof formData.attributes_base>).map(attr => (
                    <div key={attr} className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-bold text-gothic-gold uppercase tracking-widest">
                        {Translator.getAttributeTranslation(attrMapping[attr]).substring(0, 3)}
                      </span>
                      <div className="flex items-center gap-2 md:gap-4">
                        <button 
                          disabled={formData.attributes_base[attr] <= -1}
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] - 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors disabled:opacity-20"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-cinzel text-xl md:text-2xl font-bold text-gothic-text w-6 md:w-8 text-center">{formData.attributes_base[attr]}</span>
                        <button 
                          disabled={formData.attributes_base[attr] >= 4 || remainingPoints < (getAttributeCost(formData.attributes_base[attr] + 1) - getAttributeCost(formData.attributes_base[attr]))}
                          onClick={() => setFormData(f => ({ ...f, attributes_base: { ...f.attributes_base, [attr]: f.attributes_base[attr] + 1 } }))}
                          className="w-8 h-8 flex items-center justify-center border border-gothic-gold/20 hover:border-gothic-gold text-gothic-gold transition-colors disabled:opacity-20"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gothic-text/30 mt-8 text-center uppercase tracking-widest">Dica: Em T20 Jogo do Ano, os atributos começam em 0 e você tem 10 pontos para distribuir (máximo 4).</p>
              </div>

              <div className="flex justify-end">
                <button 
                  disabled={!formData.name || remainingPoints !== 0}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {races.map(race => (
                  <button
                    key={race.id}
                    onClick={() => setFormData({ ...formData, race_id: race.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300 flex flex-col h-full",
                      formData.race_id === race.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <h3 className="font-cinzel text-lg md:text-xl font-bold text-gothic-gold mb-2">{race.name}</h3>
                    <p className="text-[10px] md:text-xs text-gothic-text/80 mb-4 leading-relaxed">{race.description}</p>
                    {race.abilities && (
                      <div className="mt-auto pt-4 border-t border-gothic-gold/10">
                        <p className="text-[10px] uppercase tracking-widest text-gothic-gold/60 mb-2">Habilidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {race.abilities.split(', ').map((ability, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gothic-gold/5 border border-gothic-gold/20 text-gothic-gold/80 rounded-sm">
                              {ability}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <button 
                  disabled={!formData.race_id}
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {classes.map(cls => (
                  <button
                    key={cls.id}
                    onClick={() => setFormData({ ...formData, class_id: cls.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300",
                      formData.class_id === cls.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-cinzel text-lg md:text-xl font-bold text-gothic-gold">{cls.name}</h3>
                      <div className="flex gap-1 md:gap-2">
                        <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 bg-gothic-red/10 text-gothic-red border border-gothic-red/20">{cls.hp_initial} PV</span>
                        <span className="text-[8px] md:text-[9px] px-1.5 py-0.5 bg-gothic-blue/10 text-gothic-blue border border-gothic-blue/20">{cls.mana_per_level} PM</span>
                      </div>
                    </div>
                    <p className="text-xs text-gothic-text/60 line-clamp-3 leading-relaxed">{cls.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <button 
                  disabled={!formData.class_id}
                  onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-8 py-3 bg-gothic-gold text-gothic-bg font-cinzel font-bold hover:bg-white transition-colors disabled:opacity-50"
                >
                  PRÓXIMO <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {origins.map(origin => (
                  <button
                    key={origin.id}
                    onClick={() => setFormData({ ...formData, origin_id: origin.id })}
                    className={cn(
                      "p-6 text-left border transition-all duration-300 group",
                      formData.origin_id === origin.id 
                        ? "bg-gothic-gold/10 border-gothic-gold shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                        : "bg-gothic-card border-gothic-gold/10 hover:border-gothic-gold/40"
                    )}
                  >
                    <h3 className="font-cinzel text-lg md:text-xl font-bold text-gothic-gold mb-2">{origin.name}</h3>
                    <p className="text-[10px] md:text-xs text-gothic-text/60 mb-4 leading-relaxed">{origin.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(typeof (origin as any).benefits === 'string' 
                        ? (origin as any).benefits.split(',') 
                        : Array.isArray((origin as any).benefits) 
                          ? (origin as any).benefits 
                          : []
                      ).map((benefit: string, idx: number) => (
                        <span 
                          key={idx}
                          className="text-[9px] px-2 py-0.5 bg-gothic-gold/5 text-gothic-gold/80 border border-gothic-gold/10 rounded-sm uppercase tracking-wider"
                        >
                          {typeof benefit === 'string' ? benefit.trim() : String(benefit)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="flex items-center gap-2 text-gothic-gold font-cinzel font-bold"><ChevronLeft size={18} /> VOLTAR</button>
                <div className="flex flex-col items-end gap-2">
                  {error && <p className="text-gothic-red text-[10px] uppercase font-bold tracking-widest">{error}</p>}
                  <button 
                    disabled={!formData.origin_id || submitting}
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-8 py-3 bg-gothic-red text-white font-cinzel font-bold hover:bg-red-600 transition-colors shadow-[0_0_20px_rgba(139,0,0,0.4)] disabled:opacity-50"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>FORJAR PERSONAGEM <Sparkles size={18} /></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
