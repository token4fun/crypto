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

function copyToClipboard(walletAddress) {
    // Cria um elemento de input temporário
    const tempInput = document.createElement('input');
    tempInput.value = walletAddress; // Define o valor como o endereço da carteira
    document.body.appendChild(tempInput); // Adiciona ao DOM
    tempInput.select(); // Seleciona o conteúdo
    document.execCommand('copy'); // Executa o comando de cópia
    document.body.removeChild(tempInput); // Remove o input temporário

    alert('Wallet address copied! Please send the agreed amount to: ' + walletAddress); // Exibe um alerta informando que o endereço foi copiado
}
