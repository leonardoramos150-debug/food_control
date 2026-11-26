const lampada = document.querySelector("#lampada");
const btn01 = document.querySelector("#btn-01");
var lampada_quebrada = false;

btn01.addEventListener("click", () => {
    lampada.setAttribute('src', "lampada_quebrada.png");
    lampada_quebrada = true;
});


lampada.addEventListener("mouseover", () => {
    if (lampada_quebrada == false) {
        lampada.setAttribute('src', "lampada_acesa.png")
    }
});

lampada.addEventListener("mouseout", () => {
    if (lampada_quebrada == false) {
        lampada.setAttribute('src', "lampada_apagada.png")
    }
});

// ------------------------------------------------------------------

const senha = document.querySelector("#senha");
const mostrar = document.querySelector("#mostrar");

mostrar.addEventListener("mousedown", () => {
    mostrar.setAttribute('class', 'ph ph-eye');
    senha.setAttribute('type', 'text');
})

mostrar.addEventListener("mouseup", () => {
    mostrar.setAttribute('class', 'ph ph-eye-slash');
    senha.setAttribute('type', 'password');
})