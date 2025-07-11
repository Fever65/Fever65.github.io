const songs = [
  { title: "En avant", image: "1.png", audio: "1 - En avant.flac" },
  { title: "Pas à Pas", image: "2.png", audio: "2 - Pas à Pas.flac" },
  { title: "Madame", image: "3.png", audio: "3 - Madame.flac" },
  { title: "L'amour", image: "4.png", audio: "4 - L'amour.flac" },
  { title: "Ma soeur", image: "5.png", audio: "5 - Ma sœur.flac" },
  { title: "The universe", image: "6.png", audio: "6 - The universe.flac" },
  { title: "理由の自由", image: "7.png", audio: "7 - 理由の自由.flac" },
  { title: "When the world falls", image: "8.png", audio: "8 - When the world falls.flac" },
  { title: "Jérôme", image: "10.png", audio: "10 - Jérôme.flac" },
  { title: "Circus", image: "11.png", audio: "11 - Circus.flac" },
  { title: "Sourire Na Ngaï", image: "12.png", audio: "12 - Sourire Na Ngaï.flac" },
  { title: "Dounia Faran", image: "13.png", audio: "13 - Dounia Faran.flac" },
  { title: "The rainy door", image: "14.png", audio: "14 - The rainy door.flac" },
  { title: "头撞墙", image: "15.png", audio: "15 - 头撞墙 (Wall Breaker).flac" },
  { title: "Крабы и любовь", image: "16.png", audio: "16 - Крабы и любовь.flac" },
  { title: "Merci à vous", image: "17.png", audio: "17 - Merci à vous.flac" },
];

let firstLoading = true;
let currentSongIndex = 0;
let isRandom = false; // mode random activé ou non
let shuffleQueue = []; // liste des indices restants à jouer en mode random
let shuffleHistory = []; // historique pour le bouton précédent en mode random

const cardWrapper = document.querySelector(".card-wrapper");
const audio = new Audio();
const currentTrackImage = document.getElementById("current-img");
const currentTrackTitle = document.getElementById("current-title");
const playPauseButton = document.getElementById("play-pause");
const timeSlider = document.getElementById("time-slider");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const currentTimeLabel = document.getElementById("current-time");
const totalTimeLabel = document.getElementById("total-time");
const audioSelector = document.getElementById("audio-slider");
const randomButton = document.getElementById("random");

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

function updatePlayer(index) {
  const song = songs[index];
  audio.src = song.audio;
  currentTrackImage.src = song.image;
  currentTrackTitle.textContent = song.title;
  if (!firstLoading) {
    audio.play();
    playPauseButton.textContent = "⏸️";
  } else {
    audio.volume = 0.3;
    audioSelector.value = audio.volume * 100;
  }
}

// Génère une file de lecture random sans répéter la chanson en cours
function generateShuffleQueue() {
  let indices = songs.map((_, i) => i).filter(i => i !== currentSongIndex);
  // Fisher-Yates pour mélanger
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  shuffleQueue = indices;
  shuffleHistory = [];
}

playPauseButton.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playPauseButton.textContent = "⏸️";
  } else {
    audio.pause();
    playPauseButton.textContent = "▶️";
  }
});

nextButton.addEventListener("click", () => {
  if (isRandom) {
    if (shuffleQueue.length === 0) generateShuffleQueue();
    shuffleHistory.push(currentSongIndex);
    currentSongIndex = shuffleQueue.shift();
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  updatePlayer(currentSongIndex);
});

prevButton.addEventListener("click", () => {
  if (isRandom) {
    if (shuffleHistory.length > 0) {
      // Remet la chanson courante dans la file pour la rejouer plus tard
      shuffleQueue.unshift(currentSongIndex);
      currentSongIndex = shuffleHistory.pop();
    }
  } else {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  }
  updatePlayer(currentSongIndex);
});

// Bascule le mode random et génère la file de lecture
randomButton.addEventListener("click", () => {
  isRandom = !isRandom;
  randomButton.style.color = isRandom ? "red" : "";
  if (isRandom) {
    generateShuffleQueue();
    // Optionnel : jouer immédiatement une musique aléatoire
    shuffleHistory.push(currentSongIndex);
    currentSongIndex = shuffleQueue.shift();
    updatePlayer(currentSongIndex);
  }
});

audio.addEventListener("ended", function () {
  if (isRandom) {
    if (shuffleQueue.length === 0) generateShuffleQueue();
    shuffleHistory.push(currentSongIndex);
    currentSongIndex = shuffleQueue.shift();
  } else {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
  }
  updatePlayer(currentSongIndex);
});

audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    currentTimeLabel.textContent = formatTime(audio.currentTime);
    totalTimeLabel.textContent = formatTime(audio.duration);
    timeSlider.value = (audio.currentTime / audio.duration) * 100;
  }
});

timeSlider.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (timeSlider.value / 100) * audio.duration;
  }
});

audioSelector.addEventListener("input", function () {
  audio.volume = audioSelector.value / 100;
});

songs.forEach((song, index) => {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <img src="${song.image}" alt="${song.title}">
    <h2>${song.title}</h2>
  `;
  card.addEventListener("click", () => {
    currentSongIndex = index;
    updatePlayer(index);
    if (isRandom) {
      generateShuffleQueue();
    }
  });
  cardWrapper.appendChild(card);
});

updatePlayer(currentSongIndex);

document.addEventListener("DOMContentLoaded", function () {
  firstLoading = false;
});

const infoButton = document.getElementById("info-button");
const infoWindow = document.getElementById("info-window");
const closeInfoButton = document.getElementById("close-info");
const infoText = document.getElementById("info-text");

function showInfoWindow(text) {
  infoText.textContent = text;
  infoWindow.classList.remove("hidden");
}

function hideInfoWindow() {
  infoWindow.classList.add("hidden");
}

infoButton.addEventListener("click", () => {
  showInfoWindow("J’ai écrit cet album en collaboration avec ChatGPT. Les instrumentales et les voix des chanteurs ont été générées grâce à l’IA SUNO, et les pochettes ont été créées avec MIDJOURNEY. J’espère que ce projet te plaira. Bonne écoute !");
});

closeInfoButton.addEventListener("click", hideInfoWindow);