const express = require("express");
const fs = require("fs");

// Cria uma aplicação com o express
const app = express();
const porta = 3000;

// Definir a forma de comunicação entre o node e o JS

app.use(express.json());

// Pegar nosso arquivo nas comandas
const arquivoComandas = 'pedidos.json';

// Criar a rota de leitura das comandas
app.get('/pedidos', (req, res) => {
    try {
        // Pegar o conteúdo e colocar em uma variável
        const conteudoTexto = fs.readFileSync(arquivoComandas, 'utf-8');
        
        // Transformar o texto em um array JS
        const comandas = JSON.parse(conteudoTexto);
        
        // Devolver a resposta com o conteúdo do arquivo
        res.json(comandas);
    } catch (erro) {
        res.status(500).json({ mensagem: 'Erro ao carregar comandas', erro: erro.message });
    }
});

// Criar a nossa rota de cadastro
app.post('/pedidos', (req, res) => {
    // Capturar as informações do body da nossa comanda
    const novoPedido = req.body; 
    // Criar o id do novo pedido
    novoPedido.id = Date.now().toString(); 

    // DESAFIO 2 - CARIMBO DE TEMPO
    novoPedido.horario = new Date().toLocaleString('pt-BR'); 
    console.log(novoPedido);

    // DESAFIO 1 - VALIDAÇÃO
    if (!req.body.cliente || !req.body.lanche) {
        return res.status(400).json({ mensagem: 'Faltam dados: Cliente e lanche são obrigatórios' });
    }
    
    // Ler novamente o arquivo dos pedidos para poder editar
    const textoComandas = fs.readFileSync(arquivoComandas, 'utf-8');
    const comandas = JSON.parse(textoComandas);

    // Adicionar a comanda no array do JSON
    comandas.push(novoPedido);

    // Salvar (escrever infos novas) no arquivo JSON
    fs.writeFileSync(arquivoComandas, JSON.stringify(comandas, null, 2));

    // Mandar resposta para o usuário
    res.status(201).json({ mensagem: 'Pedido cadastrado com sucesso', pedido: novoPedido});
})


// Definimos por onde o nosso servidor vai ficar ouvindo/esperando requisições
app.listen(porta, () => {
    console.log(`Servidor rodando em http://localhost:${porta}`);
});

