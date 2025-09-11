// Simplified workflow templates - no longer needed with AI-first approach
// Keeping minimal exports to avoid breaking existing code

export interface AnimationElement {
  type: string;
  properties: any;
}

export interface ContentAnalysis {
  keywords: string[];
  sentiment: string;
  topics: string[];
  type?: 'breaking_news' | 'tutorial' | 'analysis';
  urgency?: 'high' | 'medium' | 'low';
  technicalLevel?: 'beginner' | 'intermediate' | 'advanced';
  targetAudience?: 'general' | 'technical';
}

export interface AnimationTemplate {
  name: string;
  style: any;
  animations: any[];
  transitions: any[];
  duration?: number;
  audioProfile?: any;
}

export const aiRevolutionTemplate: AnimationTemplate = {
  name: 'AI Revolution',
  style: {},
  animations: [],
  transitions: []
};

export const juliaMccoyTemplate: AnimationTemplate = {
  name: 'Julia McCoy',
  style: {},
  animations: [],
  transitions: []
};

export function createHybridTemplate(): AnimationTemplate {
  return {
    name: 'Hybrid',
    style: {},
    animations: [],
    transitions: []
  };
}