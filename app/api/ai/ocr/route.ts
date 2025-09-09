import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Supported: JPEG, PNG, GIF, WebP, BMP' },
        { status: 400 }
      );
    }

    // Convert to buffer for Tesseract
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Perform OCR
    const result = await performOCR(buffer, imageFile.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from image' },
      { status: 500 }
    );
  }
}

async function performOCR(imageBuffer: Buffer, mimeType: string) {
  try {
    // Use Tesseract.js for OCR
    const worker = await Tesseract.createWorker('eng');
    
    // Convert buffer to base64 data URL for Tesseract
    const base64 = imageBuffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    const { data } = await worker.recognize(dataUrl);
    
    await worker.terminate();
    
    // Extract workflow patterns from the text
    const workflowPatterns = analyzeTextForWorkflows(data.text);
    
    return {
      text: data.text,
      confidence: data.confidence,
      words: data.words?.map(word => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox
      })),
      lines: data.lines?.map(line => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox
      })),
      paragraphs: data.paragraphs?.map(para => ({
        text: para.text,
        confidence: para.confidence,
        bbox: para.bbox
      })),
      workflowPatterns,
      metadata: {
        languages: data.symbols ? detectLanguages(data.text) : ['en'],
        hasNumbers: /\d/.test(data.text),
        hasEmail: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(data.text),
        hasUrls: /https?:\/\/[^\s]+/.test(data.text),
        wordCount: data.text.split(/\s+/).filter(word => word.length > 0).length
      }
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    
    // Fallback to basic response
    return {
      text: '',
      confidence: 0,
      error: 'OCR processing failed',
      workflowPatterns: [],
      metadata: {
        languages: ['unknown'],
        hasNumbers: false,
        hasEmail: false,
        hasUrls: false,
        wordCount: 0
      }
    };
  }
}

function analyzeTextForWorkflows(text: string) {
  const patterns = [];
  const lowerText = text.toLowerCase();
  
  // Check for trigger patterns
  if (lowerText.includes('when') || lowerText.includes('trigger') || lowerText.includes('start')) {
    patterns.push({
      type: 'trigger',
      pattern: 'Event trigger detected',
      confidence: 0.7
    });
  }
  
  // Check for email patterns
  if (lowerText.includes('email') || lowerText.includes('mail') || lowerText.includes('gmail')) {
    patterns.push({
      type: 'email',
      pattern: 'Email workflow detected',
      confidence: 0.8
    });
  }
  
  // Check for API/webhook patterns
  if (lowerText.includes('api') || lowerText.includes('webhook') || lowerText.includes('http')) {
    patterns.push({
      type: 'api',
      pattern: 'API integration detected',
      confidence: 0.8
    });
  }
  
  // Check for database patterns
  if (lowerText.includes('database') || lowerText.includes('sql') || lowerText.includes('query')) {
    patterns.push({
      type: 'database',
      pattern: 'Database operation detected',
      confidence: 0.7
    });
  }
  
  // Check for scheduling patterns
  if (lowerText.includes('schedule') || lowerText.includes('daily') || lowerText.includes('weekly')) {
    patterns.push({
      type: 'schedule',
      pattern: 'Scheduled task detected',
      confidence: 0.8
    });
  }
  
  // Check for notification patterns
  if (lowerText.includes('notify') || lowerText.includes('alert') || lowerText.includes('slack')) {
    patterns.push({
      type: 'notification',
      pattern: 'Notification workflow detected',
      confidence: 0.8
    });
  }
  
  // Check for data transformation patterns
  if (lowerText.includes('transform') || lowerText.includes('convert') || lowerText.includes('process')) {
    patterns.push({
      type: 'transform',
      pattern: 'Data transformation detected',
      confidence: 0.7
    });
  }
  
  // Check for file operation patterns
  if (lowerText.includes('file') || lowerText.includes('upload') || lowerText.includes('download')) {
    patterns.push({
      type: 'file',
      pattern: 'File operation detected',
      confidence: 0.7
    });
  }
  
  return patterns;
}

function detectLanguages(text: string): string[] {
  const languages = [];
  
  // Basic language detection based on character patterns
  if (/[a-zA-Z]/.test(text)) languages.push('en');
  if (/[а-яА-Я]/.test(text)) languages.push('ru');
  if (/[ñáéíóúüÑÁÉÍÓÚÜ]/.test(text)) languages.push('es');
  if (/[àâäæçèéêëîïôùûüÿœ]/.test(text)) languages.push('fr');
  if (/[äöüßÄÖÜ]/.test(text)) languages.push('de');
  if (/[\u4e00-\u9fff]/.test(text)) languages.push('zh');
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) languages.push('ja');
  if (/[\uac00-\ud7af]/.test(text)) languages.push('ko');
  if (/[\u0600-\u06ff]/.test(text)) languages.push('ar');
  
  return languages.length > 0 ? languages : ['unknown'];
}

// Alternative implementation using Google Vision API (if configured)
async function performOCRWithGoogleVision(imageBuffer: Buffer): Promise<any> {
  if (!process.env.GOOGLE_CLOUD_API_KEY) {
    throw new Error('Google Cloud API key not configured');
  }

  const base64Image = imageBuffer.toString('base64');
  
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    throw new Error('Google Vision API request failed');
  }

  const data = await response.json();
  const textAnnotations = data.responses[0]?.textAnnotations || [];
  const fullText = textAnnotations[0]?.description || '';

  return {
    text: fullText,
    confidence: 0.9,
    annotations: textAnnotations.slice(1).map((annotation: any) => ({
      text: annotation.description,
      vertices: annotation.boundingPoly?.vertices
    }))
  };
}

// Alternative implementation using Azure Computer Vision (if configured)
async function performOCRWithAzure(imageBuffer: Buffer): Promise<any> {
  if (!process.env.AZURE_COMPUTER_VISION_KEY || !process.env.AZURE_COMPUTER_VISION_ENDPOINT) {
    throw new Error('Azure Computer Vision not configured');
  }

  const response = await fetch(
    `${process.env.AZURE_COMPUTER_VISION_ENDPOINT}/vision/v3.2/ocr`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_COMPUTER_VISION_KEY,
        'Content-Type': 'application/octet-stream'
      },
      body: imageBuffer
    }
  );

  if (!response.ok) {
    throw new Error('Azure Computer Vision API request failed');
  }

  const data = await response.json();
  
  // Extract text from Azure response format
  let fullText = '';
  data.regions?.forEach((region: any) => {
    region.lines?.forEach((line: any) => {
      line.words?.forEach((word: any) => {
        fullText += word.text + ' ';
      });
      fullText += '\n';
    });
  });

  return {
    text: fullText.trim(),
    confidence: 0.9,
    language: data.language,
    regions: data.regions
  };
}