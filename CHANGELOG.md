# Changelog — Easy Cards

Tudo que mudou no site/app, do mais novo pro mais antigo.
Datas no fuso de Brasília. Versão atual: **1.16.0**.

---

## 1.16.0 — Editar telefone · 09/09/2026

- **Cada pessoa pode corrigir o próprio telefone** em *Meu perfil* (é o número que usa pra entrar).
- **Admin pode corrigir o telefone de qualquer usuário** direto na tela de *Usuários* — útil pra quem é cliente e não acessa o painel.

## 1.15.0 — Lista de desejo · 09/09/2026

- Nova área **Lista de desejo**: a pessoa monta a lista das cartas que tá procurando, define prioridade (alta / normal / baixa) e uma observação ("qualquer versão NM", etc).
- Botão **"puxar meus 'Quero' dos fichários"** — traz de uma vez tudo que já foi marcado nos binders.
- **Perfil público** (`easycards.app/u/seu-link`): um toggle gera um link com seu nome, seu avatar e as cartas que você quer, agrupadas por prioridade + botão de WhatsApp. Serve pra trocar e comprar na comunidade.
- **Visão da equipe** (`/admin/desejos`): todas as listas juntas, com busca, agrupável **por carta** ("quem quer isso") ou **por pessoa", com atalho de WhatsApp. Ajuda a saber o que procurar / o que já tem em mãos.
- Nova permissão *"Ver listas de desejo dos usuários"* na matriz de permissões.

## 1.14.0 — Fichário personalizado · 09/09/2026

- **Slot de imagem**: cada bolso pode ter uma carta **ou** uma imagem sua (arte, foto, divisória) — igual os fichários temáticos da galera.
- **Capa do fichário**: uma primeira página com imagem de fundo, subtítulo e os números ao vivo (cartas, quero, imagens, páginas).
- **Tenho / Quero por carta**: marca cada carta como sua ou como desejo (fica com a faixa "QUERO" e a arte esmaecida).
- **Fundo de página**: dá pra colocar uma imagem de fundo em cada página.
- **Slot 2×2 (toploader)**: a carta/imagem pode ocupar 1 bolso, 2 (largura) ou 4 (2×2), pra representar toploader e cartas de destaque.
- **Mover no celular**: antes só dava pra arrastar no computador. Agora toca na carta → botão *Mover* → toca no lugar. Tocar na carta também mostra os controles (que antes só apareciam passando o mouse).

## 1.13.0 — Financeiro pro · 09/09/2026

- Novo painel **`/admin/financeiro`**: vendido no mês, vendido total, a receber, taxas da Dominaria, quem deve quanto, vendas recentes.
- As linhas do painel **abrem direto o financeiro da carta** no catálogo, e têm botões rápidos **"marcar pago"** / **"marcar depositado"**.
- **Relatório em PDF** estilizado da Easy Cards (papel timbrado, KPIs, tabela e totais) — melhor de visualizar que a planilha.
- **Exportar CSV** do catálogo (pra Excel, com tudo: preço, comprador, entrega, taxa, pago, datas).
- Novo campo **"pagamento recebido"** separado de "vendida" (saber se o dinheiro caiu).
- **Data do depósito na Dominaria** ("depositei tal dia").
- **Filtros e busca** em `/admin/cartas` (status, pagamento, "Domi a depositar").

## 1.12.0 — Conta e perfil · 09/09/2026

- **Trocar senha** em *Meu perfil*.
- **Pokémon favorito vira seu avatar** no sistema (aparece do seu lado no painel e nas listas).
- **Fichário como convidado**: dá pra montar fichário **sem criar conta** (fica salvo no navegador, até 2). Ao se cadastrar, o sistema oferece importar.

## 1.11.0 — Quadro e apoiadores · 09/09/2026

- **Apoiadores e imprensa agora são editáveis** no painel, com lista e prévia de como fica no site.
- **Upload de imagem** (antes só dava pra colar URL) pra apoiadores e imprensa.
- **11 apoiadores cadastrados** + faixa "Quem já apoia a Easy Cards" na página inicial, com as fotos de perfil do Instagram.
- **Fundadores viraram uma aba editável** ("Time"), não mais fixos no código.

## 1.10.0 — Painel no celular + máscaras · 09/09/2026

- `/admin/cartas`, `/admin/usuarios` e `/admin/permissoes` **refeitos pra mobile** (a listagem tava espremida no celular).
- **Máscara de dinheiro (R$)** nos campos do financeiro.

## 1.9.0 — Visual novo do painel · 08/09/2026

- **Login, cadastro, portal e painel repaginados** no estilo da página principal (quadrinhos, meio-tom, sombra cômica).
- **Botão de tema claro/escuro** no painel.
- Link **"Painel"** no portal do cliente (pra staff) e **"Início"** (a galera se sentia presa nas telas).
- Drag-and-drop do fichário **corrigido** — e agora dá pra soltar carta num bolso vazio.

## 1.8.0 — Fichário turbinado · 08/09/2026

- **Adição de cartas em lote** com filtros de tipo / raridade / set e seletor de quantidade.
- **Desfazer / refazer** (Ctrl+Z) a organização das cartas.
- **Rótulos de página** e **visão de livro** (duas páginas lado a lado).
- Grades novas: 4×5 e 5×4, além de descrição do fichário e ordenação (nome, set, número, raridade, tipo).
- **Preços escondidos** no fichário (a Liga Pokémon não tem API pública confiável).
- Link **Fichário (beta)** na navbar da página inicial.

## 1.7.0 — Fichário: cartas grandes e PDF · 08/09/2026

- **Variantes** por carta (normal, reverse holo, holo, 1ª edição).
- **Cartas jumbo** (ocupam 2 bolsos).
- **Seleção em massa** (mover várias de fichário / excluir).
- **Visão geral das páginas** (reordenar páginas inteiras).
- **Exportar o fichário em PDF**.

## 1.6.0 — Fichário compartilhável · 08/09/2026

- **Link público** do fichário (`/b/...`) — qualquer pessoa vê, sem conta.
- **Ordenação** das cartas e campo de **condição padronizado** (M, NM, SP, MP, HP, DMG).
- Selo de **preço de referência** via Liga Pokémon (depois desativado, ver 1.8.0).

## 1.5.0 — Vários fichários · 08/09/2026

- Cada pessoa pode ter **mais de um fichário** (coleção geral, master set, um Pokémon só…).
- Diálogos de confirmação bonitos no lugar do "OK/Cancelar" do navegador.

## 1.4.0 — Fichário: páginas e arrastar · 08/09/2026

- Fichário virou **livro com páginas**, grade configurável e **arrastar pra reordenar** as cartas.
- Seção de **time** expandida no site.

## 1.3.0 — Quadro e painel mobile · 08/09/2026

- **Quadro** simplificado pra apoiadores / imprensa.
- Painel **redesenhado pensando no celular primeiro**.

## 1.2.0 — Imprensa e evento · 08/09/2026

- **Menções de imprensa** no quadro.
- **Data e local do evento** ligados ao banco (editável).

## 1.1.0 — O app nasceu · 08/09/2026

- **Login e cadastro** por telefone.
- **Painel administrativo** do catálogo de cartas (cadastrar carta, buscar na base de TCG, financeiro por carta).
- **Portal do cliente** ("Minhas cartas").
- **Fichário (beta)** — monte seu binder de cartas.
- **Permissões** por cargo (CTO, admin, equipe, cliente) e por pessoa.
- Endurecimento de segurança do site.

## 1.0.0 — Site de apresentação · 02–03/09/2026

- Página inicial da Easy Cards (estilo quadrinhos).
- Páginas de **evento**, **fundadores**, **apoiadores** e **imprensa**.
- Imagem de compartilhamento (Open Graph) e **painel de analytics** ao vivo.
