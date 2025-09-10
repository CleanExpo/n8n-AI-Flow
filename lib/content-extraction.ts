import { FileItem } from '@/components/ai/EnhancedFileBrowser';
import * as XLSX from 'xlsx';
import * as Papa from 'papaparse';
import JSZip from 'jszip';

export interface ExtractedContent {
  text: string;
  metadata: Record<string, any>;
  structure?: any;
  images?: string[];
  tables?: any[][];
  charts?: any[];
  relationships?: any[];
  workflows?: any[];
  apis?: any[];
  dataSchema?: any;
}

export interface ContentExtractionOptions {
  includeImages?: boolean;
  includeMetadata?: boolean;
  parseStructure?: boolean;
  extractWorkflows?: boolean;
  ocrImages?: boolean;
  analyzeCode?: boolean;
}

export class ContentExtractor {
  private options: ContentExtractionOptions;

  constructor(options: ContentExtractionOptions = {}) {
    this.options = {
      includeImages: true,
      includeMetadata: true,
      parseStructure: true,
      extractWorkflows: true,
      ocrImages: false,
      analyzeCode: true,
      ...options
    };
  }

  async extractFromFile(file: File): Promise<ExtractedContent> {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return this.extractFromPDF(file);
      case 'docx':
      case 'doc':
        return this.extractFromWord(file);
      case 'xlsx':
      case 'xls':
        return this.extractFromExcel(file);
      case 'csv':
        return this.extractFromCSV(file);
      case 'json':
        return this.extractFromJSON(file);
      case 'xml':
        return this.extractFromHTML(file);
      case 'txt':
      case 'md':
        return this.extractFromGeneric(file);
      case 'js':
      case 'ts':
      case 'py':
      case 'java':
      case 'cpp':
      case 'c':
        return this.extractFromCode(file);
      case 'html':
      case 'htm':
        return this.extractFromHTML(file);
      case 'zip':
      case 'rar':
        return this.extractFromArchive(file);
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return this.extractFromImage(file);
      default:
        return this.extractFromGeneric(file);
    }
  }

  async extractFromPDF(file: File): Promise<ExtractedContent> {
    try {
      // In a browser environment, we would use pdf-lib or PDF.js
      // For now, we'll simulate PDF extraction
      const content: ExtractedContent = {
        text: await this.simulatePDFExtraction(file),
        metadata: {
          type: 'pdf',
          size: file.size,
          pages: Math.ceil(file.size / 50000), // Estimate pages
          lastModified: file.lastModified
        },
        structure: {
          sections: [],
          headings: [],
          paragraphs: []
        }
      };

      if (this.options.parseStructure) {
        content.structure = this.parseDocumentStructure(content.text);
      }

      if (this.options.extractWorkflows) {
        content.workflows = this.extractWorkflowPatterns(content.text);
      }

      return content;
    } catch (error) {
      console.error('PDF extraction failed:', error);
      return this.createErrorContent(file, 'PDF extraction not supported in browser environment');
    }
  }

  async extractFromWord(file: File): Promise<ExtractedContent> {
    try {
      // Using mammoth.js would be ideal here, but for browser compatibility
      // we'll simulate DOCX extraction
      const content: ExtractedContent = {
        text: await this.simulateWordExtraction(file),
        metadata: {
          type: 'docx',
          size: file.size,
          lastModified: file.lastModified
        }
      };

      if (this.options.parseStructure) {
        content.structure = this.parseDocumentStructure(content.text);
      }

      if (this.options.extractWorkflows) {
        content.workflows = this.extractWorkflowPatterns(content.text);
      }

      return content;
    } catch (error) {
      console.error('Word extraction failed:', error);
      return this.createErrorContent(file, 'DOCX extraction failed');
    }
  }

  async extractFromExcel(file: File): Promise<ExtractedContent> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      
      let allText = '';
      const tables: any[][] = [];
      const structure: any = { sheets: [] };

      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        tables.push(jsonData);
        allText += `Sheet: ${sheetName}\n`;
        allText += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
        
        structure.sheets.push({
          name: sheetName,
          rows: jsonData.length,
          columns: Math.max(...jsonData.map((row: any) => Array.isArray(row) ? row.length : 0))
        });
      });

      const content: ExtractedContent = {
        text: allText,
        metadata: {
          type: 'xlsx',
          size: file.size,
          sheets: workbook.SheetNames.length,
          lastModified: file.lastModified
        },
        structure,
        tables
      };

      if (this.options.extractWorkflows) {
        content.workflows = this.extractDataWorkflows(tables);
      }

      return content;
    } catch (error) {
      console.error('Excel extraction failed:', error);
      return this.createErrorContent(file, 'Excel file parsing failed');
    }
  }

  async extractFromCSV(file: File): Promise<ExtractedContent> {
    try {
      const text = await file.text();
      
      return new Promise((resolve) => {
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const content: ExtractedContent = {
              text: text,
              metadata: {
                type: 'csv',
                size: file.size,
                rows: results.data.length,
                columns: results.meta.fields?.length || 0,
                lastModified: file.lastModified
              },
              structure: {
                headers: results.meta.fields || [],
                sampleData: results.data.slice(0, 10)
              },
              tables: [results.data]
            };

            if (this.options.extractWorkflows) {
              content.workflows = this.extractDataWorkflows([results.data]);
            }

            resolve(content);
          }
        });
      });
    } catch (error) {
      console.error('CSV extraction failed:', error);
      return this.createErrorContent(file, 'CSV parsing failed');
    }
  }

  async extractFromJSON(file: File): Promise<ExtractedContent> {
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      const content: ExtractedContent = {
        text: text,
        metadata: {
          type: 'json',
          size: file.size,
          structure: this.analyzeJSONStructure(jsonData),
          lastModified: file.lastModified
        },
        structure: jsonData,
        dataSchema: this.generateJSONSchema(jsonData)
      };

      // Check if this looks like an n8n workflow
      if (this.isN8nWorkflow(jsonData)) {
        content.workflows = [this.parseN8nWorkflow(jsonData)];
      } else if (this.options.extractWorkflows) {
        content.workflows = this.extractJSONWorkflows(jsonData);
      }

      if (this.options.analyzeCode && this.looksLikeAPIDoc(jsonData)) {
        content.apis = this.extractAPIEndpoints(jsonData);
      }

      return content;
    } catch (error) {
      console.error('JSON extraction failed:', error);
      return this.createErrorContent(file, 'Invalid JSON format');
    }
  }

  async extractFromCode(file: File): Promise<ExtractedContent> {
    try {
      const text = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      const content: ExtractedContent = {
        text: text,
        metadata: {
          type: 'code',
          language: extension,
          size: file.size,
          lines: text.split('\n').length,
          lastModified: file.lastModified
        }
      };

      if (this.options.analyzeCode) {
        content.structure = this.analyzeCodeStructure(text, extension || '');
        content.apis = this.extractCodeAPIs(text, extension || '');
      }

      if (this.options.extractWorkflows) {
        content.workflows = this.extractCodeWorkflows(text, extension || '');
      }

      return content;
    } catch (error) {
      console.error('Code extraction failed:', error);
      return this.createErrorContent(file, 'Code analysis failed');
    }
  }

  async extractFromHTML(file: File): Promise<ExtractedContent> {
    try {
      const html = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract text content
      const textContent = doc.body?.textContent || '';
      
      // Extract metadata
      const title = doc.querySelector('title')?.textContent || '';
      const metaTags = Array.from(doc.querySelectorAll('meta')).map(meta => ({
        name: meta.getAttribute('name') || meta.getAttribute('property'),
        content: meta.getAttribute('content')
      }));

      const content: ExtractedContent = {
        text: textContent,
        metadata: {
          type: 'html',
          title,
          size: file.size,
          metaTags,
          lastModified: file.lastModified
        },
        structure: {
          headings: this.extractHTMLHeadings(doc),
          links: this.extractHTMLLinks(doc),
          forms: this.extractHTMLForms(doc)
        }
      };

      if (this.options.extractWorkflows) {
        content.workflows = this.extractHTMLWorkflows(doc);
      }

      return content;
    } catch (error) {
      console.error('HTML extraction failed:', error);
      return this.createErrorContent(file, 'HTML parsing failed');
    }
  }

  async extractFromArchive(file: File): Promise<ExtractedContent> {
    try {
      const zip = await JSZip.loadAsync(file);
      let allText = '';
      const files: string[] = [];
      
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          files.push(path);
          if (path.endsWith('.txt') || path.endsWith('.md') || path.endsWith('.json')) {
            try {
              const content = await zipEntry.async('text');
              allText += `=== ${path} ===\n${content}\n\n`;
            } catch (e) {
              // Skip files that can't be read as text
            }
          }
        }
      }

      const content: ExtractedContent = {
        text: allText,
        metadata: {
          type: 'archive',
          size: file.size,
          fileCount: files.length,
          files: files.slice(0, 100), // Limit to first 100 files
          lastModified: file.lastModified
        },
        structure: {
          directories: this.organizeArchiveStructure(files)
        }
      };

      if (this.options.extractWorkflows) {
        content.workflows = await this.extractProjectWorkflows(files, zip);
      }

      return content;
    } catch (error) {
      console.error('Archive extraction failed:', error);
      return this.createErrorContent(file, 'Archive extraction failed');
    }
  }

  async extractFromImage(file: File): Promise<ExtractedContent> {
    const content: ExtractedContent = {
      text: '',
      metadata: {
        type: 'image',
        size: file.size,
        mimeType: file.type,
        lastModified: file.lastModified
      }
    };

    if (this.options.includeImages) {
      const imageUrl = URL.createObjectURL(file);
      content.images = [imageUrl];
    }

    // In a real implementation, you would use OCR here
    if (this.options.ocrImages) {
      content.text = await this.simulateOCR(file);
    }

    return content;
  }

  async extractFromGeneric(file: File): Promise<ExtractedContent> {
    try {
      const text = await file.text();
      return {
        text: text,
        metadata: {
          type: 'generic',
          size: file.size,
          mimeType: file.type,
          lastModified: file.lastModified
        }
      };
    } catch (error) {
      return this.createErrorContent(file, 'Unable to read file content');
    }
  }

  // Helper methods for content analysis
  private parseDocumentStructure(text: string) {
    const lines = text.split('\n');
    const structure = {
      headings: [] as string[],
      sections: [] as any[],
      lists: [] as any[],
      procedures: [] as any[]
    };

    let currentSection = '';
    let currentProcedure: string[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Detect headings (lines with certain patterns)
      if (trimmed.match(/^#{1,6}\s/) || trimmed.match(/^[A-Z\s]{3,}:?$/)) {
        structure.headings.push(trimmed);
        currentSection = trimmed;
      }

      // Detect numbered lists (procedures)
      if (trimmed.match(/^\d+\.\s/) || trimmed.match(/^Step\s+\d+/i)) {
        if (currentProcedure.length === 0) {
          currentProcedure = [];
        }
        currentProcedure.push(trimmed);
      } else if (currentProcedure.length > 0) {
        if (currentProcedure.length > 2) {
          structure.procedures.push([...currentProcedure]);
        }
        currentProcedure = [];
      }
    });

    return structure;
  }

  private extractWorkflowPatterns(text: string) {
    const workflows: any[] = [];
    const patterns = [
      /when\s+(.+?)\s+then\s+(.+)/gi,
      /if\s+(.+?)\s+then\s+(.+)/gi,
      /trigger:\s*(.+)/gi,
      /action:\s*(.+)/gi,
      /step\s+\d+:\s*(.+)/gi
    ];

    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern)];
      matches.forEach(match => {
        workflows.push({
          type: 'conditional',
          trigger: match[1],
          action: match[2] || match[1],
          confidence: 0.7
        });
      });
    });

    return workflows;
  }

  private extractDataWorkflows(tables: any[][]) {
    const workflows: any[] = [];
    
    tables.forEach(table => {
      if (table.length > 0) {
        const headers = Object.keys(table[0] || {});
        
        // Look for data transformation patterns
        if (headers.some(h => h.toLowerCase().includes('source'))) {
          workflows.push({
            type: 'data_sync',
            description: 'Data synchronization workflow detected',
            source: headers.find(h => h.toLowerCase().includes('source')),
            target: headers.find(h => h.toLowerCase().includes('target')) || 'destination',
            confidence: 0.8
          });
        }
      }
    });

    return workflows;
  }

  private isN8nWorkflow(data: any): boolean {
    return data.nodes && Array.isArray(data.nodes) && 
           data.connections && typeof data.connections === 'object';
  }

  private parseN8nWorkflow(data: any) {
    return {
      type: 'n8n',
      name: data.name || 'Imported Workflow',
      nodeCount: data.nodes?.length || 0,
      description: `n8n workflow with ${data.nodes?.length || 0} nodes`,
      confidence: 1.0,
      workflow: data
    };
  }

  private analyzeJSONStructure(data: any): any {
    const analysis: {
      type: string;
      keys: string[];
      depth: number;
    } = {
      type: Array.isArray(data) ? 'array' : typeof data,
      keys: [],
      depth: 0
    };

    if (typeof data === 'object' && data !== null) {
      analysis.keys = Object.keys(data);
      analysis.depth = this.calculateObjectDepth(data);
    }

    return analysis;
  }

  private calculateObjectDepth(obj: any, depth = 0): number {
    if (typeof obj !== 'object' || obj === null) return depth;
    
    let maxDepth = depth;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        maxDepth = Math.max(maxDepth, this.calculateObjectDepth(obj[key], depth + 1));
      }
    }
    return maxDepth;
  }

  private generateJSONSchema(data: any): any {
    if (Array.isArray(data)) {
      return {
        type: 'array',
        items: data.length > 0 ? this.generateJSONSchema(data[0]) : { type: 'any' }
      };
    }
    
    if (typeof data === 'object' && data !== null) {
      const properties: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          properties[key] = this.generateJSONSchema(data[key]);
        }
      }
      return { type: 'object', properties };
    }
    
    return { type: typeof data };
  }

  private createErrorContent(file: File, error: string): ExtractedContent {
    return {
      text: `Error: ${error}`,
      metadata: {
        type: 'error',
        size: file.size,
        error,
        lastModified: file.lastModified
      }
    };
  }

  // Simulation methods (to be replaced with real implementations)
  private async simulatePDFExtraction(file: File): Promise<string> {
    return `Simulated PDF content from ${file.name}. In production, this would use pdf-parse or PDF.js to extract actual text content.`;
  }

  private async simulateWordExtraction(file: File): Promise<string> {
    return `Simulated Word document content from ${file.name}. In production, this would use mammoth.js to extract actual content.`;
  }

  private async simulateOCR(file: File): Promise<string> {
    return `OCR text would be extracted from ${file.name}. In production, this would use Tesseract.js or a cloud OCR service.`;
  }

  private looksLikeAPIDoc(data: any): boolean {
    return data.swagger || data.openapi || data.paths || data.endpoints;
  }

  private extractAPIEndpoints(data: any): any[] {
    const apis: any[] = [];
    
    if (data.paths) {
      Object.keys(data.paths).forEach(path => {
        Object.keys(data.paths[path]).forEach(method => {
          apis.push({
            path,
            method: method.toLowerCase(),
            description: data.paths[path][method].summary || data.paths[path][method].description
          });
        });
      });
    }
    
    return apis;
  }

  private analyzeCodeStructure(code: string, language: string) {
    const structure: any = {
      language,
      functions: [],
      classes: [],
      imports: [],
      variables: []
    };

    const lines = code.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Detect functions (basic patterns for common languages)
      if (trimmed.match(/^(function|def|fn)\s+(\w+)/)) {
        const match = trimmed.match(/^(function|def|fn)\s+(\w+)/);
        if (match) structure.functions.push(match[2]);
      }
      
      // Detect classes
      if (trimmed.match(/^(class|interface)\s+(\w+)/)) {
        const match = trimmed.match(/^(class|interface)\s+(\w+)/);
        if (match) structure.classes.push(match[2]);
      }
      
      // Detect imports
      if (trimmed.match(/^(import|require|from|#include)/)) {
        structure.imports.push(trimmed);
      }
    });

    return structure;
  }

  private extractCodeAPIs(code: string, language: string) {
    const apis: any[] = [];
    const lines = code.split('\n');
    
    lines.forEach(line => {
      // Look for HTTP endpoints in code
      const httpMatch = line.match(/(GET|POST|PUT|DELETE|PATCH)\s+['"`]([^'"`]+)['"`]/i);
      if (httpMatch) {
        apis.push({
          method: httpMatch[1].toUpperCase(),
          path: httpMatch[2],
          source: 'code_analysis'
        });
      }
      
      // Look for API calls
      const apiCallMatch = line.match(/\.(?:get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/i);
      if (apiCallMatch) {
        apis.push({
          path: apiCallMatch[1],
          source: 'api_call'
        });
      }
    });
    
    return apis;
  }

  private extractCodeWorkflows(code: string, language: string) {
    // Analyze code for automation patterns
    const workflows: any[] = [];
    
    if (code.includes('cron') || code.includes('schedule')) {
      workflows.push({
        type: 'scheduled',
        description: 'Scheduled task detected in code',
        confidence: 0.8
      });
    }
    
    if (code.includes('webhook') || code.includes('endpoint')) {
      workflows.push({
        type: 'webhook',
        description: 'Webhook handler detected',
        confidence: 0.9
      });
    }
    
    return workflows;
  }

  private extractHTMLHeadings(doc: Document) {
    const headings: any[] = [];
    const headingTags = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    headingTags.forEach(heading => {
      headings.push({
        level: parseInt(heading.tagName[1]),
        text: heading.textContent?.trim()
      });
    });
    
    return headings;
  }

  private extractHTMLLinks(doc: Document) {
    const links: any[] = [];
    const linkTags = doc.querySelectorAll('a[href]');
    
    linkTags.forEach(link => {
      links.push({
        href: link.getAttribute('href'),
        text: link.textContent?.trim()
      });
    });
    
    return links;
  }

  private extractHTMLForms(doc: Document) {
    const forms: any[] = [];
    const formTags = doc.querySelectorAll('form');
    
    formTags.forEach(form => {
      const inputs: any[] = [];
      form.querySelectorAll('input, select, textarea').forEach(input => {
        inputs.push({
          type: input.getAttribute('type') || input.tagName.toLowerCase(),
          name: input.getAttribute('name'),
          id: input.getAttribute('id')
        });
      });
      
      forms.push({
        action: form.getAttribute('action'),
        method: form.getAttribute('method') || 'GET',
        inputs
      });
    });
    
    return forms;
  }

  private extractHTMLWorkflows(doc: Document) {
    const workflows: any[] = [];
    
    // Look for forms that could be automated
    const forms = doc.querySelectorAll('form');
    if (forms.length > 0) {
      workflows.push({
        type: 'form_automation',
        description: `${forms.length} form(s) detected that could be automated`,
        confidence: 0.7
      });
    }
    
    return workflows;
  }

  private organizeArchiveStructure(files: string[]) {
    const structure: any = {};
    
    files.forEach(file => {
      const parts = file.split('/');
      let current = structure;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          // It's a file
          if (!current._files) current._files = [];
          current._files.push(part);
        } else {
          // It's a directory
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    
    return structure;
  }

  private async extractProjectWorkflows(files: string[], zip: JSZip) {
    const workflows: any[] = [];
    
    // Look for common project patterns
    if (files.some(f => f.includes('package.json'))) {
      workflows.push({
        type: 'npm_project',
        description: 'Node.js project detected - could automate builds and deployments',
        confidence: 0.9
      });
    }
    
    if (files.some(f => f.includes('.github/workflows'))) {
      workflows.push({
        type: 'github_actions',
        description: 'GitHub Actions workflows detected',
        confidence: 1.0
      });
    }
    
    if (files.some(f => f.includes('docker') || f.includes('Dockerfile'))) {
      workflows.push({
        type: 'docker',
        description: 'Docker configuration detected - could automate containerization',
        confidence: 0.9
      });
    }
    
    return workflows;
  }

  private extractJSONWorkflows(data: any) {
    const workflows: any[] = [];
    
    // Look for configuration files that suggest automation
    if (data.scripts && typeof data.scripts === 'object') {
      workflows.push({
        type: 'npm_scripts',
        description: 'NPM scripts detected that could be automated',
        confidence: 0.8
      });
    }
    
    if (data.pipeline || data.stages) {
      workflows.push({
        type: 'ci_pipeline',
        description: 'CI/CD pipeline configuration detected',
        confidence: 0.9
      });
    }
    
    return workflows;
  }
}