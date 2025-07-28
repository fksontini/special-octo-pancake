import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState('{"NomProjet":"Demo"}');
  const [populateStatus, setPopulateStatus] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [replacements, setReplacements] = useState<Record<string, string>>({});

  const handlePopulate = async () => {
    if (!file) {
      setPopulateStatus("Veuillez sélectionner un fichier PPTX");
      return;
    }
    setPopulateStatus("Envoi en cours...");
    setIsUploading(true);
    setUploadProgress(0);
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
        {
          onUploadProgress: (event) => {
            if (event.total) {
              setUploadProgress(Math.round((event.loaded * 100) / event.total));
            }
          },
        }
      );
      setReplacements(response.data.replacements || {});

      const byteCharacters = atob(response.data.file);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
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
      setIsUploading(false);
    } catch (err: any) {
      setPopulateStatus("Erreur: " + err.message);
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial, sans-serif" }}>

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
      {isUploading && (
        <div style={{ display: "flex", alignItems: "center", marginTop: "1rem" }}>
          <div
            style={{
              border: "4px solid rgba(0,0,0,0.1)",
              width: 24,
              height: 24,
              borderRadius: "50%",
              borderTopColor: "#333",
              animation: "spin 1s linear infinite",
              marginRight: "0.5rem",
            }}
          />
          <progress value={uploadProgress} max={100} style={{ width: "100%" }} />
        </div>
      )}

      {Object.keys(replacements).length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Balises détectées</h3>
          <ul>
            {Object.entries(replacements).map(([k, v]) => (
              <li key={k}>
                {k}: {v}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <a href="/api-docs.html" target="_blank" rel="noopener">
          📑 Documentation API
        </a>
      </div>
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
