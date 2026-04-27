# 04 — Classes

## Finalidade

Este documento define como as classes devem ser representadas no Rubi de Arton.

A classe é uma das principais fontes de regras da ficha. Ela determina pontos de vida, pontos de mana, perícias, proficiências, habilidades fixas e poderes disponíveis.

## Estrutura técnica de uma classe

```ts
type ClassRule = {
  id: string;
  name: string;
  mainAttributes: string[];
  initialPV: number;
  pvPerLevel: number;
  pmPerLevel: number;
  mandatorySkills: SkillChoiceRule[];
  optionalSkills: SkillChoiceRule;
  proficiencies: string[];
  fixedAbilities: ClassAbilityByLevel[];
  classPowerType: string;
};
```

## Campos obrigatórios

- `id`: identificador interno.
- `name`: nome exibido na interface.
- `mainAttributes`: atributos principais sugeridos.
- `initialPV`: PV recebido no primeiro nível.
- `pvPerLevel`: PV recebido ao subir de nível na classe.
- `pmPerLevel`: PM recebido por nível na classe.
- `mandatorySkills`: perícias fixas ou escolhas obrigatórias.
- `optionalSkills`: lista de perícias opcionais e quantidade a escolher.
- `proficiencies`: proficiências concedidas pela classe.
- `fixedAbilities`: habilidades fixas por nível.
- `classPowerType`: tipo de poder de classe.

## Regra de progressão

A classe deve informar quais habilidades são recebidas automaticamente por nível.

Poderes de classe não devem ser aplicados automaticamente. Eles devem gerar uma escolha pendente para o jogador.

## Critérios de aceite

- A classe deve fornecer PV e PM corretamente.
- A classe deve liberar habilidades fixas no nível correto.
- A classe deve gerar escolhas de perícias conforme regras da classe.
- A classe deve listar os poderes compatíveis para evolução.
- O usuário não deve conseguir escolher poder de outra classe, exceto quando uma regra permitir explicitamente.
