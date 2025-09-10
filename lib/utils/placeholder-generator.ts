export interface PlaceholderOptions {
  width: number;
  height: number;
  text: string;
  bgColor?: string;
  textColor?: string;
  fontSize?: number;
}

export class PlaceholderGenerator {
  static generateSVG(options: PlaceholderOptions): string {
    const {
      width,
      height,
      text,
      bgColor = '#1f2937',
      textColor = '#ffffff',
      fontSize = Math.min(width, height) / 8
    } = options;

    return `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" 
              text-anchor="middle" 
              dominant-baseline="central" 
              fill="${textColor}" 
              font-size="${fontSize}" 
              font-family="Arial, sans-serif">
          ${text}
        </text>
      </svg>
    `.trim();
  }

  static generateDataURL(options: PlaceholderOptions): string {
    const svg = this.generateSVG(options);
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  static async generateBlob(options: PlaceholderOptions): Promise<Blob> {
    const svg = this.generateSVG(options);
    return new Blob([svg], { type: 'image/svg+xml' });
  }

  static generateDemoThumbnails(): Record<string, string> {
    const chapters = [
      { id: 'intro', title: 'Welcome' },
      { id: 'ai-chat', title: 'AI Chat' },
      { id: 'canvas', title: 'Canvas' },
      { id: 'youtube', title: 'YouTube' },
      { id: 'configure', title: 'Configure' },
      { id: 'export', title: 'Export' },
      { id: 'import', title: 'Import' },
      { id: 'execute', title: 'Execute' },
      { id: 'complete', title: 'Complete' }
    ];

    const thumbnails: Record<string, string> = {};
    
    chapters.forEach((chapter, index) => {
      const hue = (index * 40) % 360;
      thumbnails[chapter.id] = this.generateDataURL({
        width: 320,
        height: 180,
        text: chapter.title,
        bgColor: `hsl(${hue}, 60%, 30%)`,
        textColor: '#ffffff',
        fontSize: 24
      });
    });

    return thumbnails;
  }

  static generateDemoPoster(): string {
    return this.generateDataURL({
      width: 1280,
      height: 720,
      text: 'n8n AI Flow Demo',
      bgColor: '#1f2937',
      textColor: '#3b82f6',
      fontSize: 72
    });
  }

  static generateFallbackGIF(): string {
    // Generate an animated-looking SVG that simulates a GIF
    const svg = `
      <svg width="640" height="360" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#1f2937"/>
        <circle cx="320" cy="180" r="30" fill="#3b82f6">
          <animate attributeName="r" values="20;40;20" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite"/>
        </circle>
        <text x="50%" y="70%" 
              text-anchor="middle" 
              dominant-baseline="central" 
              fill="#ffffff" 
              font-size="32" 
              font-family="Arial, sans-serif">
          Loading Demo...
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}