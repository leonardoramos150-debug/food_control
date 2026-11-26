// Código do exemplo 01
// 1 - Selecionar os elementos que vamos manipular.
// Para selecionar os elementos podemos usar:
// documento.getElementById porém também podemos usar o document.QuerySelector(), e dentro dos parênteses podemos selecionar pela Classe(.) ou pelo Id(#)

const txt01 = document.querySelector("#txt-01");
const btn01 = document.querySelector("#btn-01");

// 2 - Executar a ação que queremos

btn01.addEventListener('click', () => {
    txt01.innerText = "Vocês são a melhor turma do ADS 2026 de Luzerna."
})

// Código do Exemplo 02
// 1 - Selecionar os elementos que queremos manipular

const interruptor = document.querySelector("#interruptor");
const btn02 = document.querySelector("#btn-02");

// 2 - Executar a ação

btn02.addEventListener('click', () => {
    interruptor.classList.toggle('interruptor-apagado');
})