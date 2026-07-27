import { NextRequest, NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import mammoth from "mammoth";
import db from "@/lib/db";
import { extractText } from "unpdf";


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check file signature
    const type = await fileTypeFromBuffer(buffer);
    let extractedText = "";
    let fileType = "";

    if (type?.mime === "application/pdf" || file.name.endsWith(".pdf")) {
      fileType = "pdf";
      const uint8 = new Uint8Array(buffer);
      const { text } = await extractText(uint8);
      extractedText = Array.isArray(text) ? text.join("\n") : (text || "");
    } else if (
      type?.mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      fileType = "docx";
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF or DOCX." }, { status: 400 });
    }

    // Since we don't have a topic yet, we can store it in uploaded_files with topic_id=0 for now, 
    // or just let it be temporary. The schema requires topic_id, let's create a dummy topic or allow null.
    // Actually, looking at the schema, topic_id is NOT NULL. 
    // Let's modify the uploaded_files table to allow null topic_id initially, then update it.
    
    // For now, let's just insert it with topic_id = -1 (a dummy topic)
    const insertTopic = db.prepare("INSERT OR IGNORE INTO topics (id, slug, display_name) VALUES (-1, 'dummy', 'Dummy')");
    insertTopic.run();

    const stmt = db.prepare("INSERT INTO uploaded_files (topic_id, original_filename, file_type, extracted_text) VALUES (?, ?, ?, ?)");
    const info = stmt.run(-1, file.name, fileType, extractedText);

    return NextResponse.json({ fileId: info.lastInsertRowid });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
