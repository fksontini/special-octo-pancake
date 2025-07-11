import { NextApiRequest, NextApiResponse } from "next";
import JSZip from "jszip";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { pptxBase64, values } = req.body as {
      pptxBase64: string;
      values: Record<string, string>;
    };

    if (!pptxBase64 || !values) {
      res.status(400).json({ error: "pptxBase64 and values are required" });
      return;
    }

    const buffer = Buffer.from(pptxBase64, "base64");
    const zip = await JSZip.loadAsync(buffer);

    const slideRegex = /^ppt\/slides\/slide\d+\.xml$/;
    const files = Object.keys(zip.files).filter((name) => slideRegex.test(name));

    const xmlEscape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&apos;");

    const replaceInTextTags = (
      xml: string,
      target: string,
      replacement: string
    ) =>
      xml.replace(/(<a:t[^>]*>)([\s\S]*?)(<\/a:t>)/g, (match, open, text, close) => {
        const replaced = text.split(target).join(replacement);
        return open + replaced + close;
      });

    for (const name of files) {
      const file = zip.file(name);
      if (!file) continue;
      let content = await file.async("string");
      for (const [key, value] of Object.entries(values)) {
        const placeholder = `<<[${key}]>>`;
        const encoded = placeholder.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const escaped = xmlEscape(value);
        content = replaceInTextTags(content, placeholder, escaped);
        content = replaceInTextTags(content, encoded, escaped);
        content = replaceInTextTags(content, `'${placeholder}'`, escaped);
        content = replaceInTextTags(content, `'${encoded}'`, escaped);
      }
      zip.file(name, content);
    }

    const newBuffer = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=modified.pptx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.send(newBuffer);
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};
