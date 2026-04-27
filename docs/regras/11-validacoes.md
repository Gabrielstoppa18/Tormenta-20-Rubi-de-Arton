# 11 — Validações

## Finalidade

Este documento define as validações obrigatórias para impedir fichas ilegais na plataforma Rubi de Arton.

A regra principal é: a interface pode sugerir opções, mas a camada de regra deve impedir escolhas inválidas.

## Arquitetura obrigatória

A lógica deve ficar em:

```txt
src/lib/rules/
  requirements.ts
  characterCreation.ts
  levelUp.ts
  calculations.ts
```

Os componentes React não devem conter validações complexas.

## Funções mínimas da Fase 1

Criar as seguintes funções:

```ts
meetsRequirement(character, requirement): boolean
meetsRequirementGroup(character, group): boolean
meetsRequirements(character, groups): boolean
getRequirementFailureReason(character, requirement): string | null
canChoosePower(character, power): boolean
getAvailablePowers(character, powers): PowerRule[]
getBlockedPowers(character, powers): BlockedPower[]
```

## Validação de poderes

Um poder só pode ser escolhido se:

1. pertence a uma lista permitida para o personagem;
2. todos os pré-requisitos forem cumpridos;
3. não foi escolhido antes, exceto se for repetível;
4. a escolha ocorre em um momento válido, como criação, origem ou evolução.

## Validação de classe

O sistema deve validar:

- classe selecionada;
- PV inicial;
- PV por nível;
- PM por nível;
- perícias obrigatórias;
- perícias opcionais;
- proficiências;
- habilidades fixas por nível;
- poderes de classe disponíveis.

## Validação de evolução

Ao subir de nível, o sistema deve:

1. aumentar o nível;
2. aplicar PV e PM do novo nível;
3. liberar habilidades fixas da classe;
4. gerar escolhas pendentes de poder, quando aplicável;
5. listar apenas poderes válidos;
6. atualizar cálculos derivados.

## Erros amigáveis

Toda escolha bloqueada deve poder gerar uma explicação.

Exemplos:

- "Requer 6º nível de personagem."
- "Requer 12º nível de guerreiro."
- "Requer treinamento em Luta."
- "Requer o poder Especialização em Arma."
- "Este poder já foi escolhido e não é repetível."

## Critérios de aceite da Fase 1

- O projeto deve possuir arquivos de regra em JSON.
- Deve existir uma estrutura clara para classes e poderes.
- Deve existir uma especificação de validação.
- O AI Studio deve conseguir implementar as funções de regra sem reler o livro.
- A primeira classe auditada será Guerreiro.
