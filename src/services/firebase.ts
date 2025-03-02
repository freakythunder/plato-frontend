// src/services/firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCnx2cXN56FwY9ubl9AI2nl3TWKz9msBmg",
  authDomain: "plato-education-71e05.firebaseapp.com",
  projectId: "plato-education-71e05",
  storageBucket: "plato-education-71e05.firebasestorage.app",
  messagingSenderId: "1009133999855",
  appId: "1:1009133999855:web:2ad580d196064ac3b9ed1a",
  measurementId: "G-YRGW55WJ9D"
};

const app = firebase.initializeApp(firebaseConfig);
export const auth = app.auth();
