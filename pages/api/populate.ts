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

    const escapeRegex = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const replaceAcrossTags = (
      xml: string,
      target: string,
      replacement: string
    ): { xml: string; matched: boolean } => {
      const pattern = target
        .split("")
        .map((c) => `${escapeRegex(c)}(?:\\s*<[^>]+>\\s*)*`)
        .join("");
      const regex = new RegExp(pattern, "g");
      const matched = regex.test(xml);
      if (!matched) return { xml, matched };
      regex.lastIndex = 0;
      return { xml: xml.replace(regex, replacement), matched };
    };

    const foundKeys = new Set<string>();

    for (const name of files) {
      const file = zip.file(name);
      if (!file) continue;
      let content = await file.async("string");
      for (const [key, value] of Object.entries(values)) {
        const placeholder = `{{${key}}}`;
        const encoded = placeholder; // curly braces don't require XML encoding
        const escaped = xmlEscape(value);

        let result = replaceAcrossTags(content, placeholder, escaped);
        content = result.xml;
        if (result.matched) foundKeys.add(key);

        result = replaceAcrossTags(content, encoded, escaped);
        content = result.xml;
        if (result.matched) foundKeys.add(key);

        result = replaceAcrossTags(content, `'${placeholder}'`, escaped);
        content = result.xml;
        if (result.matched) foundKeys.add(key);

        result = replaceAcrossTags(content, `'${encoded}'`, escaped);
        content = result.xml;
        if (result.matched) foundKeys.add(key);
      }
      zip.file(name, content);
    }

    const replacements: Record<string, string> = {};
    for (const key of Array.from(foundKeys)) {
      replacements[key] = values[key];
    }

    const newBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const file = newBuffer.toString("base64");
    console.log("Replacements:", replacements);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ file, replacements });
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
