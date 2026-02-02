import { NextRequest, NextResponse } from 'next/server';
import { dbAdapter } from '@/lib/database-adapter';
import {
  parseExcel,
  parseCsv,
  parseTsv,
  getParserForFilename,
  validateFileSize,
  mapToPatientRecords,
  type ParseResult,
} from '@/lib/file-parser';

const DEPARTMENTS = ['opd', 'ipd', 'laboratory', 'pharmacy', 'rch', 'theatre', 'mortuary'] as const;

function getFileType(filename: string): 'excel' | 'csv' | 'tsv' {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  if (ext === 'csv') return 'csv';
  return 'tsv';
}

export async function POST(request: NextRequest) {
  try {
    await dbAdapter.initialize();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const department = formData.get('department') as string;
    const name = (formData.get('name') as string) || null;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file || !uploadedBy) {
      return NextResponse.json(
        { success: false, message: 'Missing file or uploadedBy' },
        { status: 400 }
      );
    }

    if (!department || !DEPARTMENTS.includes(department as typeof DEPARTMENTS[number])) {
      return NextResponse.json(
        { success: false, message: 'Valid department is required (opd, ipd, laboratory, pharmacy, rch, theatre, mortuary)' },
        { status: 400 }
      );
    }

    const sizeCheck = validateFileSize(file.size);
    if (!sizeCheck.ok) {
      return NextResponse.json({ success: false, message: sizeCheck.message }, { status: 400 });
    }

    const filename = file.name || 'upload';
    const parser = getParserForFilename(filename);
    if (!parser) {
      return NextResponse.json(
        { success: false, message: 'Unsupported file type. Use .xlsx, .xls, .csv, or .tsv' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsed: ParseResult;
    try {
      parsed = parser(buffer);
    } catch (err) {
      console.error('Parse error:', err);
      return NextResponse.json(
        { success: false, message: 'Failed to parse file. Check format and encoding.' },
        { status: 400 }
      );
    }

    if (parsed.recordCount === 0) {
      return NextResponse.json(
        { success: false, message: 'No data rows found in file' },
        { status: 400 }
      );
    }

    const datasetName = name || filename.replace(/\.[^.]+$/, '');
    const fileType = getFileType(filename);

    const dataset = await dbAdapter.createDataset({
      name: datasetName,
      description: `Imported from ${filename}`,
      department: department as typeof DEPARTMENTS[number],
      fileType,
      uploadedBy,
      rowCount: parsed.recordCount,
      columns: parsed.columns,
      isProcessed: true,
      tags: [],
    });

    const records = mapToPatientRecords(parsed.rows, parsed.columns, dataset.id);
    if (records.length > 0) {
      await dbAdapter.addPatientRecords(records);
    }

    return NextResponse.json({
      success: true,
      dataset: {
        ...dataset,
        uploadedAt: dataset.uploadedAt.toISOString(),
        columns: dataset.columns,
        tags: dataset.tags,
      },
      recordCount: records.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'Upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
