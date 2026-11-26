function selecionarPersonagem(nome, imagem) {
    document.getElementById('img-player-' + playerAtivo).setAttribute('src','images/personagens/' + imagem)
    document.getElementById('nome-personagem-' + playerAtivo).innerHTML = nome;
}

var playerAtivo = 1

function escolherPlayer(numeroDoPlayer){
    playerAtivo = numeroDoPlayer;
    document.getElementById('nome-personagem-1').style.border = '';
    document.getElementById('nome-personagem-2').style.border = '';
    document.getElementById('nome-personagem-' + numeroDoPlayer).style.border = '3px solid green';
}

