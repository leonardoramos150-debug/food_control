// IMPORTAR OS MODULOS NECESSARIOS
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// CONFIGURACAO DA APLICACAO EXPRESS
const app = express();
app.use(express.json());
app.use(cors());

// CONFIGURACAO DO BANCO DE DADOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senai',
    database: 'foodcontrol'
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco:', err);
        return;
    }
    console.log('Conectado ao banco de dados');
});

const DIAS_CRITICO = 7;
const DIAS_ATENCAO = 15;
const AUMENTO_PERDA_ATENCAO = 20;
const AUMENTO_PERDA_CRITICO = 50;
const RISCO_MEDIO = 20;
const RISCO_ALTO = 45;

function hojeIso() {
    return new Date().toLocaleDateString('en-CA');
}

function validarProduto(body) {
    if (!body.nome || !body.categoria) return 'Nome e categoria são obrigatórios';
    const preco = Number(body.preco);
    const min = body.estoque_minimo !== undefined ? parseInt(body.estoque_minimo, 10) : 0;
    const max = body.estoque_maximo !== undefined ? parseInt(body.estoque_maximo, 10) : Math.max(min * 5, min);
    const val = body.validade_padrao_dias !== undefined ? parseInt(body.validade_padrao_dias, 10) : 90;

    if (isNaN(preco) || preco < 0) return 'Preço inválido';
    if (isNaN(min) || min < 0 || isNaN(max) || max < min) return 'Estoque mínimo e máximo inválidos';
    if (isNaN(val) || val <= 0) return 'Validade padrão deve ser maior que zero';
    return null;
}

function alterarStatusAtivo(tabela, campoId, id, status, nomeEntidade, res) {
    if (status !== 'Ativo' && status !== 'Inativo') {
        return res.status(400).json({ mensagem: "Status deve ser 'Ativo' ou 'Inativo'" });
    }
    db.query(`UPDATE ${tabela} SET status = ? WHERE ${campoId} = ?`, [status, id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows === 0) return res.status(404).json({ mensagem: `${nomeEntidade} não encontrado` });
        return res.status(200).json({ mensagem: `${nomeEntidade} alterado para ${status}` });
    });
}

function formatarProdutos(lista) {
    for (let i = 0; i < lista.length; i++) {
        lista[i].estoque_disponivel = Number(lista[i].estoque_disponivel);
        lista[i].situacao_estoque = lista[i].estoque_disponivel < lista[i].estoque_minimo ? 'Baixo' : 'Normal';
    }
    return lista;
}

function formatarLotes(lista) {
    for (let i = 0; i < lista.length; i++) {
        const lt = lista[i];
        lt.dias_para_vencer = Number(lt.dias_para_vencer);
        if (lt.status === 'Esgotado' || lt.quantidade_atual === 0) lt.situacao_validade = 'Esgotado';
        else if (lt.status === 'Vencido' || lt.dias_para_vencer < 0) lt.situacao_validade = 'Vencido';
        else if (lt.dias_para_vencer <= DIAS_CRITICO) lt.situacao_validade = 'Critico';
        else if (lt.dias_para_vencer <= DIAS_ATENCAO) lt.situacao_validade = 'Atencao';
        else lt.situacao_validade = 'Normal';
    }
    return lista;
}

function agruparPerdas(itens) {
    const mapaProd = {};
    const mapaMot = {};
    const porProduto = [];
    const porMotivo = [];
    let totalUn = 0;
    let totalValor = 0;

    for (let i = 0; i < itens.length; i++) {
        const it = itens[i];
        const qtd = Number(it.quantidade);
        const val = Number(it.valor_estimado);
        totalUn = totalUn + qtd;
        totalValor = totalValor + val;

        if (!mapaProd[it.produto_nome]) {
            mapaProd[it.produto_nome] = { id_produto: it.id_produto, nome: it.produto_nome, unidades: 0, valor_perdido: 0, percentual: 0 };
            porProduto.push(mapaProd[it.produto_nome]);
        }
        mapaProd[it.produto_nome].unidades = mapaProd[it.produto_nome].unidades + qtd;
        mapaProd[it.produto_nome].valor_perdido = mapaProd[it.produto_nome].valor_perdido + val;

        if (!mapaMot[it.motivo]) {
            mapaMot[it.motivo] = { motivo: it.motivo, unidades: 0, valor_perdido: 0, percentual: 0 };
            porMotivo.push(mapaMot[it.motivo]);
        }
        mapaMot[it.motivo].unidades = mapaMot[it.motivo].unidades + qtd;
        mapaMot[it.motivo].valor_perdido = mapaMot[it.motivo].valor_perdido + val;
    }

    for (let i = 0; i < porProduto.length; i++) {
        porProduto[i].percentual = totalValor > 0 ? Number(((porProduto[i].valor_perdido / totalValor) * 100).toFixed(1)) : 0;
    }
    for (let i = 0; i < porMotivo.length; i++) {
        porMotivo[i].percentual = totalValor > 0 ? Number(((porMotivo[i].valor_perdido / totalValor) * 100).toFixed(1)) : 0;
    }

    porProduto.sort((a, b) => b.valor_perdido - a.valor_perdido);
    porMotivo.sort((a, b) => b.valor_perdido - a.valor_perdido);
    return { total_unidades: totalUn, valor_total: Number(totalValor.toFixed(2)), por_produto: porProduto, por_motivo: porMotivo };
}

// CRIACAO DAS ROTAS DO SERVIDOR

// 1 - ROTA LOGIN
app.post('/api/auth/login', (req, res) => {
    if (!req.body.email || !req.body.senha) {
        return res.status(400).json({ mensagem: 'E-mail e senha são obrigatórios' });
    }
    const q = "SELECT id_usuario, nome, perfil FROM usuarios WHERE email = ? AND senha = ? AND status = 'Ativo'";
    db.query(q, [req.body.email, req.body.senha], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.status(400).json({ mensagem: 'E-mail ou senha inválidos' });
        return res.status(200).json(data[0]);
    });
});

// BLOCO 2 - PRODUTOS E USUARIOS

const SQL_PRODUTOS = "SELECT p.id_produto, p.nome, p.categoria, p.unidade_medida, p.preco, p.estoque_minimo, p.estoque_maximo, p.validade_padrao_dias, p.status, COALESCE(SUM(l.quantidade_atual), 0) AS estoque_disponivel FROM produtos p LEFT JOIN lotes l ON l.id_produto = p.id_produto AND l.status = 'Disponivel'";

// 2 - ROTA READ: LISTA PRODUTOS
app.get('/api/produtos', (req, res) => {
    db.query(SQL_PRODUTOS + ' GROUP BY p.id_produto ORDER BY p.id_produto ASC', [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(formatarProdutos(data));
    });
});

// 4 - ROTA CREATE: CADASTRA PRODUTO
app.post('/api/produtos', (req, res) => {
    const erro = validarProduto(req.body);
    if (erro) return res.status(400).json({ mensagem: erro });

    const min = req.body.estoque_minimo !== undefined ? parseInt(req.body.estoque_minimo, 10) : 0;
    const max = req.body.estoque_maximo !== undefined ? parseInt(req.body.estoque_maximo, 10) : Math.max(min * 5, min);
    const val = req.body.validade_padrao_dias !== undefined ? parseInt(req.body.validade_padrao_dias, 10) : 90;
    const un = req.body.unidade_medida ? req.body.unidade_medida : 'Unidade';

    db.query('INSERT INTO produtos (nome, categoria, unidade_medida, preco, estoque_minimo, estoque_maximo, validade_padrao_dias) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.body.nome, req.body.categoria, un, Number(req.body.preco), min, max, val], (err, data) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensagem: 'Já existe um produto com este nome' });
                return res.status(500).json(err);
            }
            return res.status(201).json({ mensagem: 'Produto cadastrado com sucesso', id_produto: data.insertId });
        });
});

// 5 - ROTA UPDATE: ATUALIZA PRODUTO
app.put('/api/produtos/:id', (req, res) => {
    const erro = validarProduto(req.body);
    if (erro) return res.status(400).json({ mensagem: erro });

    const un = req.body.unidade_medida ? req.body.unidade_medida : 'Unidade';
    const vals = [req.body.nome, req.body.categoria, un, Number(req.body.preco), parseInt(req.body.estoque_minimo, 10), parseInt(req.body.estoque_maximo, 10), parseInt(req.body.validade_padrao_dias, 10), req.params.id];
    db.query('UPDATE produtos SET nome = ?, categoria = ?, unidade_medida = ?, preco = ?, estoque_minimo = ?, estoque_maximo = ?, validade_padrao_dias = ? WHERE id_produto = ?', vals, (err, data) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensagem: 'Já existe um produto com este nome' });
            return res.status(500).json(err);
        }
        if (data.affectedRows === 0) return res.status(404).json({ mensagem: 'Produto não encontrado' });
        return res.status(200).json({ mensagem: 'Produto atualizado com sucesso' });
    });
});

// 6 - ROTA STATUS: ATIVA OU INATIVA PRODUTO
app.put('/api/produtos/:id/status', (req, res) => {
    alterarStatusAtivo('produtos', 'id_produto', req.params.id, req.body.status, 'Produto', res);
});

// 7 - ROTA READ: LISTA USUARIOS
app.get('/api/usuarios', (req, res) => {
    db.query('SELECT id_usuario, nome, email, perfil, cargo, status, criado_em FROM usuarios ORDER BY id_usuario ASC', [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

// 8 - ROTA CREATE: CADASTRA USUARIO
app.post('/api/usuarios', (req, res) => {
    const perfis = ['administrador', 'producao', 'estoque', 'qualidade'];
    if (!req.body.nome || !req.body.email || !req.body.senha || perfis.indexOf(req.body.perfil) === -1) {
        return res.status(400).json({ mensagem: 'Dados do usuário inválidos' });
    }
    db.query('INSERT INTO usuarios (nome, email, senha, perfil, cargo) VALUES (?, ?, ?, ?, ?)',
        [req.body.nome, req.body.email, req.body.senha, req.body.perfil, req.body.cargo ? req.body.cargo : null], (err, data) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensagem: 'E-mail já cadastrado' });
                return res.status(500).json(err);
            }
            return res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso', id_usuario: data.insertId });
        });
});

// 9 - ROTA UPDATE: ATUALIZA USUARIO
app.put('/api/usuarios/:id', (req, res) => {
    const perfis = ['administrador', 'producao', 'estoque', 'qualidade'];
    if (!req.body.nome || !req.body.email || perfis.indexOf(req.body.perfil) === -1) {
        return res.status(400).json({ mensagem: 'Dados do usuário inválidos' });
    }
    const cargo = req.body.cargo ? req.body.cargo : null;
    const q = req.body.senha
        ? 'UPDATE usuarios SET nome = ?, email = ?, perfil = ?, cargo = ?, senha = ? WHERE id_usuario = ?'
        : 'UPDATE usuarios SET nome = ?, email = ?, perfil = ?, cargo = ? WHERE id_usuario = ?';
    const vals = req.body.senha
        ? [req.body.nome, req.body.email, req.body.perfil, cargo, req.body.senha, req.params.id]
        : [req.body.nome, req.body.email, req.body.perfil, cargo, req.params.id];

    db.query(q, vals, (err, data) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ mensagem: 'E-mail já cadastrado' });
            return res.status(500).json(err);
        }
        if (data.affectedRows === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        return res.status(200).json({ mensagem: 'Usuário atualizado com sucesso' });
    });
});

// 10 - ROTA STATUS: ATIVA OU INATIVA USUARIO
app.put('/api/usuarios/:id/status', (req, res) => {
    alterarStatusAtivo('usuarios', 'id_usuario', req.params.id, req.body.status, 'Usuário', res);
});

// BLOCO 3 - LOTES, PRODUCAO E ESTOQUE

const SQL_LOTES = "SELECT l.id_lote, l.id_produto, p.nome AS produto_nome, p.preco AS produto_preco, l.numero_lote, DATE_FORMAT(l.data_producao, '%Y-%m-%d') AS data_producao, DATE_FORMAT(l.data_validade, '%Y-%m-%d') AS data_validade, l.quantidade_produzida, l.quantidade_atual, l.status, DATEDIFF(l.data_validade, CURDATE()) AS dias_para_vencer FROM lotes l JOIN produtos p ON p.id_produto = l.id_produto";

// 11 - ROTA READ: LISTA LOTES
app.get('/api/lotes', (req, res) => {
    db.query(SQL_LOTES + ' ORDER BY l.data_validade ASC, l.data_producao ASC', [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(formatarLotes(data));
    });
});

function gerarProximoNumeroLote(ano, ultimoNumero) {
    let seq = 1;
    if (ultimoNumero) {
        const partes = ultimoNumero.split('-');
        if (partes.length === 3 && !isNaN(parseInt(partes[2], 10))) seq = parseInt(partes[2], 10) + 1;
    }
    let texto = '' + seq;
    while (texto.length < 3) texto = '0' + texto;
    return 'LOT-' + ano + '-' + texto;
}

// 15 - ROTA READ: LISTA PRODUCOES
app.get('/api/producao', (req, res) => {
    const q = "SELECT pr.id_producao, pr.id_lote, l.numero_lote, l.id_produto, p.nome AS produto_nome, pr.quantidade_planejada, pr.quantidade_produzida, DATE_FORMAT(pr.data_producao, '%Y-%m-%d') AS data_producao, DATE_FORMAT(l.data_validade, '%Y-%m-%d') AS data_validade, pr.turno, pr.id_usuario, u.nome AS responsavel, pr.observacao FROM producao pr JOIN lotes l ON l.id_lote = pr.id_lote JOIN produtos p ON p.id_produto = l.id_produto JOIN usuarios u ON u.id_usuario = pr.id_usuario ORDER BY pr.data_producao DESC, pr.id_producao DESC";
    db.query(q, [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

// 16 - ROTA READ: PROXIMO NUMERO DE LOTE
app.get('/api/producao/proximo-lote', (req, res) => {
    const ano = new Date().getFullYear();
    db.query('SELECT numero_lote FROM lotes WHERE numero_lote LIKE ? ORDER BY id_lote DESC LIMIT 1', ['LOT-' + ano + '-%'], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json({ proximo_lote: gerarProximoNumeroLote(ano, data.length > 0 ? data[0].numero_lote : null) });
    });
});

function gravarProducao(d, res) {
    const qLote = "INSERT INTO lotes (id_produto, numero_lote, data_producao, data_validade, quantidade_produzida, quantidade_atual, status) VALUES (?, ?, ?, ?, ?, ?, 'Disponivel')";
    db.query(qLote, [d.id_produto, d.numero_lote, d.data_producao, d.data_validade, d.qtdProd, d.qtdProd], (errLote, resLote) => {
        if (errLote) return res.status(500).json(errLote);
        const idLote = resLote.insertId;

        db.query('INSERT INTO producao (id_lote, quantidade_planejada, quantidade_produzida, data_producao, turno, id_usuario, observacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [idLote, d.qtdPlan, d.qtdProd, d.data_producao, d.turno, d.id_usuario, d.observacao], (errProd, resProd) => {
                if (errProd) return res.status(500).json(errProd);
                db.query("INSERT INTO movimentacoes_estoque (id_lote, tipo, quantidade, id_usuario, observacao) VALUES (?, 'Entrada', ?, ?, ?)",
                    [idLote, d.qtdProd, d.id_usuario, 'Entrada por producao ' + d.numero_lote], (errMov) => {
                        if (errMov) return res.status(500).json(errMov);
                        return res.status(201).json({ mensagem: 'Produção registrada com sucesso', id_producao: resProd.insertId, id_lote: idLote, numero_lote: d.numero_lote, data_validade: d.data_validade });
                    });
            });
    });
}

// 17 - ROTA CREATE: REGISTRA PRODUCAO
app.post('/api/producao', (req, res) => {
    const id_produto = req.body.id_produto;
    const qtdProd = parseInt(req.body.quantidade_produzida, 10);
    const qtdPlan = req.body.quantidade_planejada !== undefined ? parseInt(req.body.quantidade_planejada, 10) : qtdProd;
    const turno = req.body.turno === 'Manhã' ? 'Manha' : req.body.turno;

    if (!id_produto || isNaN(qtdProd) || qtdProd <= 0 || isNaN(qtdPlan) || qtdPlan <= 0) {
        return res.status(400).json({ mensagem: 'Produto e quantidades maiores que zero são obrigatórios' });
    }
    if (turno !== 'Manha' && turno !== 'Tarde' && turno !== 'Noite') {
        return res.status(400).json({ mensagem: "Turno deve ser 'Manha', 'Tarde' ou 'Noite'" });
    }

    const data_producao = req.body.data_producao ? req.body.data_producao : hojeIso();
    const qProd = "SELECT id_produto, status, DATE_FORMAT(DATE_ADD(?, INTERVAL validade_padrao_dias DAY), '%Y-%m-%d') AS validade_sugerida FROM produtos WHERE id_produto = ?";
    db.query(qProd, [data_producao, id_produto], (err, prods) => {
        if (err) return res.status(500).json(err);
        if (prods.length === 0) return res.status(404).json({ mensagem: 'Produto não encontrado' });
        if (prods[0].status !== 'Ativo') return res.status(400).json({ mensagem: 'Produto inativo não pode receber produção' });

        const data_validade = req.body.data_validade ? req.body.data_validade : prods[0].validade_sugerida;
        if (data_validade < data_producao) return res.status(400).json({ mensagem: 'A data de validade não pode ser anterior à data de produção' });

        const ano = parseInt(data_producao.split('-')[0], 10);
        db.query('SELECT numero_lote FROM lotes WHERE numero_lote LIKE ? ORDER BY id_lote DESC LIMIT 1', ['LOT-' + ano + '-%'], (err2, lotes) => {
            if (err2) return res.status(500).json(err2);
            gravarProducao({
                id_produto: id_produto,
                numero_lote: gerarProximoNumeroLote(ano, lotes.length > 0 ? lotes[0].numero_lote : null),
                data_producao: data_producao,
                data_validade: data_validade,
                qtdPlan: qtdPlan,
                qtdProd: qtdProd,
                turno: turno,
                id_usuario: req.body.id_usuario ? parseInt(req.body.id_usuario, 10) : 2,
                observacao: req.body.observacao ? req.body.observacao : null
            }, res);
        });
    });
});

// 18 - ROTA READ: SALDO POR PRODUTO
app.get('/api/estoque', (req, res) => {
    const q = "SELECT p.id_produto, p.nome, p.categoria, p.estoque_minimo, p.estoque_maximo, COALESCE(SUM(CASE WHEN l.status = 'Disponivel' THEN l.quantidade_atual ELSE 0 END), 0) AS disponivel, COALESCE(SUM(CASE WHEN l.status = 'Vencido' THEN l.quantidade_atual ELSE 0 END), 0) AS vencido_retido FROM produtos p LEFT JOIN lotes l ON l.id_produto = p.id_produto WHERE p.status = 'Ativo' GROUP BY p.id_produto ORDER BY p.id_produto ASC";
    db.query(q, [], (err, data) => {
        if (err) return res.status(500).json(err);
        for (let i = 0; i < data.length; i++) {
            data[i].disponivel = Number(data[i].disponivel);
            data[i].vencido_retido = Number(data[i].vencido_retido);
            if (data[i].disponivel < data[i].estoque_minimo) data[i].situacao = 'Abaixo do Minimo';
            else if (data[i].vencido_retido > 0) data[i].situacao = data[i].vencido_retido + ' un a descartar';
            else data[i].situacao = 'Normal';
        }
        return res.status(200).json(data);
    });
});

// 19 - ROTA READ: HISTORICO DE MOVIMENTACOES
app.get('/api/estoque/movimentacoes', (req, res) => {
    const q = 'SELECT m.id_movimentacao, m.id_lote, l.numero_lote, p.nome AS produto_nome, m.tipo, m.quantidade, u.nome AS responsavel, m.data_hora, m.observacao FROM movimentacoes_estoque m JOIN lotes l ON l.id_lote = m.id_lote JOIN produtos p ON p.id_produto = l.id_produto JOIN usuarios u ON u.id_usuario = m.id_usuario ORDER BY m.data_hora DESC, m.id_movimentacao DESC';
    db.query(q, [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

// 20 - ROTA CREATE: MOVIMENTACAO MANUAL DE ESTOQUE
app.post('/api/estoque/movimentacoes', (req, res) => {
    const id_lote = req.body.id_lote;
    const tipo = req.body.tipo;
    const qtd = parseInt(req.body.quantidade, 10);
    if (!id_lote || (tipo !== 'Entrada' && tipo !== 'Saida' && tipo !== 'Ajuste') || isNaN(qtd) || qtd === 0) {
        return res.status(400).json({ mensagem: 'Lote, tipo válido e quantidade diferente de zero são obrigatórios' });
    }
    if ((tipo === 'Entrada' || tipo === 'Saida') && qtd <= 0) {
        return res.status(400).json({ mensagem: 'Quantidade deve ser positiva para Entrada ou Saida' });
    }

    db.query('SELECT id_lote, quantidade_produzida, quantidade_atual, status, DATEDIFF(data_validade, CURDATE()) AS dias_para_vencer FROM lotes WHERE id_lote = ?', [id_lote], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ mensagem: 'Lote não encontrado' });

        const lt = rows[0];
        if (tipo === 'Saida' && (lt.status === 'Vencido' || lt.status === 'Bloqueado' || lt.status === 'Esgotado' || Number(lt.dias_para_vencer) < 0)) {
            return res.status(400).json({ mensagem: 'Não é permitido registrar saída de lote vencido, bloqueado ou esgotado' });
        }

        const delta = tipo === 'Saida' ? -qtd : qtd;
        const novoSaldo = lt.quantidade_atual + delta;
        if (novoSaldo < 0) return res.status(400).json({ mensagem: 'Quantidade solicitada é maior que o saldo do lote' });
        if (novoSaldo > lt.quantidade_produzida) return res.status(400).json({ mensagem: 'O saldo do lote não pode ultrapassar a quantidade produzida' });

        const novoStatus = novoSaldo === 0 ? 'Esgotado' : lt.status;
        const idUsuario = req.body.id_usuario ? parseInt(req.body.id_usuario, 10) : 3;
        const obs = req.body.observacao ? req.body.observacao : null;

        db.query('INSERT INTO movimentacoes_estoque (id_lote, tipo, quantidade, id_usuario, observacao) VALUES (?, ?, ?, ?, ?)', [id_lote, tipo, delta, idUsuario, obs], (err2, resMov) => {
            if (err2) return res.status(500).json(err2);
            db.query('UPDATE lotes SET quantidade_atual = ?, status = ? WHERE id_lote = ?', [novoSaldo, novoStatus, id_lote], (err3) => {
                if (err3) return res.status(500).json(err3);
                return res.status(201).json({ mensagem: 'Movimentação registrada com sucesso', id_movimentacao: resMov.insertId, novo_saldo: novoSaldo, status_lote: novoStatus });
            });
        });
    });
});

// BLOCO 4 - PEDIDOS, FEFO E PERDAS

function calcularFefoLista(lotes, qtdPedida) {
    let falta = qtdPedida;
    let atendida = 0;
    const escolhidos = [];

    for (let i = 0; i < lotes.length; i++) {
        if (falta <= 0) break;
        const lt = lotes[i];
        const saldo = Number(lt.quantidade_atual);
        if (saldo <= 0) continue;

        const retirar = Math.min(saldo, falta);
        falta = falta - retirar;
        atendida = atendida + retirar;
        escolhidos.push({
            id_lote: lt.id_lote,
            numero_lote: lt.numero_lote,
            data_validade: lt.data_validade,
            dias_para_vencer: lt.dias_para_vencer !== undefined ? Number(lt.dias_para_vencer) : null,
            saldo_lote: saldo,
            retirar: retirar,
            novo_saldo: saldo - retirar
        });
    }
    return { quantidade_solicitada: qtdPedida, quantidade_atendida: atendida, falta: falta, suficiente: falta === 0, lotes: escolhidos };
}

function aplicarSaidasPedido(idPedido, idUsuario, saidas, res) {
    const movs = [];
    for (let i = 0; i < saidas.length; i++) {
        movs.push([saidas[i].id_lote, 'Saida', -saidas[i].retirar, idUsuario, 'Saida FEFO pedido #' + idPedido]);
    }
    db.query('INSERT INTO movimentacoes_estoque (id_lote, tipo, quantidade, id_usuario, observacao) VALUES ?', [movs], (errMov) => {
        if (errMov) return res.status(500).json(errMov);

        let prontos = 0;
        let falhou = false;
        for (let j = 0; j < saidas.length; j++) {
            const s = saidas[j];
            const st = s.novo_saldo === 0 ? 'Esgotado' : 'Disponivel';
            db.query('UPDATE lotes SET quantidade_atual = ?, status = ? WHERE id_lote = ?', [s.novo_saldo, st, s.id_lote], (errUp) => {
                if (falhou) return;
                if (errUp) { falhou = true; return res.status(500).json(errUp); }
                prontos = prontos + 1;
                if (prontos === saidas.length) {
                    db.query("UPDATE pedidos SET status = 'Enviado' WHERE id_pedido = ?", [idPedido], (errPed) => {
                        if (errPed) return res.status(500).json(errPed);
                        return res.status(200).json({ mensagem: 'Pedido enviado e baixas FEFO registradas com sucesso', id_pedido: Number(idPedido), status: 'Enviado', saidas_fefo: saidas });
                    });
                }
            });
        }
    });
}

function processarEnvioPedido(idPedido, idUsuario, res) {
    db.query('SELECT i.id_produto, p.nome AS produto_nome, i.quantidade FROM itens_pedido i JOIN produtos p ON p.id_produto = i.id_produto WHERE i.id_pedido = ?', [idPedido], (err, itens) => {
        if (err) return res.status(500).json(err);
        if (itens.length === 0) return res.status(400).json({ mensagem: 'Pedido sem itens não pode ser enviado' });

        const qLotes = "SELECT id_lote, id_produto, numero_lote, DATE_FORMAT(data_validade, '%Y-%m-%d') AS data_validade, quantidade_atual FROM lotes WHERE status = 'Disponivel' AND quantidade_atual > 0 AND data_validade >= CURDATE() ORDER BY data_validade ASC, data_producao ASC";
        db.query(qLotes, [], (err2, lotes) => {
            if (err2) return res.status(500).json(err2);

            const saidas = [];
            for (let i = 0; i < itens.length; i++) {
                const lotesProd = [];
                for (let k = 0; k < lotes.length; k++) {
                    if (lotes[k].id_produto === itens[i].id_produto) lotesProd.push(lotes[k]);
                }
                const fefo = calcularFefoLista(lotesProd, itens[i].quantidade);
                if (!fefo.suficiente) {
                    return res.status(400).json({ mensagem: `Estoque disponível insuficiente para ${itens[i].produto_nome}: pedido ${itens[i].quantidade} un, disponível ${fefo.quantidade_atendida} un` });
                }
                for (let m = 0; m < fefo.lotes.length; m++) {
                    saidas.push({ id_produto: itens[i].id_produto, produto_nome: itens[i].produto_nome, id_lote: fefo.lotes[m].id_lote, numero_lote: fefo.lotes[m].numero_lote, retirar: fefo.lotes[m].retirar, novo_saldo: fefo.lotes[m].novo_saldo });
                }
            }
            aplicarSaidasPedido(idPedido, idUsuario, saidas, res);
        });
    });
}

// 22 - ROTA READ: LISTA PEDIDOS
app.get('/api/pedidos', (req, res) => {
    const qPed = "SELECT p.id_pedido, p.cliente, DATE_FORMAT(p.data_pedido, '%Y-%m-%d') AS data_pedido, DATE_FORMAT(p.data_entrega, '%Y-%m-%d') AS data_entrega, p.status, p.valor_total, p.id_usuario, u.nome AS usuario_nome FROM pedidos p JOIN usuarios u ON u.id_usuario = p.id_usuario ORDER BY p.id_pedido ASC";
    db.query(qPed, [], (err, pedidos) => {
        if (err) return res.status(500).json(err);

        db.query('SELECT i.id_item, i.id_pedido, i.id_produto, pr.nome AS produto_nome, i.quantidade, i.valor_unitario FROM itens_pedido i JOIN produtos pr ON pr.id_produto = i.id_produto ORDER BY i.id_item ASC', [], (err2, itens) => {
            if (err2) return res.status(500).json(err2);
            for (let i = 0; i < pedidos.length; i++) {
                const lista = [];
                const textos = [];
                for (let j = 0; j < itens.length; j++) {
                    if (itens[j].id_pedido === pedidos[i].id_pedido) {
                        lista.push(itens[j]);
                        textos.push(itens[j].produto_nome + ' (' + itens[j].quantidade + ')');
                    }
                }
                pedidos[i].itens = lista;
                pedidos[i].resumo_itens = textos.join(' + ');
            }
            return res.status(200).json(pedidos);
        });
    });
});

// 23 - ROTA READ BY ID: DETALHE DO PEDIDO COM FEFO
app.get('/api/pedidos/:id', (req, res) => {
    db.query("SELECT id_pedido, cliente, DATE_FORMAT(data_pedido, '%Y-%m-%d') AS data_pedido, DATE_FORMAT(data_entrega, '%Y-%m-%d') AS data_entrega, status, valor_total, id_usuario FROM pedidos WHERE id_pedido = ?", [req.params.id], (err, pedidos) => {
        if (err) return res.status(500).json(err);
        if (pedidos.length === 0) return res.status(404).json({ mensagem: 'Pedido não encontrado' });

        db.query('SELECT i.id_item, i.id_produto, pr.nome AS produto_nome, i.quantidade, i.valor_unitario FROM itens_pedido i JOIN produtos pr ON pr.id_produto = i.id_produto WHERE i.id_pedido = ?', [req.params.id], (err2, itens) => {
            if (err2) return res.status(500).json(err2);

            const qLotes = "SELECT id_lote, id_produto, numero_lote, DATE_FORMAT(data_validade, '%Y-%m-%d') AS data_validade, DATEDIFF(data_validade, CURDATE()) AS dias_para_vencer, quantidade_atual FROM lotes WHERE status = 'Disponivel' AND quantidade_atual > 0 ORDER BY data_validade ASC, data_producao ASC";
            db.query(qLotes, [], (err3, lotes) => {
                if (err3) return res.status(500).json(err3);
                for (let i = 0; i < itens.length; i++) {
                    const lotesProd = [];
                    for (let j = 0; j < lotes.length; j++) {
                        if (lotes[j].id_produto === itens[i].id_produto) lotesProd.push(lotes[j]);
                    }
                    itens[i].sugestao_fefo = calcularFefoLista(lotesProd, itens[i].quantidade);
                }
                pedidos[0].itens = itens;
                return res.status(200).json(pedidos[0]);
            });
        });
    });
});

// 24 - ROTA CREATE: CADASTRA PEDIDO
app.post('/api/pedidos', (req, res) => {
    const cliente = req.body.cliente;
    const data_pedido = req.body.data_pedido ? req.body.data_pedido : hojeIso();
    const data_entrega = req.body.data_entrega;
    const itens = req.body.itens;

    if (!cliente || !data_entrega) return res.status(400).json({ mensagem: 'Cliente e data de entrega são obrigatórios' });
    if (data_entrega < data_pedido) return res.status(400).json({ mensagem: 'Data de entrega não pode ser anterior à data do pedido' });
    if (!Array.isArray(itens) || itens.length === 0) return res.status(400).json({ mensagem: 'O pedido deve possuir pelo menos um item' });

    const vistos = [];
    for (let i = 0; i < itens.length; i++) {
        const idP = parseInt(itens[i].id_produto, 10);
        const qtd = parseInt(itens[i].quantidade, 10);
        if (isNaN(idP) || isNaN(qtd) || qtd <= 0) return res.status(400).json({ mensagem: 'Itens inválidos' });
        if (vistos.indexOf(idP) !== -1) return res.status(400).json({ mensagem: 'Não repita o mesmo produto no pedido' });
        vistos.push(idP);
    }

    db.query("SELECT id_produto, preco FROM produtos WHERE status = 'Ativo'", [], (err, prods) => {
        if (err) return res.status(500).json(err);
        let valorTotal = 0;
        const validados = [];

        for (let i = 0; i < itens.length; i++) {
            const idP = parseInt(itens[i].id_produto, 10);
            const qtd = parseInt(itens[i].quantidade, 10);
            let preco = null;
            for (let j = 0; j < prods.length; j++) {
                if (prods[j].id_produto === idP) { preco = Number(prods[j].preco); break; }
            }
            if (preco === null) return res.status(400).json({ mensagem: `Produto ${idP} não encontrado ou inativo` });
            valorTotal = valorTotal + (qtd * preco);
            validados.push([idP, qtd, preco]);
        }

        const idUsuario = req.body.id_usuario ? parseInt(req.body.id_usuario, 10) : 1;
        db.query('INSERT INTO pedidos (cliente, data_pedido, data_entrega, valor_total, id_usuario) VALUES (?, ?, ?, ?, ?)', [cliente, data_pedido, data_entrega, valorTotal, idUsuario], (err2, resPed) => {
            if (err2) return res.status(500).json(err2);
            const linhas = [];
            for (let k = 0; k < validados.length; k++) {
                linhas.push([resPed.insertId, validados[k][0], validados[k][1], validados[k][2]]);
            }
            db.query('INSERT INTO itens_pedido (id_pedido, id_produto, quantidade, valor_unitario) VALUES ?', [linhas], (err3) => {
                if (err3) return res.status(500).json(err3);
                return res.status(201).json({ mensagem: 'Pedido cadastrado com sucesso', id_pedido: resPed.insertId, valor_total: Number(valorTotal.toFixed(2)) });
            });
        });
    });
});

// 25 - ROTA UPDATE: MUDA STATUS DO PEDIDO
app.put('/api/pedidos/:id/status', (req, res) => {
    const novoStatus = req.body.status;
    if (!novoStatus) return res.status(400).json({ mensagem: 'Novo status é obrigatório' });

    db.query('SELECT id_pedido, status FROM pedidos WHERE id_pedido = ?', [req.params.id], (err, rows) => {
        if (err) return res.status(500).json(err);
        if (rows.length === 0) return res.status(404).json({ mensagem: 'Pedido não encontrado' });

        const atual = rows[0].status;
        const ordem = ['Pendente', 'Em preparacao', 'Pronto', 'Enviado', 'Entregue'];
        const valida = novoStatus === 'Cancelado'
            ? (atual === 'Pendente' || atual === 'Em preparacao' || atual === 'Pronto')
            : (ordem.indexOf(atual) !== -1 && ordem.indexOf(novoStatus) === ordem.indexOf(atual) + 1);

        if (!valida) return res.status(400).json({ mensagem: `Transição inválida de '${atual}' para '${novoStatus}'` });
        if (novoStatus === 'Enviado') return processarEnvioPedido(req.params.id, req.body.id_usuario ? parseInt(req.body.id_usuario, 10) : 3, res);

        db.query('UPDATE pedidos SET status = ? WHERE id_pedido = ?', [novoStatus, req.params.id], (err2) => {
            if (err2) return res.status(500).json(err2);
            return res.status(200).json({ mensagem: `Pedido atualizado para ${novoStatus}`, id_pedido: Number(req.params.id), status: novoStatus });
        });
    });
});

// 26 - ROTA READ: LISTA PERDAS
app.get('/api/perdas', (req, res) => {
    const q = "SELECT pe.id_perda, pe.id_produto, pr.nome AS produto_nome, pe.id_lote, l.numero_lote, pe.quantidade, pe.motivo, DATE_FORMAT(pe.data_perda, '%Y-%m-%d') AS data_perda, pe.valor_estimado, pe.id_usuario, u.nome AS usuario_nome, pe.observacao FROM perdas pe JOIN produtos pr ON pr.id_produto = pe.id_produto LEFT JOIN lotes l ON l.id_lote = pe.id_lote JOIN usuarios u ON u.id_usuario = pe.id_usuario ORDER BY pe.data_perda DESC, pe.id_perda DESC";
    db.query(q, [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

function gravarPerda(d, lote, res) {
    db.query('INSERT INTO perdas (id_produto, id_lote, quantidade, motivo, data_perda, valor_estimado, id_usuario, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [d.id_produto, d.id_lote, d.quantidade, d.motivo, d.data_perda, d.valor_estimado, d.id_usuario, d.observacao], (err, resPerda) => {
            if (err) return res.status(500).json(err);
            const idPerda = resPerda.insertId;
            if (!lote) return res.status(201).json({ mensagem: 'Perda avulsa registrada com sucesso', id_perda: idPerda, valor_estimado: Number(d.valor_estimado.toFixed(2)) });

            db.query("INSERT INTO movimentacoes_estoque (id_lote, tipo, quantidade, id_usuario, observacao) VALUES (?, 'Perda', ?, ?, ?)", [d.id_lote, -d.quantidade, d.id_usuario, d.motivo], (errMov) => {
                if (errMov) return res.status(500).json(errMov);
                const novoSaldo = lote.quantidade_atual - d.quantidade;
                const novoStatus = novoSaldo === 0 ? 'Esgotado' : lote.status;
                db.query('UPDATE lotes SET quantidade_atual = ?, status = ? WHERE id_lote = ?', [novoSaldo, novoStatus, d.id_lote], (errUp) => {
                    if (errUp) return res.status(500).json(errUp);
                    return res.status(201).json({ mensagem: 'Perda registrada e saldo do lote atualizado', id_perda: idPerda, valor_estimado: Number(d.valor_estimado.toFixed(2)), novo_saldo_lote: novoSaldo });
                });
            });
        });
}

// 27 - ROTA CREATE: REGISTRA PERDA
app.post('/api/perdas', (req, res) => {
    const id_produto = req.body.id_produto;
    const id_lote = req.body.id_lote ? req.body.id_lote : null;
    const quantidade = parseInt(req.body.quantidade, 10);
    let motivo = req.body.motivo;
    if (motivo === 'Produto fora do padrão') motivo = 'Produto fora do padrao';
    if (motivo === 'Erro de produção') motivo = 'Erro de producao';

    const motivosValidos = ['Validade', 'Embalagem danificada', 'Erro de producao', 'Armazenamento inadequado', 'Produto fora do padrao', 'Outros'];
    if (!id_produto || isNaN(quantidade) || quantidade <= 0 || motivosValidos.indexOf(motivo) === -1) {
        return res.status(400).json({ mensagem: 'Produto, quantidade maior que zero e motivo válido são obrigatórios' });
    }

    db.query('SELECT id_produto, preco FROM produtos WHERE id_produto = ?', [id_produto], (err, prods) => {
        if (err) return res.status(500).json(err);
        if (prods.length === 0) return res.status(404).json({ mensagem: 'Produto não encontrado' });

        const valor_estimado = req.body.valor_estimado !== undefined ? Number(req.body.valor_estimado) : (quantidade * Number(prods[0].preco));
        if (isNaN(valor_estimado) || valor_estimado < 0) return res.status(400).json({ mensagem: 'Valor estimado inválido' });

        const dados = {
            id_produto: id_produto, id_lote: id_lote, quantidade: quantidade, motivo: motivo,
            data_perda: req.body.data_perda ? req.body.data_perda : hojeIso(),
            valor_estimado: valor_estimado,
            id_usuario: req.body.id_usuario ? parseInt(req.body.id_usuario, 10) : 4,
            observacao: req.body.observacao ? req.body.observacao : null
        };
        if (!id_lote) return gravarPerda(dados, null, res);

        db.query('SELECT id_lote, id_produto, quantidade_atual, status FROM lotes WHERE id_lote = ?', [id_lote], (errLote, lotes) => {
            if (errLote) return res.status(500).json(errLote);
            if (lotes.length === 0) return res.status(404).json({ mensagem: 'Lote não encontrado' });
            if (lotes[0].id_produto !== Number(id_produto)) return res.status(400).json({ mensagem: 'O lote informado não pertence ao produto selecionado' });
            if (quantidade > lotes[0].quantidade_atual) return res.status(400).json({ mensagem: 'Quantidade da perda é maior que o saldo do lote' });
            gravarPerda(dados, lotes[0], res);
        });
    });
});

// BLOCO 5 - CALCULOS E ALERTAS

function calcularRecomendacaoProducao(pendentes, minimo, disponivel) {
    return Math.max(0, pendentes + minimo - disponivel);
}

function calcularIndiceRisco(d) {
    let validade = 0;
    if (d.qtdCritico > 0) validade = validade + 20;
    if (d.qtdVencido > 0) validade = validade + 15;
    if (d.qtdAtencao > 0) validade = validade + 10;
    validade = Math.min(35, validade);

    let excesso = 0;
    if ((d.pedidosPendentes === 0 && d.estoqueDisponivel > 0) || (d.pedidosPendentes > 0 && d.estoqueDisponivel >= 2 * d.pedidosPendentes)) excesso = 20;
    else if (d.estoqueDisponivel > d.pedidosPendentes) excesso = 10;

    let perdas = 0;
    if (d.perdasMesUn >= 100) perdas = 20;
    else if (d.perdasMesUn >= 50) perdas = 10;
    else if (d.perdasMesUn > 0) perdas = 5;

    let falta = 0;
    if (d.estoqueDisponivel < d.estoqueMinimo) falta = 20;
    else if (d.estoqueDisponivel < d.pedidosPendentes) falta = 10;

    const total = validade + excesso + perdas + falta;
    let nivel = 'Baixo';
    if (total >= RISCO_ALTO) nivel = 'Alto';
    else if (total >= RISCO_MEDIO) nivel = 'Medio';
    return { pontos_validade: validade, pontos_excesso: excesso, pontos_perdas: perdas, pontos_falta: falta, indice_risco: total, nivel_risco: nivel };
}

function buscarResumoProdutos(callback) {
    const qProd = `
        SELECT p.id_produto, p.nome, p.categoria, p.preco, p.estoque_minimo,
               COALESCE(SUM(CASE WHEN l.status = 'Disponivel' THEN l.quantidade_atual ELSE 0 END), 0) AS disponivel,
               COALESCE(SUM(CASE WHEN l.status = 'Vencido' THEN l.quantidade_atual ELSE 0 END), 0) AS qtd_vencido,
               COALESCE(SUM(CASE WHEN l.status = 'Disponivel' AND DATEDIFF(l.data_validade, CURDATE()) <= 7 THEN l.quantidade_atual ELSE 0 END), 0) AS qtd_critico,
               COALESCE(SUM(CASE WHEN l.status = 'Disponivel' AND DATEDIFF(l.data_validade, CURDATE()) BETWEEN 8 AND 15 THEN l.quantidade_atual ELSE 0 END), 0) AS qtd_atencao
        FROM produtos p
        LEFT JOIN lotes l ON l.id_produto = p.id_produto
        WHERE p.status = 'Ativo'
        GROUP BY p.id_produto ORDER BY p.id_produto ASC
    `;
    db.query(qProd, [], (err, prods) => {
        if (err) return callback(err, null);

        const qPed = "SELECT i.id_produto, COALESCE(SUM(i.quantidade), 0) AS pendentes FROM itens_pedido i JOIN pedidos p ON p.id_pedido = i.id_pedido WHERE p.status IN ('Pendente', 'Em preparacao', 'Pronto') GROUP BY i.id_produto";
        db.query(qPed, [], (err2, pedidos) => {
            if (err2) return callback(err2, null);

            const qPerdas = 'SELECT id_produto, COALESCE(SUM(CASE WHEN MONTH(data_perda) = MONTH(CURDATE()) AND YEAR(data_perda) = YEAR(CURDATE()) THEN quantidade ELSE 0 END), 0) AS mes_atual, COALESCE(SUM(CASE WHEN MONTH(data_perda) = MONTH(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH)) AND YEAR(data_perda) = YEAR(DATE_SUB(DATE_SUB(CURDATE(), INTERVAL (DAY(CURDATE()) - 1) DAY), INTERVAL 1 MONTH)) THEN quantidade ELSE 0 END), 0) AS mes_anterior FROM perdas GROUP BY id_produto';
            db.query(qPerdas, [], (err3, perdas) => {
                if (err3) return callback(err3, null);

                const analises = [];
                for (let i = 0; i < prods.length; i++) {
                    const p = prods[i];
                    const disp = Number(p.disponivel);
                    let pend = 0;
                    let perdaAtual = 0;
                    let perdaAnt = 0;

                    for (let j = 0; j < pedidos.length; j++) {
                        if (pedidos[j].id_produto === p.id_produto) { pend = Number(pedidos[j].pendentes); break; }
                    }
                    for (let k = 0; k < perdas.length; k++) {
                        if (perdas[k].id_produto === p.id_produto) {
                            perdaAtual = Number(perdas[k].mes_atual);
                            perdaAnt = Number(perdas[k].mes_anterior);
                            break;
                        }
                    }

                    const risco = calcularIndiceRisco({
                        estoqueDisponivel: disp, estoqueMinimo: p.estoque_minimo, pedidosPendentes: pend,
                        qtdVencido: Number(p.qtd_vencido), qtdCritico: Number(p.qtd_critico), qtdAtencao: Number(p.qtd_atencao), perdasMesUn: perdaAtual
                    });
                    analises.push({
                        id_produto: p.id_produto, nome: p.nome, categoria: p.categoria, preco: Number(p.preco),
                        estoque_disponivel: disp, estoque_minimo: p.estoque_minimo, pedidos_pendentes: pend,
                        perdas_mes_un: perdaAtual, perdas_mes_anterior_un: perdaAnt,
                        producao_recomendada: calcularRecomendacaoProducao(pend, p.estoque_minimo, disp),
                        indice_risco: risco.indice_risco, nivel_risco: risco.nivel_risco, detalhe_risco: risco
                    });
                }
                callback(null, analises);
            });
        });
    });
}

// 30 - ROTA READ: LISTA ALERTAS
app.get('/api/alertas', (req, res) => {
    const q = "SELECT a.id_alerta, a.tipo, a.nivel, a.id_produto, p.nome AS produto_nome, a.id_lote, l.numero_lote, a.id_pedido, a.mensagem, a.data_geracao, a.status, a.data_resolucao FROM alertas a LEFT JOIN produtos p ON p.id_produto = a.id_produto LEFT JOIN lotes l ON l.id_lote = a.id_lote ORDER BY FIELD(a.status, 'Aberto', 'Resolvido'), FIELD(a.nivel, 'Critico', 'Atencao'), a.id_alerta DESC";
    db.query(q, [], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

// 31 - ROTA UPDATE: RESOLVE ALERTA
app.put('/api/alertas/:id/resolver', (req, res) => {
    db.query("UPDATE alertas SET status = 'Resolvido', data_resolucao = NOW() WHERE id_alerta = ?", [req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.affectedRows === 0) return res.status(404).json({ mensagem: 'Alerta não encontrado' });
        return res.status(200).json({ mensagem: 'Alerta marcado como resolvido' });
    });
});

function chaveAlerta(a) {
    return a.tipo + '-' + (a.id_produto ? a.id_produto : 0) + '-' + (a.id_lote ? a.id_lote : 0) + '-' + (a.id_pedido ? a.id_pedido : 0);
}

function sincronizarAlertas(desejados, vencidosAtualizados, res) {
    db.query("SELECT id_alerta, tipo, id_produto, id_lote, id_pedido FROM alertas WHERE status = 'Aberto'", [], (err, abertos) => {
        if (err) return res.status(500).json(err);
        const inserir = [];
        const resolver = [];

        for (let i = 0; i < desejados.length; i++) {
            let existe = false;
            for (let j = 0; j < abertos.length; j++) {
                if (chaveAlerta(abertos[j]) === chaveAlerta(desejados[i])) { existe = true; break; }
            }
            if (!existe) inserir.push([desejados[i].tipo, desejados[i].nivel, desejados[i].id_produto, desejados[i].id_lote, desejados[i].id_pedido, desejados[i].mensagem, 'Aberto']);
        }
        for (let i = 0; i < abertos.length; i++) {
            let vale = false;
            for (let j = 0; j < desejados.length; j++) {
                if (chaveAlerta(desejados[j]) === chaveAlerta(abertos[i])) { vale = true; break; }
            }
            if (!vale) resolver.push(abertos[i].id_alerta);
        }

        function finalizar() {
            if (resolver.length === 0) {
                return res.status(200).json({ mensagem: 'Alertas atualizados com sucesso', lotes_vencidos_atualizados: vencidosAtualizados, alertas_criados: inserir.length, alertas_resolvidos: 0 });
            }
            db.query("UPDATE alertas SET status = 'Resolvido', data_resolucao = NOW() WHERE id_alerta IN (?)", [resolver], (errR) => {
                if (errR) return res.status(500).json(errR);
                return res.status(200).json({ mensagem: 'Alertas atualizados com sucesso', lotes_vencidos_atualizados: vencidosAtualizados, alertas_criados: inserir.length, alertas_resolvidos: resolver.length });
            });
        }

        if (inserir.length === 0) return finalizar();
        db.query('INSERT INTO alertas (tipo, nivel, id_produto, id_lote, id_pedido, mensagem, status) VALUES ?', [inserir], (errI) => {
            if (errI) return res.status(500).json(errI);
            finalizar();
        });
    });
}

function montarAlertasPorDados(analises, vencidosAtualizados, res) {
    const qLotes = "SELECT l.id_lote, l.id_produto, p.nome AS produto_nome, l.numero_lote, l.quantidade_atual, l.status, DATEDIFF(l.data_validade, CURDATE()) AS dias_para_vencer FROM lotes l JOIN produtos p ON p.id_produto = l.id_produto WHERE l.status IN ('Disponivel', 'Vencido') AND l.quantidade_atual > 0";
    db.query(qLotes, [], (err, lotes) => {
        if (err) return res.status(500).json(err);

        const qPed = "SELECT i.id_pedido, i.id_produto, pr.nome AS produto_nome, i.quantidade FROM itens_pedido i JOIN pedidos p ON p.id_pedido = i.id_pedido JOIN produtos pr ON pr.id_produto = i.id_produto WHERE p.status IN ('Pendente', 'Em preparacao', 'Pronto')";
        db.query(qPed, [], (err2, pedItens) => {
            if (err2) return res.status(500).json(err2);
            const desejados = [];

            for (let i = 0; i < lotes.length; i++) {
                const lt = lotes[i];
                const dias = Number(lt.dias_para_vencer);
                if (lt.status === 'Vencido' || dias < 0) {
                    desejados.push({ tipo: 'Validade', nivel: 'Critico', id_produto: lt.id_produto, id_lote: lt.id_lote, id_pedido: null, mensagem: `Lote ${lt.numero_lote} (${lt.produto_nome}) vencido com ${lt.quantidade_atual} un em estoque.` });
                } else if (dias <= DIAS_CRITICO) {
                    desejados.push({ tipo: 'Validade', nivel: 'Critico', id_produto: lt.id_produto, id_lote: lt.id_lote, id_pedido: null, mensagem: `${lt.quantidade_atual} un de ${lt.produto_nome} (${lt.numero_lote}) vencem em ${dias} dias.` });
                } else if (dias <= DIAS_ATENCAO) {
                    desejados.push({ tipo: 'Validade', nivel: 'Atencao', id_produto: lt.id_produto, id_lote: lt.id_lote, id_pedido: null, mensagem: `${lt.quantidade_atual} un de ${lt.produto_nome} (${lt.numero_lote}) vencem em ${dias} dias.` });
                }
            }

            for (let i = 0; i < analises.length; i++) {
                const a = analises[i];
                if (a.estoque_disponivel < a.estoque_minimo) {
                    desejados.push({ tipo: 'Estoque', nivel: a.estoque_disponivel < (a.estoque_minimo / 2) ? 'Critico' : 'Atencao', id_produto: a.id_produto, id_lote: null, id_pedido: null, mensagem: `${a.nome} esta abaixo do estoque minimo (${a.estoque_disponivel} de ${a.estoque_minimo}).` });
                }
                if (a.perdas_mes_anterior_un > 0 && a.perdas_mes_un > a.perdas_mes_anterior_un) {
                    const aum = Math.round(((a.perdas_mes_un - a.perdas_mes_anterior_un) / a.perdas_mes_anterior_un) * 100);
                    if (aum >= AUMENTO_PERDA_ATENCAO) {
                        desejados.push({ tipo: 'Desperdicio', nivel: aum >= AUMENTO_PERDA_CRITICO ? 'Critico' : 'Atencao', id_produto: a.id_produto, id_lote: null, id_pedido: null, mensagem: `${a.nome}: perdas ${aum}% maiores que no mes anterior (${a.perdas_mes_un} un contra ${a.perdas_mes_anterior_un} un).` });
                    }
                }
            }

            for (let i = 0; i < pedItens.length; i++) {
                let disp = 0;
                for (let j = 0; j < analises.length; j++) {
                    if (analises[j].id_produto === pedItens[i].id_produto) { disp = analises[j].estoque_disponivel; break; }
                }
                if (pedItens[i].quantidade > disp) {
                    desejados.push({ tipo: 'Pedido', nivel: 'Critico', id_produto: pedItens[i].id_produto, id_lote: null, id_pedido: pedItens[i].id_pedido, mensagem: `Pedido ${pedItens[i].id_pedido}: ${pedItens[i].produto_nome} pede ${pedItens[i].quantidade} un, estoque disponivel ${disp} un.` });
                }
            }
            sincronizarAlertas(desejados, vencidosAtualizados, res);
        });
    });
}

// 32 - ROTA POST: ATUALIZA VENCIDOS E GERA ALERTAS
app.post('/api/alertas/atualizar', (req, res) => {
    db.query("UPDATE lotes SET status = 'Vencido' WHERE status = 'Disponivel' AND data_validade < CURDATE()", [], (errVenc, resVenc) => {
        if (errVenc) return res.status(500).json(errVenc);
        buscarResumoProdutos((err, analises) => {
            if (err) return res.status(500).json(err);
            montarAlertasPorDados(analises, resVenc.affectedRows, res);
        });
    });
});

// BLOCO 6 - DASHBOARD E RELATORIOS

function finalizarDashboard(analises, lotes, res) {
    const qResumos = `
        SELECT
            (SELECT COUNT(*) FROM pedidos WHERE status IN ('Pendente', 'Em preparacao', 'Pronto')) AS ped_qtd,
            (SELECT COALESCE(SUM(valor_total), 0) FROM pedidos WHERE status IN ('Pendente', 'Em preparacao', 'Pronto')) AS ped_val,
            (SELECT COALESCE(SUM(quantidade_produzida), 0) FROM producao WHERE MONTH(data_producao) = MONTH(CURDATE()) AND YEAR(data_producao) = YEAR(CURDATE())) AS prod_un,
            (SELECT COALESCE(SUM(quantidade_planejada), 0) FROM producao WHERE MONTH(data_producao) = MONTH(CURDATE()) AND YEAR(data_producao) = YEAR(CURDATE())) AS prod_plan,
            (SELECT COALESCE(SUM(quantidade), 0) FROM perdas WHERE MONTH(data_perda) = MONTH(CURDATE()) AND YEAR(data_perda) = YEAR(CURDATE())) AS perdas_un,
            (SELECT COALESCE(SUM(valor_estimado), 0) FROM perdas WHERE MONTH(data_perda) = MONTH(CURDATE()) AND YEAR(data_perda) = YEAR(CURDATE())) AS perdas_val
    `;
    db.query(qResumos, [], (err, r) => {
        if (err) return res.status(500).json(err);

        let estTotal = 0, lotesAtivos = 0, lotesProx = 0, unProx = 0, lotesVenc = 0;
        for (let i = 0; i < lotes.length; i++) {
            const lt = lotes[i];
            const saldo = Number(lt.quantidade_atual);
            if (lt.status === 'Disponivel') {
                estTotal = estTotal + saldo;
                lotesAtivos = lotesAtivos + 1;
                if (Number(lt.dias_para_vencer) <= DIAS_ATENCAO) { lotesProx = lotesProx + 1; unProx = unProx + saldo; }
            } else if (lt.status === 'Vencido') {
                lotesVenc = lotesVenc + 1;
            }
        }

        let abaixoMin = 0;
        for (let i = 0; i < analises.length; i++) {
            if (analises[i].estoque_disponivel < analises[i].estoque_minimo) abaixoMin = abaixoMin + 1;
        }

        analises.sort((a, b) => b.indice_risco - a.indice_risco);

        return res.status(200).json({
            indicadores: {
                estoque_total: estTotal, lotes_ativos: lotesAtivos, lotes_proximos_validade: lotesProx,
                unidades_proximas_validade: unProx, lotes_vencidos: lotesVenc,
                perdas_mes_unidades: Number(r[0].perdas_un), perdas_mes_valor: Number(Number(r[0].perdas_val).toFixed(2)),
                pedidos_pendentes: Number(r[0].ped_qtd), pedidos_pendentes_valor: Number(Number(r[0].ped_val).toFixed(2)),
                produtos_abaixo_minimo: abaixoMin, producao_mes_unidades: Number(r[0].prod_un), producao_mes_planejada: Number(r[0].prod_plan)
            },
            analise_produtos: analises
        });
    });
}

// 33 - ROTA DASHBOARD
app.get('/api/dashboard', (req, res) => {
    buscarResumoProdutos((err, analises) => {
        if (err) return res.status(500).json(err);
        const qLotes = "SELECT l.id_lote, l.numero_lote, l.id_produto, p.nome AS produto_nome, p.preco, DATE_FORMAT(l.data_validade, '%Y-%m-%d') AS data_validade, l.quantidade_atual, l.status, DATEDIFF(l.data_validade, CURDATE()) AS dias_para_vencer FROM lotes l JOIN produtos p ON p.id_produto = l.id_produto WHERE l.quantidade_atual > 0 AND l.status IN ('Disponivel', 'Vencido') ORDER BY l.data_validade ASC, l.data_producao ASC";
        db.query(qLotes, [], (err2, lotes) => {
            if (err2) return res.status(500).json(err2);
            finalizarDashboard(analises, lotes, res);
        });
    });
});

// 34 - ROTA RELATORIO: PERDAS POR PERIODO
app.get('/api/relatorios/perdas/:inicio/:fim', (req, res) => {
    if (req.params.inicio > req.params.fim) return res.status(400).json({ mensagem: 'A data inicial não pode ser maior que a data final' });

    const q = "SELECT pe.id_perda, pe.id_produto, pr.nome AS produto_nome, l.numero_lote, pe.quantidade, pe.motivo, DATE_FORMAT(pe.data_perda, '%Y-%m-%d') AS data_perda, pe.valor_estimado FROM perdas pe JOIN produtos pr ON pr.id_produto = pe.id_produto LEFT JOIN lotes l ON l.id_lote = pe.id_lote WHERE pe.data_perda BETWEEN ? AND ? ORDER BY pe.data_perda DESC, pe.id_perda DESC";
    db.query(q, [req.params.inicio, req.params.fim], (err, itens) => {
        if (err) return res.status(500).json(err);
        const ag = agruparPerdas(itens);
        return res.status(200).json({ periodo: { inicio: req.params.inicio, fim: req.params.fim }, totais: { total_unidades: ag.total_unidades, valor_total: ag.valor_total }, por_produto: ag.por_produto, por_motivo: ag.por_motivo, itens: itens });
    });
});

// 35 - ROTA RELATORIO: ESTOQUE
app.get('/api/relatorios/estoque', (req, res) => {
    buscarResumoProdutos((err, produtos) => {
        if (err) return res.status(500).json(err);
        const qLotes = "SELECT l.id_lote, l.numero_lote, p.nome AS produto_nome, DATE_FORMAT(l.data_validade, '%Y-%m-%d') AS data_validade, l.quantidade_atual, l.status, DATEDIFF(l.data_validade, CURDATE()) AS dias_para_vencer FROM lotes l JOIN produtos p ON p.id_produto = l.id_produto WHERE l.quantidade_atual > 0 AND (l.status = 'Vencido' OR (l.status = 'Disponivel' AND DATEDIFF(l.data_validade, CURDATE()) <= ?)) ORDER BY l.data_validade ASC";
        db.query(qLotes, [DIAS_ATENCAO], (err2, lotesAtencao) => {
            if (err2) return res.status(500).json(err2);
            let total = 0, abaixo = 0;
            for (let i = 0; i < produtos.length; i++) {
                total = total + produtos[i].estoque_disponivel;
                if (produtos[i].estoque_disponivel < produtos[i].estoque_minimo) abaixo = abaixo + 1;
            }
            return res.status(200).json({ resumo: { estoque_total: total, produtos_abaixo_minimo: abaixo, lotes_validade_ou_vencidos: lotesAtencao.length }, produtos: produtos, lotes_atencao: lotesAtencao });
        });
    });
});

// 36 - ROTA RELATORIO: PRODUCAO POR PERIODO
app.get('/api/relatorios/producao/:inicio/:fim', (req, res) => {
    if (req.params.inicio > req.params.fim) return res.status(400).json({ mensagem: 'A data inicial não pode ser maior que a data final' });

    const q = "SELECT DATE_FORMAT(pr.data_producao, '%Y-%m-%d') AS data_producao, p.nome AS produto_nome, l.numero_lote, pr.quantidade_planejada, pr.quantidade_produzida, pr.turno, u.nome AS responsavel FROM producao pr JOIN lotes l ON l.id_lote = pr.id_lote JOIN produtos p ON p.id_produto = l.id_produto JOIN usuarios u ON u.id_usuario = pr.id_usuario WHERE pr.data_producao BETWEEN ? AND ? ORDER BY pr.data_producao DESC, pr.id_producao DESC";
    db.query(q, [req.params.inicio, req.params.fim], (err, itens) => {
        if (err) return res.status(500).json(err);
        let plan = 0, prod = 0;
        for (let i = 0; i < itens.length; i++) {
            plan = plan + Number(itens[i].quantidade_planejada);
            prod = prod + Number(itens[i].quantidade_produzida);
        }
        return res.status(200).json({ periodo: { inicio: req.params.inicio, fim: req.params.fim }, totais: { total_planejada: plan, total_produzida: prod, aderencia_percentual: plan > 0 ? Number(((prod / plan) * 100).toFixed(1)) : 0 }, itens: itens });
    });
});

// 37 - ROTA RELATORIO: PEDIDOS POR PERIODO
app.get('/api/relatorios/pedidos/:inicio/:fim', (req, res) => {
    if (req.params.inicio > req.params.fim) return res.status(400).json({ mensagem: 'A data inicial não pode ser maior que a data final' });

    db.query("SELECT id_pedido, cliente, DATE_FORMAT(data_pedido, '%Y-%m-%d') AS data_pedido, DATE_FORMAT(data_entrega, '%Y-%m-%d') AS data_entrega, status, valor_total FROM pedidos WHERE data_pedido BETWEEN ? AND ? ORDER BY id_pedido DESC", [req.params.inicio, req.params.fim], (err, pedidos) => {
        if (err) return res.status(500).json(err);

        const qMais = "SELECT pr.nome AS produto_nome, SUM(i.quantidade) AS quantidade_total, SUM(i.quantidade * i.valor_unitario) AS valor_total FROM itens_pedido i JOIN pedidos p ON p.id_pedido = i.id_pedido JOIN produtos pr ON pr.id_produto = i.id_produto WHERE p.data_pedido BETWEEN ? AND ? AND p.status <> 'Cancelado' GROUP BY pr.id_produto, pr.nome ORDER BY quantidade_total DESC";
        db.query(qMais, [req.params.inicio, req.params.fim], (err2, maisSolicitados) => {
            if (err2) return res.status(500).json(err2);
            let valorTotal = 0, pendentes = 0, concluidos = 0;
            for (let i = 0; i < pedidos.length; i++) {
                const st = pedidos[i].status;
                if (st !== 'Cancelado') valorTotal = valorTotal + Number(pedidos[i].valor_total);
                if (st === 'Pendente' || st === 'Em preparacao' || st === 'Pronto') pendentes = pendentes + 1;
                else if (st === 'Enviado' || st === 'Entregue') concluidos = concluidos + 1;
            }
            return res.status(200).json({ periodo: { inicio: req.params.inicio, fim: req.params.fim }, resumo: { total_pedidos: pedidos.length, pendentes: pendentes, concluidos: concluidos, valor_total: Number(valorTotal.toFixed(2)) }, mais_solicitados: maisSolicitados, pedidos: pedidos });
        });
    });
});

// FIM DAS ROTAS DO SERVIDOR

// INICIALIZACAO DO SERVIDOR
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Servidor está rodando');
});

