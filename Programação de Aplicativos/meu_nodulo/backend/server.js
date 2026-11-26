// IMPORTAR OS MÓDULOS NECESSARIOS
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

// CONSFIGURAÇÃO DA APLICAÇÃO EXPRESS
const app = express();
app.use(express.json());
app.use(cors());

// CONFIGURAÇÃO DO BANCO DE DADOS
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senai',
    database: 'sistema_usuarios',
});

db.connect(err => {
    if (err) {
        console.error('Erro ao conectar no banco:', err);
    }
    console.log('Conectado ao banco de dados');
});

// CRIAÇÃO DAS ROTAS DO SERVIDOR
// 1- ROTA READ: RETORNA TODOS OS USUÁRIOS CADASTRADOS
app.get('/usuarios', (req,res)=>{
    const q = "SELECT * FROM usuarios";
    db.query(q,(err,data)=>{
        if (err) return res.status(500).json(err);
        return res.status(200).json(data);
    });
});

// 2 - ROTA CREATE: CRIA UM NOVO USUÁRIO NO BANCO
app.post('/usuarios', (req,res)=>{
    const q = "INSERT INTO usuarios (nome, email) VALUES (?)";
    const values = [req.body.nome, req.body.email];

    db.query(q,[values], (err,data)=>{
        if (err) return res.status(500).json(err);
        return res.status(201).json({message: "Usuário cadastrado!"});
    });
})

// FIM DAS ROTAS DO SERVIDOR


// INICIALIZAÇÃO DO SERVIDOR
const PORT = 3000;
app.listen(PORT,()=>{
    console.log('Servidor está rodando')
})

// PARA INCIAR O SERVIDOR EXECUTE NO TERMINAL DA PASTA BACKEND O COMANDO node server.js