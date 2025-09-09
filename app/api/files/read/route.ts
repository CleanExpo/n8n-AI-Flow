import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';

// Allowed base paths
const SAFE_BASE_PATHS = [
  process.env.USER_DOCUMENTS_PATH || path.join(process.cwd(), 'user-documents'),
  process.env.SHARED_DOCUMENTS_PATH || path.join(process.cwd(), 'shared-documents'),
  path.join(process.cwd(), 'public', 'uploads'),
];

function isPathSafe(requestedPath: string): boolean {
  const normalizedPath = path.normalize(requestedPath);
  return SAFE_BASE_PATHS.some(basePath => 
    normalizedPath.startsWith(path.normalize(basePath))
  );
}

async function readTextFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

async function readPDFFile(filePath: string): Promise<string> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF reading error:', error);
    return 'Unable to extract text from PDF';
  }
}

async function readWordFile(filePath: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Word document reading error:', error);
    return 'Unable to extract text from Word document';
  }
}

async function readExcelFile(filePath: string): Promise<any> {
  try {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    const sheets: Record<string, any[]> = {};
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    });
    
    return {
      type: 'spreadsheet',
      sheets,
      sheetNames: workbook.SheetNames,
      text: JSON.stringify(sheets, null, 2)
    };
  } catch (error) {
    console.error('Excel reading error:', error);
    return { type: 'spreadsheet', text: 'Unable to read Excel file', sheets: {} };
  }
}

async function readCSVFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim()) || [];
    const rows = lines.slice(1).map(line => 
      line.split(',').map(cell => cell.trim())
    );
    
    return {
      type: 'csv',
      headers,
      rows,
      text: content,
      rowCount: rows.length
    };
  } catch (error) {
    console.error('CSV reading error:', error);
    return { type: 'csv', text: 'Unable to read CSV file', headers: [], rows: [] };
  }
}

async function readJSONFile(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      type: 'json',
      data,
      text: content,
      structure: analyzeJSONStructure(data)
    };
  } catch (error) {
    console.error('JSON reading error:', error);
    const content = await fs.readFile(filePath, 'utf-8');
    return { type: 'json', text: content, error: 'Invalid JSON format' };
  }
}

function analyzeJSONStructure(obj: any, prefix = ''): string[] {
  const structure: string[] = [];
  
  if (Array.isArray(obj)) {
    structure.push(`${prefix}[]`);
    if (obj.length > 0) {
      structure.push(...analyzeJSONStructure(obj[0], `${prefix}[0]`));
    }
  } else if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      const keyPath = prefix ? `${prefix}.${key}` : key;
      
      if (Array.isArray(value)) {
        structure.push(`${keyPath}[]`);
        if (value.length > 0) {
          structure.push(...analyzeJSONStructure(value[0], `${keyPath}[0]`));
        }
      } else if (value && typeof value === 'object') {
        structure.push(keyPath);
        structure.push(...analyzeJSONStructure(value, keyPath));
      } else {
        structure.push(`${keyPath}: ${typeof value}`);
      }
    });
  }
  
  return structure;
}

async function readCodeFile(filePath: string): Promise<any> {
  const content = await fs.readFile(filePath, 'utf-8');
  const extension = path.extname(filePath).slice(1).toLowerCase();
  
  // Extract functions, classes, imports
  const analysis: any = {
    type: 'code',
    language: extension,
    text: content,
    functions: [],
    classes: [],
    imports: [],
    exports: [],
    comments: []
  };
  
  // JavaScript/TypeScript analysis
  if (['js', 'ts', 'jsx', 'tsx'].includes(extension)) {
    // Find function declarations
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g;
    const arrowFunctionRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }
    while ((match = arrowFunctionRegex.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }
    
    // Find classes
    const classRegex = /(?:export\s+)?class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }
    
    // Find imports
    const importRegex = /import\s+(?:{[^}]+}|[\w*]+)\s+from\s+['"]([^'"]+)['"]/g;
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1]);
    }
    
    // Find exports
    const exportRegex = /export\s+(?:default\s+)?(?:{[^}]+}|[\w*]+)/g;
    while ((match = exportRegex.exec(content)) !== null) {
      analysis.exports.push(match[0]);
    }
  }
  
  // Python analysis
  if (extension === 'py') {
    const functionRegex = /def\s+(\w+)\s*\(/g;
    const classRegex = /class\s+(\w+)/g;
    const importRegex = /(?:from\s+[\w.]+\s+)?import\s+([^\n]+)/g;
    
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      analysis.functions.push(match[1]);
    }
    while ((match = classRegex.exec(content)) !== null) {
      analysis.classes.push(match[1]);
    }
    while ((match = importRegex.exec(content)) !== null) {
      analysis.imports.push(match[1].trim());
    }
  }
  
  return analysis;
}

async function readImageFile(filePath: string): Promise<any> {
  try {
    const buffer = await fs.readFile(filePath);
    const base64 = buffer.toString('base64');
    const extension = path.extname(filePath).slice(1).toLowerCase();
    const mimeType = `image/${extension === 'svg' ? 'svg+xml' : extension}`;
    
    return {
      type: 'image',
      dataUrl: `data:${mimeType};base64,${base64}`,
      mimeType,
      size: buffer.length,
      text: `[Image: ${path.basename(filePath)}]`
    };
  } catch (error) {
    console.error('Image reading error:', error);
    return { type: 'image', text: 'Unable to read image file' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filePath } = await request.json();

    if (!filePath || !isPathSafe(filePath)) {
      return NextResponse.json(
        { error: 'Invalid or unsafe file path' },
        { status: 403 }
      );
    }

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Path is a directory, not a file' },
        { status: 400 }
      );
    }

    const extension = path.extname(filePath).slice(1).toLowerCase();
    let content: any;

    // Read file based on type
    switch (extension) {
      case 'txt':
      case 'md':
      case 'log':
        content = await readTextFile(filePath);
        break;
        
      case 'pdf':
        content = await readPDFFile(filePath);
        break;
        
      case 'doc':
      case 'docx':
        content = await readWordFile(filePath);
        break;
        
      case 'xls':
      case 'xlsx':
        content = await readExcelFile(filePath);
        break;
        
      case 'csv':
        content = await readCSVFile(filePath);
        break;
        
      case 'json':
        content = await readJSONFile(filePath);
        break;
        
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
      case 'cs':
      case 'php':
      case 'rb':
      case 'go':
      case 'rs':
      case 'sql':
      case 'html':
      case 'css':
      case 'xml':
      case 'yaml':
      case 'yml':
        content = await readCodeFile(filePath);
        break;
        
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        content = await readImageFile(filePath);
        break;
        
      default:
        // Try to read as text
        try {
          content = await readTextFile(filePath);
        } catch {
          return NextResponse.json(
            { error: `Unsupported file type: ${extension}` },
            { status: 415 }
          );
        }
    }

    const result = {
      fileName: path.basename(filePath),
      filePath,
      extension,
      size: stats.size,
      lastModified: stats.mtime,
      content: typeof content === 'string' ? { type: 'text', text: content } : content
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('File reading error:', error);
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    );
  }
}