let fireworkInterval;

function switchLogo() {
    const headerLogo = document.querySelector('.header-logo');
    const buttonIcon = document.querySelector('.button-icon');
    const sapinSrc = '../Sources/Images/sapin.png';
    const palmierSrc = '../Sources/Images/palmier.png';
    const defaultLogoSrc = '../Sources/Images/jerome.png';
    const newLogoSrc = '../Sources/Images/JeromeN.png';

    if (buttonIcon.src.includes('sapin.png')) {
        buttonIcon.src = palmierSrc;
        headerLogo.src = newLogoSrc;
        enableChristmasMode(); 
    } else {
        buttonIcon.src = sapinSrc;
        headerLogo.src = defaultLogoSrc;
        disableChristmasMode(); 
    }
}

function launchFirework() {
    confetti({
        particleCount: 50, 
        spread: Math.random() * 100 + 50, 
        startVelocity: Math.random() * 20 + 40, 
        origin: {
            x: Math.random(), 
            y: 0.5 + Math.random() * 0.4, 
        },
        colors: ['#FFD700', '#FF4500', '#00BFFF', '#FFFFFF', '#ADFF2F', '#8F1671'], 
    });
}

function startFireworkLoop() {
    stopFireworkLoop(); 
    fireworkInterval = setInterval(() => {
        launchFirework();
    }, 1000); 
}

function stopFireworkLoop() {
    if (fireworkInterval) {
        clearInterval(fireworkInterval);
        fireworkInterval = null;
    }
}

function enableChristmasMode() {
    document.body.classList.add('christmas-mode');
    const projects = document.querySelectorAll('.project');
    projects.forEach((project) => {
        project.classList.add('christmas-mode');
    });
    const h1 = document.querySelector('h1');
    h1.classList.add('christmas-mode');
    const projectDetail = document.querySelector('.project-detail');
    if (projectDetail) {
        projectDetail.classList.add('christmas-mode');
    }

    startFireworkLoop();
}

function disableChristmasMode() {
    document.body.classList.remove('christmas-mode');
    const projects = document.querySelectorAll('.project');
    projects.forEach((project) => {
        project.classList.remove('christmas-mode');
    });
    const h1 = document.querySelector('h1');
    h1.classList.remove('christmas-mode');
    const projectDetail = document.querySelector('.project-detail');
    if (projectDetail) {
        projectDetail.classList.remove('christmas-mode');
    }

    stopFireworkLoop();
}

function activateChristmasModeIfApplicable() {
    const today = new Date();
    const startChristmas = new Date(today.getFullYear(), 11, 1); 
    const endChristmas = new Date(today.getFullYear() + 1, 0, 1); 

    if (today >= startChristmas && today < endChristmas) {
        enableChristmasMode(); 
        const buttonIcon = document.querySelector('.button-icon');
        if (buttonIcon) {
            buttonIcon.src = '../Sources/Images/palmier.png'; 
        }
    }
}

activateChristmasModeIfApplicable();
