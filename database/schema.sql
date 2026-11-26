-- BANCO DE DADOS DO SISTEMA FOODCONTROL 4.0 (SABORSUL ALIMENTOS)
-- REQUER MYSQL 8.0.16 OU SUPERIOR (PARA AS REGRAS CHECK)

DROP DATABASE IF EXISTS foodcontrol;
CREATE DATABASE foodcontrol CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE foodcontrol;

-- 1. TABELA DE USUARIOS
CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL,
    perfil ENUM('administrador', 'producao', 'estoque', 'qualidade') NOT NULL,
    cargo VARCHAR(60),
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE PRODUTOS
CREATE TABLE produtos (
    id_produto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    categoria VARCHAR(50) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL DEFAULT 'Unidade',
    preco DECIMAL(10,2) NOT NULL,
    estoque_minimo INT NOT NULL DEFAULT 0,
    estoque_maximo INT NOT NULL DEFAULT 0,
    validade_padrao_dias INT NOT NULL DEFAULT 90,
    status ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    CONSTRAINT ck_produtos_preco CHECK (preco >= 0),
    CONSTRAINT ck_produtos_estoque CHECK (estoque_minimo >= 0 AND estoque_maximo >= estoque_minimo),
    CONSTRAINT ck_produtos_validade CHECK (validade_padrao_dias > 0)
);

-- 3. TABELA DE LOTES
CREATE TABLE lotes (
    id_lote INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_produto INT UNSIGNED NOT NULL,
    numero_lote VARCHAR(20) NOT NULL UNIQUE,
    data_producao DATE NOT NULL,
    data_validade DATE NOT NULL,
    quantidade_produzida INT NOT NULL,
    quantidade_atual INT NOT NULL,
    status ENUM('Disponivel', 'Esgotado', 'Vencido') NOT NULL DEFAULT 'Disponivel',
    CONSTRAINT fk_lotes_produto FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    CONSTRAINT ck_lotes_datas CHECK (data_validade >= data_producao),
    CONSTRAINT ck_lotes_qtd CHECK (
        quantidade_produzida >= 0
        AND quantidade_atual >= 0
        AND quantidade_atual <= quantidade_produzida
    )
);

-- 4. TABELA DE PRODUCAO (CADA PRODUCAO GERA 1 LOTE)
CREATE TABLE producao (
    id_producao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lote INT UNSIGNED NOT NULL UNIQUE,
    quantidade_planejada INT NOT NULL,
    quantidade_produzida INT NOT NULL,
    data_producao DATE NOT NULL,
    turno ENUM('Manha', 'Tarde', 'Noite') NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    observacao VARCHAR(255),
    CONSTRAINT fk_producao_lote FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    CONSTRAINT fk_producao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
    CONSTRAINT ck_producao_qtd CHECK (quantidade_planejada > 0 AND quantidade_produzida >= 0)
);

-- 5. TABELA DE PEDIDOS (CLIENTE COMO TEXTO SIMPLES)
CREATE TABLE pedidos (
    id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente VARCHAR(100) NOT NULL,
    data_pedido DATE NOT NULL,
    data_entrega DATE NOT NULL,
    status ENUM('Pendente', 'Em preparacao', 'Pronto', 'Enviado', 'Entregue', 'Cancelado') NOT NULL DEFAULT 'Pendente',
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    id_usuario INT UNSIGNED NOT NULL,
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
    CONSTRAINT ck_pedidos_datas CHECK (data_entrega >= data_pedido)
) AUTO_INCREMENT = 1000;

-- 6. TABELA DE ITENS DO PEDIDO
CREATE TABLE itens_pedido (
    id_item INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT UNSIGNED NOT NULL,
    id_produto INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itens_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_itens_produto FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    CONSTRAINT uq_itens UNIQUE (id_pedido, id_produto),
    CONSTRAINT ck_itens CHECK (quantidade > 0 AND valor_unitario >= 0)
);

-- 7. TABELA DE PERDAS
CREATE TABLE perdas (
    id_perda INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_produto INT UNSIGNED NOT NULL,
    id_lote INT UNSIGNED NULL,
    quantidade INT NOT NULL,
    motivo ENUM(
        'Validade',
        'Embalagem danificada',
        'Erro de producao',
        'Armazenamento inadequado',
        'Produto fora do padrao',
        'Outros'
    ) NOT NULL,
    data_perda DATE NOT NULL,
    valor_estimado DECIMAL(10,2) NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    observacao VARCHAR(255),
    CONSTRAINT fk_perdas_produto FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    CONSTRAINT fk_perdas_lote FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    CONSTRAINT fk_perdas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
    CONSTRAINT ck_perdas CHECK (quantidade > 0 AND valor_estimado >= 0)
);

-- 8. TABELA DE MOVIMENTACOES DE ESTOQUE
CREATE TABLE movimentacoes_estoque (
    id_movimentacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_lote INT UNSIGNED NOT NULL,
    tipo ENUM('Entrada', 'Saida', 'Perda', 'Ajuste') NOT NULL,
    quantidade INT NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),
    CONSTRAINT fk_mov_lote FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    CONSTRAINT fk_mov_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
    CONSTRAINT ck_mov_sinal CHECK (
        (tipo = 'Entrada' AND quantidade > 0)
        OR (tipo IN ('Saida', 'Perda') AND quantidade < 0)
        OR (tipo = 'Ajuste' AND quantidade <> 0)
    )
);

-- 9. TABELA DE ALERTAS
CREATE TABLE alertas (
    id_alerta INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('Validade', 'Estoque', 'Desperdicio', 'Pedido') NOT NULL,
    nivel ENUM('Atencao', 'Critico') NOT NULL,
    id_produto INT UNSIGNED NULL,
    id_lote INT UNSIGNED NULL,
    id_pedido INT UNSIGNED NULL,
    mensagem VARCHAR(255) NOT NULL,
    data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('Aberto', 'Resolvido') NOT NULL DEFAULT 'Aberto',
    data_resolucao DATETIME NULL,
    CONSTRAINT fk_alertas_produto FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    CONSTRAINT fk_alertas_lote FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    CONSTRAINT fk_alertas_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido)
);
