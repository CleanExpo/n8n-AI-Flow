'use client';

import { DemoStep } from '@/components/demo/DemoPlayer';

export interface VideoAsset {
  mp4: string;
  webm: string;
  poster: string;
  fallback?: string;
}

export interface VideoChapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  thumbnail: string;
}

export interface VideoManifest {
  videos: {
    main: VideoAsset;
  };
  offline: {
    enabled: boolean;
    cacheStrategy: 'cache-first' | 'network-first';
    maxAge: number;
  };
  chapters: VideoChapter[];
}

export class DemoVideoService {
  private static instance: DemoVideoService;
  private manifest: VideoManifest | null = null;

  static getInstance(): DemoVideoService {
    if (!DemoVideoService.instance) {
      DemoVideoService.instance = new DemoVideoService();
    }
    return DemoVideoService.instance;
  }

  async loadManifest(): Promise<VideoManifest> {
    if (this.manifest) return this.manifest;

    try {
      const response = await fetch('/demo-assets/video-manifest.json');
      this.manifest = await response.json();
      return this.manifest!;
    } catch (error) {
      console.warn('Video manifest not found, using fallback');
      return this.getFallbackManifest();
    }
  }

  private getFallbackManifest(): VideoManifest {
    return {
      videos: {
        main: {
          mp4: '/demo-assets/demo-video.mp4',
          webm: '/demo-assets/demo-video.webm',
          poster: '/demo-assets/demo-poster.jpg',
          fallback: '/demo-assets/demo-fallback.gif'
        }
      },
      offline: {
        enabled: true,
        cacheStrategy: 'cache-first',
        maxAge: 86400
      },
      chapters: [
        {
          id: 'intro',
          title: 'Welcome to n8n AI Flow',
          startTime: 0,
          endTime: 5,
          thumbnail: '/demo-assets/chapters/intro.jpg'
        },
        {
          id: 'ai-chat',
          title: 'AI Workflow Generation',
          startTime: 5,
          endTime: 15,
          thumbnail: '/demo-assets/chapters/ai-chat.jpg'
        },
        {
          id: 'canvas',
          title: 'Visual Workflow Builder',
          startTime: 15,
          endTime: 23,
          thumbnail: '/demo-assets/chapters/canvas.jpg'
        },
        {
          id: 'youtube',
          title: 'YouTube Animation Workflows',
          startTime: 23,
          endTime: 33,
          thumbnail: '/demo-assets/chapters/youtube.jpg'
        },
        {
          id: 'configure',
          title: 'Node Configuration',
          startTime: 33,
          endTime: 41,
          thumbnail: '/demo-assets/chapters/configure.jpg'
        },
        {
          id: 'export',
          title: 'Export to n8n',
          startTime: 41,
          endTime: 54,
          thumbnail: '/demo-assets/chapters/export.jpg'
        },
        {
          id: 'import',
          title: 'Import in n8n',
          startTime: 54,
          endTime: 62,
          thumbnail: '/demo-assets/chapters/import.jpg'
        },
        {
          id: 'execute',
          title: 'Execute & Monitor',
          startTime: 62,
          endTime: 69,
          thumbnail: '/demo-assets/chapters/execute.jpg'
        },
        {
          id: 'complete',
          title: 'Ready to Automate',
          startTime: 69,
          endTime: 77,
          thumbnail: '/demo-assets/chapters/complete.jpg'
        }
      ]
    };
  }

  async generateDemoVideo(steps: DemoStep[]): Promise<string> {
    // For now, return a placeholder video URL
    // In a real implementation, this would generate a video from the steps
    return '/demo-assets/demo-video.mp4';
  }

  async cacheVideoForOffline(videoUrl: string): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      return false;
    }

    try {
      const cache = await caches.open('demo-videos-v1');
      await cache.add(videoUrl);
      return true;
    } catch (error) {
      console.warn('Failed to cache video for offline use:', error);
      return false;
    }
  }

  async isVideoAvailableOffline(videoUrl: string): Promise<boolean> {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('demo-videos-v1');
      const response = await cache.match(videoUrl);
      return !!response;
    } catch (error) {
      return false;
    }
  }

  generateVideoThumbnail(videoElement: HTMLVideoElement, time: number): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    canvas.width = 320;
    canvas.height = 180;
    
    videoElement.currentTime = time;
    videoElement.addEventListener('seeked', () => {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    }, { once: true });

    return canvas.toDataURL();
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  async preloadChapterThumbnails(chapters: VideoChapter[]): Promise<void> {
    const promises = chapters.map(chapter => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve; // Continue even if thumbnail fails
        img.src = chapter.thumbnail;
      });
    });

    await Promise.all(promises);
  }
}