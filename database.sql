CREATE DATABASE IF NOT EXISTS foodcontrol;
USE foodcontrol;

CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL,
    cargo VARCHAR(60),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE produtos (
    id_produto INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL DEFAULT 'Unidade',
    preco DECIMAL(10,2) NOT NULL,
    estoque_minimo INT NOT NULL DEFAULT 0,
    estoque_maximo INT NOT NULL DEFAULT 0,
    validade_padrao_dias INT NOT NULL DEFAULT 90,
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE fornecedores (
    id_fornecedor INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    telefone VARCHAR(20),
    email VARCHAR(120),
    cidade VARCHAR(60),
    uf CHAR(2),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cnpj VARCHAR(18),
    telefone VARCHAR(20),
    email VARCHAR(120),
    cidade VARCHAR(60),
    uf CHAR(2),
    status VARCHAR(20) NOT NULL DEFAULT 'Ativo'
);

CREATE TABLE lotes (
    id_lote INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    numero_lote VARCHAR(20) NOT NULL,
    data_producao DATE NOT NULL,
    data_validade DATE NOT NULL,
    quantidade_produzida INT NOT NULL,
    quantidade_atual INT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Disponivel',
    FOREIGN KEY (id_produto) REFERENCES produtos (id_produto)
);

CREATE TABLE producao (
    id_producao INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    quantidade_planejada INT NOT NULL,
    quantidade_produzida INT NOT NULL,
    data_producao DATE NOT NULL,
    turno VARCHAR(20) NOT NULL,
    id_usuario INT NOT NULL,
    observacao VARCHAR(255),
    FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
);

CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    data_pedido DATE NOT NULL,
    data_entrega DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pendente',
    valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    id_usuario INT NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes (id_cliente),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
);

CREATE TABLE itens_pedido (
    id_item INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido),
    FOREIGN KEY (id_produto) REFERENCES produtos (id_produto)
);

CREATE TABLE perdas (
    id_perda INT AUTO_INCREMENT PRIMARY KEY,
    id_produto INT NOT NULL,
    id_lote INT,
    quantidade INT NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    data_perda DATE NOT NULL,
    valor_estimado DECIMAL(10,2) NOT NULL,
    id_usuario INT NOT NULL,
    observacao VARCHAR(255),
    FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
);

CREATE TABLE movimentacoes_estoque (
    id_movimentacao INT AUTO_INCREMENT PRIMARY KEY,
    id_lote INT NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    quantidade INT NOT NULL,
    id_pedido INT,
    id_perda INT,
    id_usuario INT NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    observacao VARCHAR(255),
    FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido),
    FOREIGN KEY (id_perda) REFERENCES perdas (id_perda),
    FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
);

CREATE TABLE alertas (
    id_alerta INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(30) NOT NULL,
    nivel VARCHAR(20) NOT NULL,
    id_produto INT,
    id_lote INT,
    id_pedido INT,
    mensagem VARCHAR(255) NOT NULL,
    data_geracao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'Aberto',
    data_resolucao DATETIME,
    FOREIGN KEY (id_produto) REFERENCES produtos (id_produto),
    FOREIGN KEY (id_lote) REFERENCES lotes (id_lote),
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido)
);

CREATE TABLE parametros (
    chave VARCHAR(50) PRIMARY KEY,
    valor DECIMAL(10,2) NOT NULL,
    descricao VARCHAR(150)
);