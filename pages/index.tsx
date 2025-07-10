import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [nom, setNom] = useState("Firas");
  const [date, setDate] = useState("10/07/2025");
  const [status, setStatus] = useState("");

  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('{"NomProjet":"Demo"}');
  const [populateStatus, setPopulateStatus] = useState("");

  const handleGenerate = async () => {
    setStatus("Génération en cours...");
    const response = await axios.post(
      "/api/generate",
      { Nom: nom, Date: date },
      { responseType: "blob" }
    );
    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "generated.pptx");
    document.body.appendChild(link);
    link.click();
    link.remove();
    setStatus("Fichier généré !");
  };

  const handlePopulate = async () => {
    if (!file) {
      setPopulateStatus("Veuillez sélectionner un fichier PPTX");
      return;
    }
    setPopulateStatus("Envoi en cours...");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      const values = JSON.parse(jsonText);
      const response = await axios.post(
        "/api/populate",
        { pptxBase64: base64, values },
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modified.pptx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setPopulateStatus("Fichier modifié téléchargé !");
    } catch (err: any) {
      setPopulateStatus("Erreur: " + err.message);
    }
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
      <button onClick={handleGenerate} style={{ padding: "0.5rem 1rem" }}>
        Générer PPTX
      </button>
      <p>{status}</p>

      <hr style={{ margin: "2rem 0" }} />

      <h2>📥 Remplir un PPTX existant</h2>
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="file"
          accept=".pptx"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <textarea
          rows={4}
          cols={50}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
      </div>
      <button onClick={handlePopulate} style={{ padding: "0.5rem 1rem" }}>
        Envoyer
      </button>
      <p>{populateStatus}</p>

      <div style={{ marginTop: "2rem" }}>
        <a href="/api-docs.html" target="_blank" rel="noopener">
          📑 Documentation API
        </a>
      </div>
    </div>
  );
}
