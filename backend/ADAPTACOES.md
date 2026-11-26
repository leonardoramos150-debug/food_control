# Adaptações e Limitações Conhecidas (FoodControl 4.0)

Este documento registra o que foi simplificado ou adaptado em relação ao dossiê e ao front-end inicial para manter o sistema dentro do conteúdo visto em aula.

## 1. Tabela de Adaptações

| O que o dossiê / projeto sugeria | O que foi feito | Motivo |
| :--- | :--- | :--- |
| Senhas com `bcrypt` e sessão por token JWT | Login simples comparando `email`, `senha` em texto e `status = 'Ativo'` (`POST /api/auth/login`), com sessão salva no `localStorage` do navegador | Decisão de escopo para usar apenas Express + MySQL sem bibliotecas externas de segurança |
| Controle de permissões via middleware JWT no back-end | Controle de exibição de menus e botões no front-end conforme o `perfil` retornado no login | Simplificação aprovada (Decisão 1), sem criação de middlewares personalizados |
| Transações MySQL (`beginTransaction` / `commit` / `rollback`) | Validação completa de todas as regras antes de gravar, seguida de queries sequenciais em callback | Simplificação aprovada (Decisão 2), mantendo o padrão de `db.query` da aula |
| Rotina diária automática às 06h com `node-cron` | Rota `POST /api/alertas/atualizar` acionada pelo botão **Atualizar Alertas** na tela | Evitar dependência externa (`node-cron`) e manter execução sob demanda |
| Arquitetura em várias pastas (`routes/`, `controllers/`, `services/`, `repositories/`) | Um único arquivo [server.js](file:///c:/TDESI/food_control/backend/server.js) dividido em blocos comentados | Seguir exatamente o padrão de servidor único ensinado em sala |
| Dados de conexão em arquivo `.env` (`dotenv`) | Dados de conexão direto no `mysql.createConnection(...)` | Seguir o padrão da aula sem instalar `dotenv` |
| Método HTTP `PATCH` para alterar status/resolver | Método `PUT` (ex.: `PUT /api/lotes/:id/status`, `PUT /api/alertas/:id/resolver`) | Padronizar com os métodos ensinados em aula (`GET`, `POST`, `PUT`, `DELETE`) |
| Filtros por query string (`req.query`) | Parâmetros na rota (`req.params`, ex.: `/api/relatorios/perdas/:inicio/:fim`) e filtros visuais nas tabelas | Utilizar apenas `req.params` e `req.body` conforme a lista permitida |
| 12 tabelas no banco (incluindo `fornecedores`, `clientes` e `parametros`) | 9 tabelas em [schema.sql](file:///c:/TDESI/food_control/database/schema.sql): corte de `fornecedores` e `parametros`, e campo `cliente` em texto direto na tabela `pedidos` | Alinhar ao Dossiê Real (que não possui tela de fornecedores nem de clientes, e usa limites fixos no servidor) |
| Fórmula complexa com pesos decimais para Índice de Risco | Pontuação inteira de 0 a 100 por 4 critérios simples (validade, excesso, perdas e falta) com `if / else` | Facilitar leitura, manutenção e explicação linha por linha na apresentação |
| Recomendação de produção limitada por `estoque_maximo` | Fórmula do Dossiê Real: `MAX(0, pedidos_pendentes + estoque_minimo - estoque_disponivel)` | Seguir diretamente a fórmula simples da Seção 20 do Dossiê Real |
| Exportação de relatórios em CSV | Exibição completa em tabela na tela `relatorios.html` | Exportação CSV fora do escopo do MVP |
| Painel de Telemetria IoT (Câmaras Frias) no Dashboard | Removido na simplificação do Dashboard e substituído pelo painel real de **Alertas Abertos** | Sensores físicos e IoT estão fora do escopo do projeto |

---

## 2. Divergências resolvidas entre Dossiê e Front-end

* **E-mails dos usuários:** o front-end usava `@saborsul.com.br` e o outro dossiê usava `@saborsul.test`; o `seed.sql` seguiu o front (`@saborsul.com.br`).
* **Preço do Strogonoff de Frango:** o front (`produtos.html` e `perdas.html`) usava `R$ 15,00` (enquanto o dossiê antigo usava `R$ 16,00`); o `seed.sql` adotou `R$ 15,00` e recalculou os totais dos pedidos correspondentes.
* **Campo `quantidade_planejada` na produção:** caso não seja enviado na requisição, o back-end assume o mesmo valor de `quantidade_produzida`.

---

## 3. Limitações conhecidas (importantes para citar ao professor)

1. **Senha armazenada em texto puro:** em ambiente real de produção seria obrigatório usar hash (ex.: `bcrypt`) e token JWT no back-end.
2. **Operações multi-tabela sem transação:** se ocorrer falha de conexão no meio de uma gravação sequencial (produção, envio de pedido ou perda com lote), pode ser necessário ajustar manualmente o registro parcial.
3. **Controle de perfil apenas no front-end:** as rotas da API não validam token nem perfil no cabeçalho HTTP; um acesso direto via ferramenta externa não passa pela trava visual das telas.
4. **Alerta de pedido sem reserva acumulada:** o alerta de pedido compara cada item individualmente com o estoque disponível do produto, enquanto a demanda acumulada é tratada na **Recomendação de Produção** e no **Índice de Risco**.
