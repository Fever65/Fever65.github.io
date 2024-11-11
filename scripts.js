
function showSection(id) {
    const sections = document.querySelectorAll('.container');
    sections.forEach(section => section.style.display = 'none');
    const targetSection = document.getElementById(id);
    if (targetSection) {
        targetSection.style.display = 'block';
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleOptions(id) {
    const options = document.getElementById(id);
    if (options.style.display === 'none' || options.style.display === '') {
        options.style.display = 'flex';
    } else {
        options.style.display = 'none';
    }
}

function changeTheme() {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    document.documentElement.style.setProperty('--main-bg-color', randomColor);
    document.documentElement.style.setProperty('--header-bg-color', randomColor);
    document.documentElement.style.setProperty('--frame-bg-color', randomColor);
}

function resetTheme() {
    document.documentElement.style.setProperty('--main-bg-color', '#1e1e1e');
    document.documentElement.style.setProperty('--header-bg-color', '#2b2b2b');
    document.documentElement.style.setProperty('--frame-bg-color', 'rgba(43, 43, 43, 0.8)');
    document.documentElement.style.setProperty('--text-color', '#f0f0f0');
    document.documentElement.style.setProperty('--accent-color', '#ffa07a');
}

function setLightTheme() {
    document.documentElement.style.setProperty('--main-bg-color', '#f0f0f0');
    document.documentElement.style.setProperty('--header-bg-color', '#ffffff');
    document.documentElement.style.setProperty('--frame-bg-color', '#ffffff');
    document.documentElement.style.setProperty('--text-color', '#1e1e1e');
    document.documentElement.style.setProperty('--accent-color', '#ffa07a');
}

function setRandomFont() {
    const fonts = ['Arial', 'Verdana', 'Tahoma', 'Georgia', 'Times New Roman', 'Courier New'];
    const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
    document.body.style.fontFamily = randomFont;
}

function resetFont() {
    document.body.style.fontFamily = 'Roboto, sans-serif';
}
