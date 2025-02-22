const songs = [
  // Fragments
  { title: "En avant", image: "../Fragments/1.png", audio: "../Fragments/1 - En avant.flac" },
  { title: "Pas à Pas", image: "../Fragments/2.png", audio: "../Fragments/2 - Pas à Pas.flac" },
  { title: "Madame", image: "../Fragments/3.png", audio: "../Fragments/3 - Madame.flac" },
  { title: "L'amour", image: "../Fragments/4.png", audio: "../Fragments/4 - L'amour.flac" },
  { title: "Ma soeur", image: "../Fragments/5.png", audio: "../Fragments/5 - Ma sœur.flac" },
  { title: "The universe", image: "../Fragments/6.png", audio: "../Fragments/6 - The universe.flac" },
  { title: "理由の自由", image: "../Fragments/7.png", audio: "../Fragments/7 - 理由の自由.flac" },
  { title: "When the world falls", image: "../Fragments/8.png", audio: "../Fragments/8 - When the world falls.flac" },
  { title: "Jérôme (Option 1)", image: "../Fragments/9.png", audio: "../Fragments/9 - Jérôme (Option 1).flac" },
  { title: "Jérôme (Option 2)", image: "../Fragments/10.png", audio: "../Fragments/10 - Jérôme (Option 2).flac" },
  { title: "Circus", image: "../Fragments/11.png", audio: "../Fragments/11 - Circus.flac" },
  { title: "Sourire Na Ngaï", image: "../Fragments/12.png", audio: "../Fragments/12 - Sourire Na Ngaï.flac" },
  { title: "Dounia Faran", image: "../Fragments/13.png", audio: "../Fragments/13 - Dounia Faran.flac" },
  { title: "The rainy door", image: "../Fragments/14.png", audio: "../Fragments/14 - The rainy door.flac" },
  { title: "头撞墙", image: "../Fragments/15.png", audio: "../Fragments/15 - 头撞墙 (Wall Breaker).flac" },
  { title: "Крабы и любовь", image: "../Fragments/16.png", audio: "../Fragments/16 - Крабы и любовь.flac" },
  { title: "Merci à vous", image: "../Fragments/17.png", audio: "../Fragments/17 - Merci à vous.flac" },

  // Ocean
  { title: "Journey", image: "../Ocean/1.png", audio: "../Ocean/Journey.flac" },
  { title: "Nostalgic house", image: "../Ocean/2.png", audio: "../Ocean/Nostalgic house.flac" },
  { title: "トルネード", image: "../Ocean/3.png", audio: "../Ocean/トルネード.flac" },
  { title: "Ocean love", image: "../Ocean/4.png", audio: "../Ocean/Ocean love.flac" },
  { title: "Sous les étoiles", image: "../Ocean/5.png", audio: "../Ocean/Sous les étoiles.flac" },
  { title: "Another crab lullaby", image: "../Ocean/6.png", audio: "../Ocean/Another crab lullaby.flac" },
  { title: "Terra firma", image: "../Ocean/7.png", audio: "../Ocean/Terra firma.flac" },

  // 203
  { title: "Bienvenue", image: "../203/Bienvenue.png", audio: "../203/Bienvenue.flac" },
  { title: "Rencontres", image: "../203/rencontres.png", audio: "../203/Rencontres.flac" },
  { title: "Deux âmes", image: "../203/deux âmes.png", audio: "../203/Deux âmes.flac" },
  { title: "J'aime tout de toi", image: "../203/J'aime tout de toi.png", audio: "../203/J'aime tout de toi.flac" },
  { title: "Boude po", image: "../203/Boude po.png", audio: "../203/Boude po.flac" },
  { title: "Солнце и отдых", image: "../203/Солнце и отдых.png", audio: "../203/Солнце и отдых.flac" },
  { title: "Claques", image: "../203/Claques.png", audio: "../203/Claques.flac" },
  { title: "Corruption", image: "../203/Corruption.png", audio: "../203/Corruption.flac" },
  { title: "Timmy", image: "../203/timmy.png", audio: "../203/Timmy.flac" },
  { title: "Jamais m'arrêter", image: "../203/jamais m'arrêter.png", audio: "../203/Jamais m'arrêter.flac" },
  { title: "Phare", image: "../203/phare.png", audio: "../203/Phare.flac" },
  { title: "Je ne veux pas t'oublier", image: "../203/je ne veux pas t'oublier.png", audio: "../203/Je ne veux pas t'oublier.flac" },
  { title: "Dernier souffle", image: "../203/Dernier souffle.png", audio: "../203/Dernier souffle.flac" },
  { title: "CV", image: "../203/CV.png", audio: "../203/CV.flac" },
  { title: "Tournée générale XXL", image: "../203/Tournée générale XXL.png", audio: "../203/Tournée générale XXL.flac" },
  { title: "A+", image: "../203/A+.png", audio: "../203/A+.flac" },

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

// Création de la liste des chansons sans images
songs.forEach((song, index) => {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `<h2>${song.title}</h2>`;
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

audioSelector.addEventListener("input", () => {
  audio.volume = audioSelector.value / 100;
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
