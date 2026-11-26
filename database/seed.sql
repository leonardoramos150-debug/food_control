-- MASSA DE DADOS DE TESTE DO FOODCONTROL 4.0 (DATAS RELATIVAS A CURDATE())
USE foodcontrol;

-- 1. USUARIOS (SENHA DE TESTE: 123456)
INSERT INTO usuarios (id_usuario, nome, email, senha, perfil, cargo, status) VALUES
(1, 'Marina Duarte', 'marina@saborsul.com.br', '123456', 'administrador', 'Gerente Industrial', 'Ativo'),
(2, 'Rafael Becker', 'rafael@saborsul.com.br', '123456', 'producao', 'Supervisor de Producao', 'Ativo'),
(3, 'Carlos Silva', 'carlos@saborsul.com.br', '123456', 'estoque', 'Estoquista', 'Ativo'),
(4, 'Ana Paula Souza', 'anapaula@saborsul.com.br', '123456', 'qualidade', 'Analista de Qualidade', 'Ativo');

-- 2. PRODUTOS (PRECOS ALINHADOS COM O FRONT-END)
INSERT INTO produtos (id_produto, nome, categoria, unidade_medida, preco, estoque_minimo, estoque_maximo, validade_padrao_dias, status) VALUES
(1, 'Lasanha Bolonhesa', 'Congelado', 'Unidade', 12.50, 100, 1000, 90, 'Ativo'),
(2, 'Pizza Calabresa', 'Congelado', 'Unidade', 18.00, 100, 800, 120, 'Ativo'),
(3, 'Coxinha de Frango', 'Salgado', 'Unidade', 9.00, 300, 1500, 60, 'Ativo'),
(4, 'Massa Tagliatelle', 'Massa', 'Unidade', 7.50, 80, 600, 60, 'Ativo'),
(5, 'Strogonoff de Frango', 'Refeicao pronta', 'Unidade', 15.00, 60, 500, 90, 'Ativo'),
(6, 'Pastel de Carne', 'Salgado', 'Unidade', 6.50, 200, 1200, 60, 'Ativo');

-- 3. LOTES (DATAS RELATIVAS PARA SEMPRE GERAR CRITICO, ATENCAO, VENCIDO, NORMAIS E ESGOTADOS)
INSERT INTO lotes (id_lote, id_produto, numero_lote, data_producao, data_validade, quantidade_produzida, quantidade_atual, status) VALUES
-- Lote 1: Lasanha esgotado (mes anterior)
(1, 1, 'LOT-2026-018',
 DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH),
 DATE_ADD(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), INTERVAL 90 DAY),
 400, 0, 'Esgotado'),

-- Lote 2: Lasanha CRITICO (vence em 5 dias)
(2, 1, 'LOT-2026-021',
 DATE_SUB(CURDATE(), INTERVAL 85 DAY),
 DATE_ADD(CURDATE(), INTERVAL 5 DAY),
 500, 320, 'Disponivel'),

-- Lote 3: Lasanha ATENCAO (vence em 12 dias)
(3, 1, 'LOT-2026-024',
 DATE_SUB(CURDATE(), INTERVAL 78 DAY),
 DATE_ADD(CURDATE(), INTERVAL 12 DAY),
 400, 100, 'Disponivel'),

-- Lote 4: Pastel VENCIDO com saldo (venceu ontem)
(4, 6, 'LOT-2026-030',
 DATE_SUB(CURDATE(), INTERVAL 61 DAY),
 DATE_SUB(CURDATE(), INTERVAL 1 DAY),
 400, 60, 'Vencido'),

-- Lote 5: Pizza esgotado (mes anterior)
(5, 2, 'LOT-2026-031',
 DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH),
 DATE_ADD(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), INTERVAL 120 DAY),
 450, 0, 'Esgotado'),

-- Lote 6: Pizza esgotado (produzido no 1o dia do mes atual)
(6, 2, 'LOT-2026-034',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 120 DAY),
 480, 0, 'Esgotado'),

-- Lote 7: Massa normal (produzido no 1o dia do mes atual, vence em 38 dias)
(7, 4, 'LOT-2026-036',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(CURDATE(), INTERVAL 38 DAY),
 300, 150, 'Disponivel'),

-- Lote 8: Strogonoff normal (produzido no 1o dia do mes atual, saldo 40 < minimo 60)
(8, 5, 'LOT-2026-038',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(CURDATE(), INTERVAL 72 DAY),
 250, 40, 'Disponivel'),

-- Lote 9: Pizza normal (produzido no 1o dia do mes atual, vence em 105 dias)
(9, 2, 'LOT-2026-039',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(CURDATE(), INTERVAL 105 DAY),
 500, 100, 'Disponivel'),

-- Lote 10: Pastel normal (produzido no 1o dia do mes atual, vence em 50 dias)
(10, 6, 'LOT-2026-041',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(CURDATE(), INTERVAL 50 DAY),
 700, 500, 'Disponivel'),

-- Lote 11: Coxinha normal (produzido no 1o dia do mes atual, vence em 52 dias)
(11, 3, 'LOT-2026-042',
 DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY),
 DATE_ADD(CURDATE(), INTERVAL 52 DAY),
 1200, 900, 'Disponivel'),

-- Lote 12: Lasanha normal (produzido hoje, vence em 85 dias)
(12, 1, 'LOT-2026-043',
 CURDATE(),
 DATE_ADD(CURDATE(), INTERVAL 85 DAY),
 600, 580, 'Disponivel');

-- 4. PRODUCAO (1 REGISTRO PARA CADA LOTE; LOTES 6 A 12 SAO DO MES ATUAL = 4030 / 4050)
INSERT INTO producao (id_lote, quantidade_planejada, quantidade_produzida, data_producao, turno, id_usuario, observacao) VALUES
(1, 400, 400, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), 'Manha', 2, 'Producao normal'),
(2, 500, 500, DATE_SUB(CURDATE(), INTERVAL 85 DAY), 'Manha', 2, 'Producao normal'),
(3, 450, 400, DATE_SUB(CURDATE(), INTERVAL 78 DAY), 'Tarde', 2, 'Reducao por manutencao de linha'),
(4, 400, 400, DATE_SUB(CURDATE(), INTERVAL 61 DAY), 'Manha', 2, 'Producao normal'),
(5, 450, 450, DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), 'Tarde', 2, 'Producao normal'),
(6, 500, 480, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Manha', 2, 'Pequena quebra na embalagem'),
(7, 300, 300, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Manha', 2, 'Producao normal'),
(8, 250, 250, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Tarde', 2, 'Producao normal'),
(9, 500, 500, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Manha', 2, 'Producao normal'),
(10, 700, 700, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Tarde', 2, 'Producao normal'),
(11, 1200, 1200, DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 'Manha', 2, 'Producao normal'),
(12, 600, 600, CURDATE(), 'Manha', 2, 'Selagem e congelamento conforme');

-- 5. PEDIDOS (1000 A 1005)
INSERT INTO pedidos (id_pedido, cliente, data_pedido, data_entrega, status, valor_total, id_usuario) VALUES
(1000, 'Mercado Central', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Em preparacao', 3400.00, 1),
(1001, 'Supermercado Bom Preco', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'Pendente', 5825.00, 1),
(1002, 'Atacado Meio-Oeste', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'Pendente', 7275.00, 1),
(1003, 'Padaria e Lanchonete Estrela', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'Pronto', 2000.00, 1),
(1004, 'Rede Vale Mais', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 7 DAY), 'Pendente', 1530.00, 1),
(1005, 'Mercado Central', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Pendente', 1125.00, 1);

-- 6. ITENS DOS PEDIDOS
INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES
-- Pedido 1000 (3.400,00)
(1000, 1, 200, 12.50),
(1000, 3, 100, 9.00),
-- Pedido 1001 (5.825,00) - Pizza 150 > disponivel 100
(1001, 1, 250, 12.50),
(1001, 2, 150, 18.00),
-- Pedido 1002 (7.275,00) - Pizza 150 > disponivel 100
(1002, 1, 150, 12.50),
(1002, 2, 150, 18.00),
(1002, 3, 200, 9.00),
(1002, 4, 60, 7.50),
(1002, 5, 30, 15.00),
-- Pedido 1003 (2.000,00)
(1003, 3, 150, 9.00),
(1003, 6, 100, 6.50),
-- Pedido 1004 (1.530,00)
(1004, 5, 30, 15.00),
(1004, 4, 40, 7.50),
(1004, 6, 120, 6.50),
-- Pedido 1005 (1.125,00) - Strogonoff 60 > disponivel 40
(1005, 5, 60, 15.00),
(1005, 4, 30, 7.50);

-- 7. PERDAS (2 NO MES ANTERIOR = 116 UN DE LASANHA; 9 NO MES ATUAL = 265 UN / R$ 3.415,00)
INSERT INTO perdas (id_perda, id_produto, id_lote, quantidade, motivo, data_perda, valor_estimado, id_usuario, observacao) VALUES
-- Mes anterior (para testar alerta de aumento de perdas da Lasanha: 145 vs 116 = +25%)
(1, 1, NULL, 70, 'Validade', DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), 875.00, 4, 'Perda historica mes anterior'),
(2, 1, NULL, 46, 'Embalagem danificada', DATE_ADD(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH), INTERVAL 1 DAY), 575.00, 3, 'Perda historica mes anterior'),
-- Mes atual (sempre no mes corrente usando o 1o dia do mes e CURDATE())
(3, 1, 2, 25, 'Embalagem danificada', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 312.50, 3, 'Caixa avariada no palete'),
(4, 2, 5, 10, 'Armazenamento inadequado', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 180.00, 4, 'Oscilacao na camara fria'),
(5, 2, 6, 20, 'Embalagem danificada', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 360.00, 3, 'Filme plastico rasgado'),
(6, 1, 1, 80, 'Validade', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 1000.00, 4, 'Lote antigo vencido'),
(7, 1, 3, 20, 'Embalagem danificada', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 250.00, 3, 'Dano na movimentacao'),
(8, 6, 10, 25, 'Embalagem danificada', DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), 162.50, 3, 'Avaria na separacao'),
(9, 2, 9, 35, 'Armazenamento inadequado', CURDATE(), 630.00, 4, 'Descongelamento parcial'),
(10, 3, 11, 30, 'Produto fora do padrao', CURDATE(), 270.00, 4, 'Empanamento irregular'),
(11, 1, 12, 20, 'Armazenamento inadequado', CURDATE(), 250.00, 3, 'Porta da camara aberta');

-- 8. MOVIMENTACOES DE ESTOQUE (ENTRADA + SAIDAS/PERDAS QUE BATEM COM O SALDO ATUAL DE CADA LOTE)
INSERT INTO movimentacoes_estoque (id_lote, tipo, quantidade, id_usuario, observacao) VALUES
-- Lote 1 (400 - 320 - 80 = 0)
(1, 'Entrada', 400, 2, 'Entrada por producao LOT-2026-018'),
(1, 'Saida', -320, 3, 'Saidas historicas de pedidos entregues'),
(1, 'Perda', -80, 4, 'Perda por validade'),
-- Lote 2 (500 - 155 - 25 = 320)
(2, 'Entrada', 500, 2, 'Entrada por producao LOT-2026-021'),
(2, 'Saida', -155, 3, 'Saidas historicas de pedidos entregues'),
(2, 'Perda', -25, 3, 'Perda por embalagem danificada'),
-- Lote 3 (400 - 280 - 20 = 100)
(3, 'Entrada', 400, 2, 'Entrada por producao LOT-2026-024'),
(3, 'Saida', -280, 3, 'Saidas historicas de pedidos entregues'),
(3, 'Perda', -20, 3, 'Perda por embalagem danificada'),
-- Lote 4 (400 - 340 = 60)
(4, 'Entrada', 400, 2, 'Entrada por producao LOT-2026-030'),
(4, 'Saida', -340, 3, 'Saidas historicas de pedidos entregues'),
-- Lote 5 (450 - 440 - 10 = 0)
(5, 'Entrada', 450, 2, 'Entrada por producao LOT-2026-031'),
(5, 'Saida', -440, 3, 'Saidas historicas de pedidos entregues'),
(5, 'Perda', -10, 4, 'Perda por armazenamento inadequado'),
-- Lote 6 (480 - 460 - 20 = 0)
(6, 'Entrada', 480, 2, 'Entrada por producao LOT-2026-034'),
(6, 'Saida', -460, 3, 'Saidas historicas de pedidos entregues'),
(6, 'Perda', -20, 3, 'Perda por embalagem danificada'),
-- Lote 7 (300 - 150 = 150)
(7, 'Entrada', 300, 2, 'Entrada por producao LOT-2026-036'),
(7, 'Saida', -150, 3, 'Saidas historicas de pedidos entregues'),
-- Lote 8 (250 - 210 = 40)
(8, 'Entrada', 250, 2, 'Entrada por producao LOT-2026-038'),
(8, 'Saida', -210, 3, 'Saidas historicas de pedidos entregues'),
-- Lote 9 (500 - 365 - 35 = 100)
(9, 'Entrada', 500, 2, 'Entrada por producao LOT-2026-039'),
(9, 'Saida', -365, 3, 'Saidas historicas de pedidos entregues'),
(9, 'Perda', -35, 4, 'Perda por armazenamento inadequado'),
-- Lote 10 (700 - 175 - 25 = 500)
(10, 'Entrada', 700, 2, 'Entrada por producao LOT-2026-041'),
(10, 'Saida', -175, 3, 'Saidas historicas de pedidos entregues'),
(10, 'Perda', -25, 3, 'Perda por embalagem danificada'),
-- Lote 11 (1200 - 270 - 30 = 900)
(11, 'Entrada', 1200, 2, 'Entrada por producao LOT-2026-042'),
(11, 'Saida', -270, 3, 'Saidas historicas de pedidos entregues'),
(11, 'Perda', -30, 4, 'Perda por produto fora do padrao'),
-- Lote 12 (600 - 20 = 580)
(12, 'Entrada', 600, 2, 'Entrada por producao LOT-2026-043'),
(12, 'Perda', -20, 3, 'Perda por armazenamento inadequado');

-- 9. ALERTAS INICIAIS (8 ALERTAS CORRESPONDENTES AS REGRAS DO SEED)
INSERT INTO alertas (tipo, nivel, id_produto, id_lote, id_pedido, mensagem, status) VALUES
('Validade', 'Critico', 1, 2, NULL, '320 un de Lasanha Bolonhesa (LOT-2026-021) vencem em 5 dias.', 'Aberto'),
('Validade', 'Atencao', 1, 3, NULL, '100 un de Lasanha Bolonhesa (LOT-2026-024) vencem em 12 dias.', 'Aberto'),
('Validade', 'Critico', 6, 4, NULL, 'Lote LOT-2026-030 (Pastel de Carne) vencido com 60 un em estoque.', 'Aberto'),
('Estoque', 'Atencao', 5, NULL, NULL, 'Strogonoff de Frango esta abaixo do estoque minimo (40 de 60).', 'Aberto'),
('Desperdicio', 'Atencao', 1, NULL, NULL, 'Lasanha Bolonhesa: perdas 25% maiores que no mes anterior (145 un contra 116 un).', 'Aberto'),
('Pedido', 'Critico', 2, NULL, 1001, 'Pedido 1001: Pizza Calabresa pede 150 un, estoque disponivel 100 un.', 'Aberto'),
('Pedido', 'Critico', 2, NULL, 1002, 'Pedido 1002: Pizza Calabresa pede 150 un, estoque disponivel 100 un.', 'Aberto'),
('Pedido', 'Critico', 5, NULL, 1005, 'Pedido 1005: Strogonoff de Frango pede 60 un, estoque disponivel 40 un.', 'Aberto');
