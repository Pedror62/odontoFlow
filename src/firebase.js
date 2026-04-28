import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Cole aqui os dados que você copiou do console do Firebase
const firebaseConfig = {
   apiKey: "AIzaSyBnn9sfg_6Fo8rX922PyCWC17scIEKvsEE",
  authDomain: "odontoflow-e4557.firebaseapp.com",
  projectId: "odontoflow-e4557",
  storageBucket: "odontoflow-e4557.firebasestorage.app",
  messagingSenderId: "512672222097",
  appId: "1:512672222097:web:bc5dd921e372a7e6f9e830",
  measurementId: "G-RMLCB0767F"
};

const app = initializeApp(firebaseConfig);

// Exportamos o banco de dados (db) e a autenticação (auth) para usar no App
export const db = getFirestore(app);
export const auth = getAuth(app);

