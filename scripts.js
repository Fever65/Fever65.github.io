
async function loadPage(pageKey) {
    const response = await fetch('pages.json');
    const pages = await response.json();
    const contentDiv = document.getElementById('content');
    contentDiv.innerHTML = pages[pageKey] || '<p>Page not found</p>';
}

document.addEventListener('DOMContentLoaded', () => {
    loadPage('home'); // Charger une page par défaut si nécessaire
});
