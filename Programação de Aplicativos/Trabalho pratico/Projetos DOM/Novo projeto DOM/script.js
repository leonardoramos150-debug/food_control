

// modo escuro
const btnTema = document.querySelector("#btn-tema")
btnTema.addEventListener("click", () => {
    document.body.classList.toggle("modo-escuro");
});

// adicionar remove o sumido se tiver texto
const adicionar = document.querySelector("#Adicionar");
const nomeTarefa = document.querySelector("#nomeTarefa");
const tituloTarefa = document.querySelector(".titulo-tarefa");
const tarefaAberta = document.querySelector(".tarefaAberta");
const erroAdicionar = document.querySelector("#erro-adicionar");
const sucessoAdicionar = document.querySelector("#sucesso-adicionar");
nomeTarefa.addEventListener('input', () => {
    erroAdicionar.classList.add("sumido");
})
adicionar.addEventListener("click", () => {
    if (nomeTarefa.value != "") {
        tituloTarefa.innerText = nomeTarefa.value;
        tarefaAberta.classList.remove("sumido");
        nomeTarefa.value = "";
        erroAdicionar.classList.add("sumido");
        sucessoAdicionar.classList.remove("sumido");
        setTimeout(() => {
            sucessoAdicionar.classList.add("sumido");
        }, 3000);
        
        //relogio
        clearInterval(relogio);                 
        relogio = null;                         
        tempoRestante = 60;                     
        tempo.innerText = "01:00";              
        sstatus.innerText = "Pronto para começar!";
        btnIniciar.disabled = false;           
        btnPausar.disabled = false;             
        mensagemFinal.classList.add("sumido"); 
    } else {
        erroAdicionar.classList.remove("sumido");
        sucessoAdicionar.classList.add("sumido");
    }
});

// padrao temprozador 
let tempoRestante = 60; 
let relogio = null;

//iniciar o temporizador
const tempo = document.querySelector("#tempo");
const sstatus = document.querySelector("#status");
const btnIniciar = document.querySelector("#btn-iniciar");
const btnPausar = document.querySelector("#btn-pausar");
const mensagemFinal = document.querySelector("#mensagem-final");
btnIniciar.addEventListener("click", () => {
    // relogio só inicia se não estiver rodando no momento
    if (relogio == null) {
        sstatus.innerText = "Em andamento...";
        btnIniciar.disabled = true;
        btnPausar.disabled = false;
        relogio = setInterval(() => { //({oq fazer}, de quanto em quanto tempo)
            // diminuir tempo
            tempoRestante=tempoRestante-1;
            // convcersão pro display
            let minutos = Math.floor(tempoRestante / 60);
            let segundos = tempoRestante % 60; //pega a sobra do 1min
            if (segundos < 10) {
                segundos = "0" + segundos;
            }
            tempo.innerText = "0" + minutos + ":" + segundos;
            // quando o tempo chega a zero:
            if (tempoRestante <= 0) {
                clearInterval(relogio);
                relogio = null;
                sstatus.innerText = "Tempo encerrado!";
                mensagemFinal.classList.remove("sumido"); // mostra tarefa concluída
                btnIniciar.disabled = true;
                btnPausar.disabled = true;
            }
        }, 1000);
    }
});

// pausar temporizador
btnPausar.addEventListener("click", () => {
    if (relogio != null) {
        clearInterval(relogio);
        relogio = null;
        sstatus.innerText = "Pausado";
        btnIniciar.disabled = false;
        btnPausar.disabled = true;
    }
});