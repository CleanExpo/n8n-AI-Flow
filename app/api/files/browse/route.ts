import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import { stat } from 'fs/promises';

interface FileItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  lastModified?: Date;
  extension?: string;
  mimeType?: string;
}

// Define safe base paths for file browsing
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

function getMimeType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'rtf': 'application/rtf',
    
    // Spreadsheets
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'webp': 'image/webp',
    
    // Code
    'js': 'text/javascript',
    'ts': 'text/typescript',
    'jsx': 'text/javascript',
    'tsx': 'text/typescript',
    'json': 'application/json',
    'html': 'text/html',
    'css': 'text/css',
    'py': 'text/x-python',
    'java': 'text/x-java',
    'cpp': 'text/x-c++',
    'c': 'text/x-c',
    'cs': 'text/x-csharp',
    'php': 'text/x-php',
    'rb': 'text/x-ruby',
    'go': 'text/x-go',
    'rs': 'text/x-rust',
    'sql': 'application/sql',
    'xml': 'application/xml',
    'yaml': 'application/yaml',
    'yml': 'application/yaml',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };
  
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedPath = searchParams.get('path') || SAFE_BASE_PATHS[0];
    const showHidden = searchParams.get('showHidden') === 'true';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validate path safety
    if (!isPathSafe(requestedPath)) {
      return NextResponse.json(
        { error: 'Access denied to requested path' },
        { status: 403 }
      );
    }

    // Ensure the directory exists
    try {
      await fs.access(requestedPath);
    } catch {
      // Create directory if it doesn't exist (only for safe paths)
      await fs.mkdir(requestedPath, { recursive: true });
    }

    // Read directory contents
    const items = await fs.readdir(requestedPath, { withFileTypes: true });
    
    const fileItems: FileItem[] = await Promise.all(
      items
        .filter(item => showHidden || !item.name.startsWith('.'))
        .map(async (item) => {
          const itemPath = path.join(requestedPath, item.name);
          const stats = await stat(itemPath);
          const extension = item.isFile() 
            ? path.extname(item.name).slice(1).toLowerCase() 
            : undefined;

          return {
            id: `${itemPath}_${stats.mtime.getTime()}`,
            name: item.name,
            path: itemPath,
            type: item.isDirectory() ? 'directory' : 'file',
            size: item.isFile() ? stats.size : undefined,
            lastModified: stats.mtime,
            extension,
            mimeType: extension ? getMimeType(extension) : undefined,
          };
        })
    );

    // Sort items
    fileItems.sort((a, b) => {
      // Directories first
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }

      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'lastModified':
          comparison = (a.lastModified?.getTime() || 0) - (b.lastModified?.getTime() || 0);
          break;
        case 'type':
          comparison = (a.extension || '').localeCompare(b.extension || '');
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Get parent directory
    const parentPath = path.dirname(requestedPath);
    const hasParent = isPathSafe(parentPath) && parentPath !== requestedPath;

    return NextResponse.json({
      currentPath: requestedPath,
      parentPath: hasParent ? parentPath : null,
      items: fileItems,
      totalItems: fileItems.length,
      basePaths: SAFE_BASE_PATHS,
    });
  } catch (error) {
    console.error('File browsing error:', error);
    return NextResponse.json(
      { error: 'Failed to browse files' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, path: targetPath, newName } = await request.json();

    if (!isPathSafe(targetPath)) {
      return NextResponse.json(
        { error: 'Access denied to requested path' },
        { status: 403 }
      );
    }

    switch (action) {
      case 'createFolder':
        await fs.mkdir(targetPath, { recursive: true });
        return NextResponse.json({ 
          success: true, 
          message: 'Folder created successfully' 
        });

      case 'rename':
        if (!newName) {
          return NextResponse.json(
            { error: 'New name is required' },
            { status: 400 }
          );
        }
        const newPath = path.join(path.dirname(targetPath), newName);
        if (!isPathSafe(newPath)) {
          return NextResponse.json(
            { error: 'Invalid new path' },
            { status: 403 }
          );
        }
        await fs.rename(targetPath, newPath);
        return NextResponse.json({ 
          success: true, 
          message: 'Renamed successfully',
          newPath 
        });

      case 'delete':
        const stats = await stat(targetPath);
        if (stats.isDirectory()) {
          await fs.rmdir(targetPath, { recursive: true });
        } else {
          await fs.unlink(targetPath);
        }
        return NextResponse.json({ 
          success: true, 
          message: 'Deleted successfully' 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('File operation error:', error);
    return NextResponse.json(
      { error: 'File operation failed' },
      { status: 500 }
    );
  }
}