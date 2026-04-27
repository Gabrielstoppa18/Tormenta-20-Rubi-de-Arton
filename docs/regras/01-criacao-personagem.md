# 01 — Criação de Personagem

## Finalidade

Este documento define, em formato técnico, o fluxo de criação de personagem que será usado pela plataforma Rubi de Arton.

Ele não substitui o livro oficial. Serve como referência interna para implementação, validação e testes do sistema.

## Fluxo simplificado para o sistema

A criação de personagem deve ser implementada como um fluxo guiado, dividido em etapas:

1. Conceito do personagem
2. Atributos
3. Raça
4. Classe
5. Origem
6. Divindade, quando aplicável
7. Perícias
8. Poderes iniciais ou escolhas de classe
9. Magias, quando aplicável
10. Equipamentos iniciais
11. Cálculo das características derivadas
12. Revisão final da ficha

## Regra de implementação

A interface não deve calcular regras diretamente dentro dos componentes React.

Componentes como `CharacterCreation.tsx`, `PowersList.tsx` e `LevelUpChoice.tsx` devem apenas:

- exibir opções;
- receber escolhas do usuário;
- chamar funções de regra;
- mostrar erros ou bloqueios.

A lógica deve ficar em `src/lib/rules`.

## Dados mínimos necessários

Para criar uma ficha inicial, o sistema precisa carregar:

- raças disponíveis;
- classes disponíveis;
- origens disponíveis;
- perícias;
- poderes;
- magias, quando a classe possuir magia;
- equipamentos iniciais.

## Critérios de aceite

- O usuário não deve conseguir concluir ficha sem raça, classe e origem.
- O usuário não deve conseguir escolher opção incompatível com sua classe.
- A ficha final deve conter PV, PM, Defesa, perícias, poderes, equipamentos e demais campos derivados.
- O sistema deve diferenciar escolha válida, escolha pendente e escolha inválida.
