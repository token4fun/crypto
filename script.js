// Example JavaScript for future functionality
document.addEventListener('DOMContentLoaded', function () {
    console.log('Welcome to Token4Fun! Your website and music video creation hub.');
    // You can add more interactive features here
});

// Banner rotation script
let bannerIndex = 0;
const banners = [
    { src: "https://token4fun.github.io/babysherk/banner1.gif", link: "https://sherkfun.io/" },
    { src: "https://token4fun.github.io/babysherk/banner3.gif", link: "https://t.me/SherkGameBot" },
    { src: "https://token4fun.github.io/babysherk/banner5.gif", link: "https://t.me/SherkFunCommunity" },
    { src: "https://token4fun.github.io/babysherk/banner6.gif", link: "https://t.me/SherkFunCommunity/1529" },
    { src: "https://sherkfuntoken.github.io/site/banner7.gif", link: "https://www.youtube.com/@SherkFunToken" },
];

function rotateBanner() {
    const bannerElement = document.getElementById('banner');
    const bannerLink = document.getElementById('banner-link');
    
    if (!bannerElement || !bannerLink) return; // Verifica se os elementos existem
    
    bannerElement.style.opacity = '0';

    setTimeout(() => {
        bannerIndex = (bannerIndex + 1) % banners.length;
        bannerElement.src = banners[bannerIndex].src;
        bannerLink.href = banners[bannerIndex].link;
        bannerElement.style.opacity = '1';
    }, 500); // Tempo para transição de opacidade
}

function prevBanner() {
    const bannerElement = document.getElementById('banner');
    const bannerLink = document.getElementById('banner-link');
    
    if (!bannerElement || !bannerLink) return;

    bannerIndex = (bannerIndex - 1 + banners.length) % banners.length; // Voltar ao índice anterior
    bannerElement.src = banners[bannerIndex].src;
    bannerLink.href = banners[bannerIndex].link;
}

function nextBanner() {
    const bannerElement = document.getElementById('banner');
    const bannerLink = document.getElementById('banner-link');
    
    if (!bannerElement || !bannerLink) return;

    bannerIndex = (bannerIndex + 1) % banners.length; // Avançar ao próximo índice
    bannerElement.src = banners[bannerIndex].src;
    bannerLink.href = banners[bannerIndex].link;
}

window.onload = function () {
    // Inicializando a rotação do banner a cada 7 segundos
    setInterval(rotateBanner, 7000); // Rotacionar o banner a cada 7 segundos
    // Adicionando as funções de navegação
    const prevButton = document.querySelector('.prev');
    const nextButton = document.querySelector('.next');
    if (prevButton) prevButton.addEventListener('click', prevBanner);
    if (nextButton) nextButton.addEventListener('click', nextBanner);
};

// Variáveis contendo os endereços das carteiras
const wallets = {
    usdtEthBnbWallet: '0xf4BD092977B3572216569Bf71493a5d32CAc8f86',
    solWallet: '4FGfBFXkBNKrjmjxgxRnrYojpZZLRKW439vwYU6sHXYX'
};

// Função para copiar o endereço da carteira
function copyToClipboard(button, walletKey) {
    // Acessa o endereço da carteira usando a chave
    const walletAddress = wallets[walletKey]; 

    // Cria um campo temporário para copiar o valor
    const tempInput = document.createElement('input');
    tempInput.value = walletAddress;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);

    // Obter o texto do botão (nome da criptomoeda)
    const buttonText = button.innerText || button.textContent; 

    // Mostrar a mensagem de alerta com o nome da criptomoeda e o endereço da wallet
    alert('\nYou chose: ' + buttonText + ' Wallet' + '\n\nWallet address copied to clipboard!\n\nSend the agreed amount to:\n\n ' + walletAddress);
}

// Função para alterar o texto ao passar o mouse
function hoverText(button, walletText) {
    button.innerHTML = walletText; // Altera o texto durante o hover
}

// Função para restaurar o texto original ao retirar o mouse
function resetText(button, originalText) {
    button.innerHTML = originalText; // Restaura o texto original
}
