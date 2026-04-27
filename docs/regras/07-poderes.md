# 07 — Poderes

## Finalidade

Este documento define como os poderes devem ser modelados e validados na plataforma Rubi de Arton.

Poderes são habilidades escolhidas pelo personagem. Eles podem vir de classe, origem, raça, divindade ou listas gerais.

## Estrutura técnica de um poder

```ts
type PowerRule = {
  id: string;
  name: string;
  category: "classe" | "combate" | "destino" | "magia" | "concedido" | "tormenta" | "origem" | "raca";
  source?: string;
  powerType?: string;
  summary: string;
  requirements: RequirementGroup[];
  effects: EffectRule[];
  repeatable: boolean;
};
```

## Pré-requisitos

Todo poder pode possuir zero ou mais grupos de pré-requisitos.

Regra:

- Dentro de um mesmo grupo, todos os requisitos devem ser cumpridos.
- Quando houver mais de um grupo, cumprir qualquer grupo pode liberar o poder.
- Se `requirements` for lista vazia, o poder não possui pré-requisitos.

## Tipos de requisito aceitos

```ts
type Requirement =
  | { type: "characterLevel"; min: number }
  | { type: "classLevel"; classId: string; min: number }
  | { type: "class"; classId: string }
  | { type: "attribute"; attribute: string; min: number }
  | { type: "trainedSkill"; skillId: string }
  | { type: "power"; powerId: string }
  | { type: "race"; raceId: string }
  | { type: "deity"; deityId: string }
  | { type: "canCastSpells"; value: boolean }
  | { type: "proficiency"; proficiencyId: string };
```

## Critérios de aceite

- Poder sem pré-requisito pode ser escolhido quando a fonte permitir.
- Poder com nível mínimo só aparece ou fica disponível no nível correto.
- Poder que exige outro poder só fica disponível se o personagem já tiver o poder exigido.
- Poder que exige perícia treinada só fica disponível se o personagem tiver essa perícia.
- Poder que exige atributo mínimo deve considerar o valor atual do personagem.
- Poder repetível só pode ser escolhido mais de uma vez quando `repeatable` for `true`.
- A interface deve informar por que um poder está bloqueado.
