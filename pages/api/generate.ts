import { NextApiRequest, NextApiResponse } from "next";
import PptxGenJS from "pptxgenjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { Nom, Date } = req.body;

  const pptx = new PptxGenJS();
  const slide = pptx.addSlide();
  slide.addText(`Bonjour ${Nom}`, { x: 1, y: 1, fontSize: 18 });
  slide.addText(`Votre RDV est prévu pour le ${Date}`, { x: 1, y: 2, fontSize: 14 });

  const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

  res.setHeader("Content-Disposition", "attachment; filename=generated.pptx");
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  res.send(buffer);
}
