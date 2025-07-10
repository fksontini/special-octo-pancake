import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [nom, setNom] = useState("Firas");
  const [date, setDate] = useState("10/07/2025");
  const [status, setStatus] = useState("");

  const handleGenerate = async () => {
    setStatus("Génération en cours...");
    const response = await axios.post("/api/generate", { Nom: nom, Date: date }, { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "generated.pptx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatus("Fichier généré !");
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>
      <h1>🧩 Générateur PowerPoint</h1>
      <div style={{ marginBottom: "1rem" }}>
        <label>Nom : </label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>Date : </label>
        <input value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button onClick={handleGenerate} style={{ padding: "0.5rem 1rem" }}>Générer PPTX</button>
      <p>{status}</p>
    </div>
  );
}