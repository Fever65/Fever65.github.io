// Configuration Firebase réelle
const firebaseConfig = {
  apiKey: "AIzaSyAnCbwTydX5qbCehChMqB0c0PItyddWmRo",
  authDomain: "micromemo-b0801.firebaseapp.com",
  projectId: "micromemo-b0801",
  storageBucket: "micromemo-b0801.firebasestorage.app",
  messagingSenderId: "133159759161",
  appId: "1:133159759161:web:d42d05317b7d008101cce8",
  measurementId: "G-WHX1HPR9EN"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();