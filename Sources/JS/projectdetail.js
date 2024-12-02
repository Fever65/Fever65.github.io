// Variables globales pour gérer les confettis
let confettiActive = false; // Indique si les confettis doivent être actifs
let confettiInterval = null; // Gestion d'une boucle d'animation constante
const maxConfettiCount = 500; // Limite maximale de confettis actifs

window.onload = function () {
    const projects = document.querySelectorAll('.project');
    projects.forEach((project, index) => {
        setTimeout(() => {
            project.classList.add('visible');
        }, index * 200);
    });

    const totalAnimationTime = projects.length * 200;
    setTimeout(() => {
        buttonIcon.style.display = 'block';
        buttonIcon.style.opacity = '0';
        buttonIcon.style.transform = 'scale(0.8)';
        buttonIcon.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
        setTimeout(() => {
            buttonIcon.style.opacity = '1';
            buttonIcon.style.transform = 'scale(1)';
        }, 10);
    }, totalAnimationTime + 500);
};

// Fonction pour démarrer les confettis
function startConfetti() {
    if (confettiActive) return; // Empêche plusieurs démarrages
    confettiActive = true;

    confettiInterval = setInterval(() => {
        const particleCount = Math.min(maxConfettiCount, 50); // Contrôle du nombre de particules
        confetti({
            particleCount: particleCount,
            spread: 70,
            origin: { x: Math.random(), y: Math.random() },
        });
    }, 100); // Génération constante toutes les 100ms
}

// Fonction pour arrêter les confettis
function stopConfetti() {
    confettiActive = false;
    if (confettiInterval) {
        clearInterval(confettiInterval);
        confettiInterval = null;
    }
}

// Gestion de la visibilité de l'onglet
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log("Onglet caché, confettis tournent en arrière-plan !");
    } else {
        console.log("Retour sur l'onglet, confettis restent constants !");
    }
});

// Fonction pour ouvrir les détails d'un projet
function openProjectDetail(title, description, link, logoSrc, target = "_self", borderColor) {
    const overlay = document.getElementById('overlay');
    const projectDetail = document.getElementById('projectDetail');

    document.getElementById('projectLogo').src = logoSrc;
    document.getElementById('projectTitle').innerText = title;
    document.getElementById('projectDescription').innerText = description;
    document.getElementById('projectLink').href = link;
    document.getElementById('projectLink').target = target;

    projectDetail.style.setProperty('--project-color', borderColor);
    overlay.style.background = `${borderColor}22`;
    overlay.style.display = 'block';
    projectDetail.style.display = 'flex';

    setTimeout(() => {
        overlay.classList.add('visible');
        projectDetail.classList.add('visible');
    }, 10);
}

// Fonction pour fermer les détails d'un projet
function closeProjectDetail() {
    const overlay = document.getElementById('overlay');
    const projectDetail = document.getElementById('projectDetail');

    overlay.classList.remove('visible');
    projectDetail.classList.remove('visible');
    setTimeout(() => {
        overlay.style.display = 'none';
        projectDetail.style.display = 'none';
    }, 300);
}
