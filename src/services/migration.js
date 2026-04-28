import { db } from '../firebase'; // O ".." volta uma pasta para achar o firebase.js
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const importarDadosIniciais = async () => {
  try {
    console.log("🚀 Iniciando migração...");

    const agendaData = [
      { paciente: "isabel", procedimento: "limpeza", hora: "21:39", status: "Finalizado", data: "19/04/2026" },
      { paciente: "Emile", procedimento: "Clareamento", valor: 475, status: "Finalizado", data: "19/04/2026" },
      { paciente: "Bruna", procedimento: "Extração", valor: 350, status: "Finalizado", data: "19/04/2026" },
      { paciente: "Lucas", procedimento: "Extração", valor: 350, status: "Finalizado", data: "19/04/2026" },
      { paciente: "Henrique", procedimento: "Extração", valor: 350, status: "Finalizado", data: "19/04/2026" }
      // Você pode adicionar os outros aqui depois
    ];

    for (const item of agendaData) {
      await addDoc(collection(db, "agenda"), {
        ...item,
        createdAt: serverTimestamp()
      });
    }

    alert("✅ Dados migrados com sucesso para o Firebase!");
  } catch (e) {
    console.error("Erro:", e);
    alert("Erro na migração. Olhe o console.");
  }
};