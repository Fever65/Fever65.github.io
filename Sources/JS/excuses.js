let isTyping = false; 
let excuses = null; 

async function loadExcuses() {
    if (!excuses) { 
        try {
            const response = await fetch('../Sources/JSON/Excuses.json'); 
            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }
            excuses = await response.json(); 
        } catch (error) {
            console.error("Erreur lors du chargement des excuses :", error);
            excuses = {
                serieuse: [],
                drole: []
            }; 
        }
    }
    return excuses;
}

function displayExcuseWithAnimation(excuse) {
    if (isTyping) return; 
    isTyping = true;

    const display = document.getElementById("excuseDisplay");
    display.textContent = ""; 
    let i = 0;

    function typeWriter() {
        if (i < excuse.length) {
            display.textContent += excuse.charAt(i); 
            i++;
            setTimeout(typeWriter, 15); 
        } else {
            isTyping = false; 
        }
    }

    typeWriter();
}

async function generateExcuse(category) {
    const excuses = await loadExcuses();

    let selectedExcuse;

    if (category === "aleatoire") {
        const combinedExcuses = [...excuses.serieuse, ...excuses.drole];
        const randomIndex = Math.floor(Math.random() * combinedExcuses.length);
        selectedExcuse = combinedExcuses[randomIndex];
    } else if (excuses[category]) {
        const randomIndex = Math.floor(Math.random() * excuses[category].length);
        selectedExcuse = excuses[category][randomIndex];
    } else {
        selectedExcuse = "Catégorie invalide.";
    }

    displayExcuseWithAnimation(selectedExcuse);
}
