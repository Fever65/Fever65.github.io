function toggleImage(event) {
    event.stopPropagation();
    const image = document.getElementById('clickable-image');
    const overlay = document.getElementById('blur-overlay');
    image.classList.toggle('expanded');
    overlay.classList.toggle('active');
}

function closeImageIfExpanded(event) {
    const image = document.getElementById('clickable-image');
    const overlay = document.getElementById('blur-overlay');
    if (image.classList.contains('expanded')) {
        image.classList.remove('expanded');
        overlay.classList.remove('active');
    }
}

document.addEventListener('click', closeImageIfExpanded);
