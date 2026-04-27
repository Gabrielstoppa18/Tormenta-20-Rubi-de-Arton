import React from 'react';
import { motion } from 'motion/react';
import { Book, Shield, Sword, Zap, Heart, Star } from 'lucide-react';

const Rules = () => {
  const sections = [
    {
      title: "1. Atributos",
      icon: <Star className="text-gothic-gold" />,
      content: "Você começa com 0 em todos os atributos e tem 10 pontos para distribuir. O custo de cada ponto aumenta conforme o valor desejado (ex: de 0 para 1 custa 1 ponto, de 1 para 2 custa 1 ponto, mas de 3 para 4 custa 2 pontos)."
    },
    {
      title: "2. Raça",
      icon: <Shield className="text-gothic-gold" />,
      content: "Escolha uma raça. Cada raça oferece bônus em atributos e habilidades únicas que definem sua herança em Arthon."
    },
    {
      title: "3. Classe",
      icon: <Sword className="text-gothic-gold" />,
      content: "Sua classe define seu papel no grupo. Ela determina seus Pontos de Vida (PV) iniciais, Pontos de Mana (PM), perícias treinadas e proficiências com armas e armaduras."
    },
    {
      title: "4. Origem",
      icon: <Zap className="text-gothic-gold" />,
      content: "A origem representa o que você fazia antes de se tornar um aventureiro. Ela concede duas perícias ou uma perícia e um poder de origem."
    },
    {
      title: "5. Poderes e Magias",
      icon: <Heart className="text-gothic-gold" />,
      content: "No 1º nível, você ganha os poderes básicos de sua classe. Conforme sobe de nível, pode escolher novos poderes gerais ou de classe."
    }
  ];

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-gothic-gold tracking-widest uppercase">Guia de Criação</h2>
        <p className="text-gothic-text/60 italic text-xs md:text-sm">Siga os passos ancestrais para forjar sua lenda</p>
      </div>

      <div className="grid gap-4 md:gap-6">
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gothic-card/50 border border-gothic-gold/10 p-4 md:p-6 rounded-sm hover:border-gothic-gold/30 transition-all group"
          >
            <div className="flex items-start gap-3 md:gap-4">
              <div className="p-2 md:p-3 bg-gothic-gold/5 rounded-sm group-hover:bg-gothic-gold/10 transition-colors shrink-0">
                {React.cloneElement(section.icon as React.ReactElement, { size: 18 })}
              </div>
              <div className="space-y-1 md:space-y-2">
                <h3 className="font-cinzel text-base md:text-lg font-bold text-gothic-gold/80 uppercase tracking-wider">
                  {section.title}
                </h3>
                <p className="text-gothic-text/70 text-xs md:text-sm leading-relaxed">
                  {section.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-gothic-red/5 border border-gothic-red/20 p-6 rounded-sm space-y-4">
        <div className="flex items-center gap-2 text-gothic-red">
          <Book size={20} />
          <h3 className="font-cinzel font-bold uppercase tracking-widest">Nota Importante</h3>
        </div>
        <p className="text-gothic-text/60 text-xs leading-relaxed italic">
          Tormenta 20 é um sistema de alta fantasia heroica. Seus personagens são heróis destinados a grandes feitos. 
          Lembre-se de equilibrar seus atributos de acordo com sua classe: Guerreiros precisam de Força e Constituição, 
          enquanto Arcanistas dependem de Inteligência.
        </p>
      </div>
    </div>
  );
};

export default Rules;
