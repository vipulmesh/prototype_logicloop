import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    const isPDF = file.type === 'application/pdf';
    const isDOCX = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPDF && !isDOCX) {
      return NextResponse.json(
        { error: 'Only PDF and DOCX files are supported' },
        { status: 400 },
      );
    }

    // 5 MB limit
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be under 5 MB' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let text = '';
    let pages = 1; // Default for DOCX

    if (isPDF) {
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = (pdfParseModule as any).default || pdfParseModule;
      const parsed = await pdfParse(buffer);
      text = parsed.text?.trim();
      pages = parsed.numpages;
    } else if (isDOCX) {
      const mammothModule = await import('mammoth');
      const mammoth = (mammothModule as any).default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      text = result.value?.trim();
    }

    if (!text || text.length < 50) {
      return NextResponse.json(
        { error: 'Could not extract meaningful text from the file. The file may be image-based or empty.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text,
      pages,
      characters: text.length,
    });
  } catch (error) {
    console.error('File extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to process the uploaded file' },
      { status: 500 },
    );
  }
}
