# Como Funciona o Sistema FoodControl 4.0

Guia de estudo para rodar, entender e explicar todo o projeto (Banco de Dados, Back-end e Front-end).

---

## 1. Como rodar o projeto

1. **Banco de Dados (MySQL Workbench):**
   * Abra e execute o arquivo `database/schema.sql` (cria o banco `foodcontrol` e as 9 tabelas).
   * Em seguida, execute o arquivo `database/seed.sql` (insere os dados iniciais com datas relativas a `CURDATE()`).
2. **Back-end (Node.js + Express):**
   * Abra o terminal na pasta `backend/`.
   * Execute `node server.js` (ou `npm start`).
   * Devem aparecer no terminal:
     * `Servidor está rodando`
     * `Conectado ao banco de dados`
3. **Front-end:**
   * Abra `frontend/index.html` no navegador (ou pelo Live Server do VS Code).
   * Faça login com um dos usuários de teste (senha padrão `123456`):
     * `marina@saborsul.com.br` (`administrador`)
     * `rafael@saborsul.com.br` (`producao`)
     * `carlos@saborsul.com.br` (`estoque`)
     * `anapaula@saborsul.com.br` (`qualidade`)

---

## 2. Caminho completo da requisição

```text
Página HTML (ex: produtos.html)
  └─> fetch('http://localhost:3000/api/produtos')   [frontend/assets/js/main.js]
        └─> app.get('/api/produtos', ...)           [backend/server.js]
              └─> db.query('SELECT ...', [], ...)   [MySQL - banco foodcontrol]
                    └─> res.status(200).json(data)  [devolve JSON para o navegador]
                          └─> JS monta as linhas <tr> na tabela da tela
```

---

## 3. Tabela de todas as rotas da API (`backend/server.js`)

| Bloco | Método | Rota | O que faz |
| :--- | :--- | :--- | :--- |
| **1. Login** | `POST` | `/api/auth/login` | Verifica e-mail, senha e `status = 'Ativo'`; devolve `id_usuario`, `nome` e `perfil`. |
| **2. Cadastros** | `GET` | `/api/produtos` | Lista todos os produtos com estoque disponível e situação (`Normal` ou `Baixo`). |
| **2. Cadastros** | `POST` | `/api/produtos` | Cadastra um novo produto validando preço, mínimo/máximo e validade padrão. |
| **2. Cadastros** | `PUT` | `/api/produtos/:id` | Atualiza os dados de um produto. |
| **2. Cadastros** | `PUT` | `/api/produtos/:id/status` | Ativa ou inativa um produto (nunca exclui histórico). |
| **2. Cadastros** | `GET` | `/api/usuarios` | Lista usuários sem retornar o campo `senha`. |
| **2. Cadastros** | `POST` | `/api/usuarios` | Cadastra um novo usuário. |
| **2. Cadastros** | `PUT` | `/api/usuarios/:id` | Atualiza dados do usuário (e senha se enviada). |
| **2. Cadastros** | `PUT` | `/api/usuarios/:id/status` | Ativa ou inativa um usuário. |
| **3. Lotes/Prod./Estoque** | `GET` | `/api/lotes` | Lista lotes ordenados por validade com dias para vencer e situação (`Vencido`, `Critico`, `Atencao`, `Normal`, `Esgotado`). |
| **3. Lotes/Prod./Estoque** | `GET` | `/api/producao` | Lista as produções recentes com lote e responsável. |
| **3. Lotes/Prod./Estoque** | `GET` | `/api/producao/proximo-lote` | Sugere o próximo código `LOT-AAAA-NNN`. |
| **3. Lotes/Prod./Estoque** | `POST` | `/api/producao` | Valida tudo e grava em sequência: `lotes` → `producao` → movimentação `Entrada`. |
| **3. Lotes/Prod./Estoque** | `GET` | `/api/estoque` | Mostra saldo disponível e saldo vencido retido por produto. |
| **3. Lotes/Prod./Estoque** | `GET` | `/api/estoque/movimentacoes` | Lista todas as movimentações de estoque. |
| **3. Lotes/Prod./Estoque** | `POST` | `/api/estoque/movimentacoes` | Registra `Entrada`, `Saida` ou `Ajuste` manual; impede saída maior que saldo e lote vencido/bloqueado; zera para `Esgotado`. |
| **4. Pedidos/FEFO/Perdas** | `GET` | `/api/pedidos` | Lista os pedidos com seus itens e resumo textual. |
| **4. Pedidos/FEFO/Perdas** | `GET` | `/api/pedidos/:id` | Detalhe do pedido com sugestão FEFO para cada item. |
| **4. Pedidos/FEFO/Perdas** | `POST` | `/api/pedidos` | Cria pedido e itens calculando `valor_total` no servidor. |
| **4. Pedidos/FEFO/Perdas** | `PUT` | `/api/pedidos/:id/status` | Avança o status na ordem certa; ao virar `Enviado`, valida e aplica todas as baixas por FEFO. |
| **4. Pedidos/FEFO/Perdas** | `GET` | `/api/perdas` | Lista todas as perdas registradas. |
| **4. Pedidos/FEFO/Perdas** | `POST` | `/api/perdas` | Registra perda (`quantidade × preço`); com lote, reduz o saldo e grava movimentação `Perda`. |
| **5. Alertas** | `GET` | `/api/alertas` | Lista alertas ordenados pelos abertos e críticos primeiro. |
| **5. Cálculos/Alertas** | `PUT` | `/api/alertas/:id/resolver` | Marca um alerta como `Resolvido`. |
| **5. Cálculos/Alertas** | `POST` | `/api/alertas/atualizar` | Marca lotes expirados como `Vencido`, cria novos alertas sem duplicar e resolve os que sumiram. |
| **6. Dashboard/Relatórios** | `GET` | `/api/dashboard` | Devolve todos os indicadores, lotes FEFO, alertas, perdas por produto/motivo e tabela de risco. |
| **6. Dashboard/Relatórios** | `GET` | `/api/relatorios/perdas/:inicio/:fim` | Relatório de perdas no período com totais por produto e motivo. |
| **6. Dashboard/Relatórios** | `GET` | `/api/relatorios/estoque` | Posição de estoque e lotes próximos da validade/vencidos. |
| **6. Dashboard/Relatórios** | `GET` | `/api/relatorios/producao/:inicio/:fim` | Produções no período e percentual de aderência ao planejado. |
| **6. Dashboard/Relatórios** | `GET` | `/api/relatorios/pedidos/:inicio/:fim` | Pedidos no período, resumo e produtos mais solicitados. |

---

## 4. Explicação simples de cada bloco do `server.js`

* **Topo e Funções Auxiliares:** importa `express`, `mysql2` e `cors`, conecta no banco `foodcontrol` e define funções pequenas reutilizadas em várias rotas (`hojeIso`, `validarProduto`, `alterarStatusAtivo`, `formatarProdutos`, `formatarLotes`, `agruparPerdas`).
* **Bloco 1 (Login):** busca na tabela `usuarios` por `email`, `senha` e `status = 'Ativo'`.
* **Bloco 2 (Cadastros):** CRUD de `produtos` e `usuarios` usando `PUT .../status` para inativar sem apagar histórico.
* **Bloco 3 (Lotes, Produção e Estoque):** consulta lotes calculando `DATEDIFF(data_validade, CURDATE())` no SQL; na produção, gera o próximo número `LOT-AAAA-NNN` e grava lote, produção e movimentação `Entrada` em sequência.
* **Bloco 4 (Pedidos, FEFO e Perdas):** aplica o FEFO em pedidos e baixa o saldo ao passar para `Enviado`; nas perdas, desconta do lote quando informado.
* **Bloco 5 (Cálculos e Alertas):** concentra as fórmulas nomeadas (`calcularRecomendacaoProducao` e `calcularIndiceRisco`) e o motor de atualização de alertas sem repetição.
* **Bloco 6 (Dashboard e Relatórios):** reúne os indicadores da fábrica e gera os 4 relatórios gerenciais.

---

## 5. Como os cálculos funcionam (com exemplos do `seed.sql`)

### A) Regra FEFO (`calcularFefoLista`)
1. Seleciona lotes do produto com `status = 'Disponivel'` e `quantidade_atual > 0`, ordenados por `data_validade ASC, data_producao ASC`.
2. Percorre a lista com `for` retirando de cada lote `Math.min(saldoLote, falta)`.
* **Exemplo no seed (Lasanha Bolonhesa, pedido de 600 un):**
  * 1º `LOT-2026-021` (vence em 5 dias, saldo 320) → retira **320** (sobra 0).
  * 2º `LOT-2026-024` (vence em 12 dias, saldo 100) → retira **100** (sobra 0).
  * 3º `LOT-2026-043` (vence em 85 dias, saldo 580) → retira **180** (sobra 400).
  * Total atendido: **600 un**, falta: **0**.

### B) Recomendação de Produção (`calcularRecomendacaoProducao`)
* **Fórmula:** `Math.max(0, pedidos_pendentes + estoque_minimo - estoque_disponivel)`
* **Exemplos no seed:**
  * **Pizza Calabresa:** `300 + 100 - 100 = 300 un`.
  * **Strogonoff de Frango:** `120 + 60 - 40 = 140 un`.
  * **Lasanha Bolonhesa:** `600 + 100 - 1000 = -300` → `Math.max(0, -300) = 0 un`.

### C) Índice de Risco de Estoque (`calcularIndiceRisco` — 0 a 100 pontos)
Soma 4 blocos com pontuação inteira:
1. **Validade (até 35 pts):** `+20` se tem lote crítico (≤ 7d), `+15` se tem lote vencido com saldo, `+10` se tem lote em atenção (8–15d).
2. **Excesso (até 20 pts):** `+20` se estoque ≥ 2× os pedidos (ou tem estoque sem pedidos), `+10` se estoque > pedidos.
3. **Perdas no mês (até 20 pts):** `+20` se perdeu ≥ 100 un, `+10` se perdeu 50–99 un, `+5` se perdeu 1–49 un.
4. **Falta (até 20 pts):** `+20` se estoque < mínimo, `+10` se estoque < pedidos pendentes.
* **Classificação:** `< 20` = **Baixo** | `20 a 44` = **Médio** | `≥ 45` = **Alto**.
* **Exemplo no seed (Lasanha Bolonhesa):** `30` (crítico + atenção) + `10` (1.000 > 600) + `20` (145 un perdidas) + `0` = **60 pontos (Alto)**.

---

## 6. 15 perguntas que o professor pode fazer (e respostas curtas)

1. **Por que usar `?` nas consultas SQL?**
   Para evitar *SQL Injection*, separando o comando SQL dos valores digitados pelo usuário.
2. **Como o sistema decide qual lote sai primeiro?**
   Pela regra FEFO (*First Expired, First Out*): filtra lotes `Disponivel` com saldo e ordena pela menor `data_validade` (desempate por `data_producao`).
3. **O que acontece se registrar uma perda maior que o saldo do lote?**
   O back-end valida antes de gravar (`quantidade > lote.quantidade_atual`) e devolve erro `400` sem alterar o banco.
4. **Por que as datas do `seed.sql` usam `CURDATE()`?**
   Para que os cenários de lote crítico, atenção, vencido e perdas do mês atual sempre existam, independente do dia da apresentação.
5. **Por que produtos e usuários não são excluídos com `DELETE`?**
   Para preservar o histórico de lotes, pedidos, produções e movimentações (`FOREIGN KEY`). Em vez disso, mudamos `status` para `'Inativo'`.
6. **Como o saldo de um lote é conferido?**
   Toda entrada (`+`), saída (`-`), perda (`-`) ou ajuste gera um registro em `movimentacoes_estoque`; a soma das movimentações do lote sempre bate com `quantidade_atual`.
7. **Por que uma produção grava em três tabelas?**
   Porque uma produção cria o lote (`lotes`), registra a ordem (`producao`) e registra a entrada inicial no estoque (`movimentacoes_estoque`).
8. **Qual a diferença entre erro `400`, `404` e `500`?**
   `400` é dado inválido enviado pelo cliente; `404` é registro não encontrado pelo ID; `500` é erro interno no servidor ou no MySQL.
9. **Por que todas as rotas de erro têm `return`?**
   Para encerrar a função imediatamente e evitar que o Express tente enviar duas respostas HTTP na mesma requisição.
10. **Um lote vencido ou bloqueado pode sair em um pedido?**
    Não. Tanto a consulta FEFO quanto a saída manual barram lotes `Vencido`, `Bloqueado` e `Esgotado`. Lote vencido só sai por perda.
11. **Em que momento um pedido dá baixa no estoque?**
    Somente quando o status muda para `Enviado`. Antes disso (`Pendente`, `Em preparacao`, `Pronto`), ele apenas compõe a demanda pendente.
12. **O que acontece se clicar duas vezes em "Atualizar Alertas"?**
    O sistema compara a chave `(tipo, id_produto, id_lote, id_pedido)` com os alertas já abertos e não cria duplicados.
13. **Por que `affectedRows === 0` é usado em alguns `PUT`?**
    Para detectar direto no `UPDATE` se o ID não existe no banco e retornar `404` sem precisar fazer um `SELECT` antes.
14. **Para que serve `cors()` no Express?**
    Para liberar o navegador (front-end) a fazer requisições `fetch` para o servidor na porta `3000`.
15. **Qual a diferença entre `req.body` e `req.params`?**
    `req.body` traz dados enviados no corpo JSON (POST/PUT); `req.params` traz valores passados direto na URL (como `:id`).
