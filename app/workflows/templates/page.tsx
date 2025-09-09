'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  Filter,
  Mail,
  Database,
  Globe,
  Slack,
  Github,
  FileText,
  Calendar,
  BarChart,
  Bot,
  Zap,
  Clock,
  Star,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const templates = [
  {
    id: 1,
    name: 'Email to Slack Notifications',
    description: 'Forward important emails to a Slack channel automatically',
    icon: <Mail className="h-8 w-8" />,
    category: 'Communication',
    difficulty: 'Beginner',
    rating: 4.8,
    uses: 1250,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Database Backup Automation',
    description: 'Schedule automatic database backups to cloud storage',
    icon: <Database className="h-8 w-8" />,
    category: 'Data',
    difficulty: 'Intermediate',
    rating: 4.9,
    uses: 890,
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: 'Web Scraper to Sheets',
    description: 'Extract data from websites and save to Google Sheets',
    icon: <Globe className="h-8 w-8" />,
    category: 'Data',
    difficulty: 'Advanced',
    rating: 4.7,
    uses: 2100,
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Slack Bot Responder',
    description: 'Create an intelligent Slack bot that responds to messages',
    icon: <Slack className="h-8 w-8" />,
    category: 'Communication',
    difficulty: 'Intermediate',
    rating: 4.6,
    uses: 1560,
    color: 'bg-pink-500'
  },
  {
    id: 5,
    name: 'GitHub Issue Tracker',
    description: 'Monitor GitHub issues and create tasks automatically',
    icon: <Github className="h-8 w-8" />,
    category: 'Development',
    difficulty: 'Intermediate',
    rating: 4.8,
    uses: 980,
    color: 'bg-gray-700'
  },
  {
    id: 6,
    name: 'Document Generator',
    description: 'Generate documents from templates with dynamic data',
    icon: <FileText className="h-8 w-8" />,
    category: 'Documents',
    difficulty: 'Beginner',
    rating: 4.5,
    uses: 1780,
    color: 'bg-orange-500'
  },
  {
    id: 7,
    name: 'Calendar Sync',
    description: 'Sync events between multiple calendar applications',
    icon: <Calendar className="h-8 w-8" />,
    category: 'Productivity',
    difficulty: 'Beginner',
    rating: 4.7,
    uses: 2340,
    color: 'bg-indigo-500'
  },
  {
    id: 8,
    name: 'Analytics Dashboard',
    description: 'Aggregate data from multiple sources into a dashboard',
    icon: <BarChart className="h-8 w-8" />,
    category: 'Analytics',
    difficulty: 'Advanced',
    rating: 4.9,
    uses: 670,
    color: 'bg-yellow-500'
  },
  {
    id: 9,
    name: 'AI Content Generator',
    description: 'Generate content using AI and post to multiple platforms',
    icon: <Bot className="h-8 w-8" />,
    category: 'AI',
    difficulty: 'Advanced',
    rating: 4.8,
    uses: 3200,
    color: 'bg-cyan-500'
  }
];

const categories = ['All', 'Communication', 'Data', 'Development', 'Documents', 'Productivity', 'Analytics', 'AI'];
const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function WorkflowTemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleUseTemplate = (template: any) => {
    // Store template in sessionStorage for AI workflow to use
    sessionStorage.setItem('workflowTemplate', JSON.stringify(template));
    router.push('/ai-workflow');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col space-y-4">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <Link href="/workflows" className="text-gray-500 hover:text-gray-700">
                Workflows
              </Link>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900 font-medium">Templates</span>
            </nav>
            
            <div>
              <h1 className="text-2xl font-bold">Workflow Templates</h1>
              <p className="text-sm text-gray-600">Choose from pre-built templates to get started quickly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex gap-2">
              <Filter className="h-5 w-5 text-gray-400 mt-2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleUseTemplate(template)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`${template.color} text-white p-3 rounded-lg`}>
                    {template.icon}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{template.rating}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <span className={`px-2 py-1 rounded-full ${
                      template.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                      template.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {template.difficulty}
                    </span>
                    <span className="text-gray-500">{template.category}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Zap className="h-3 w-3" />
                    <span>{template.uses.toLocaleString()} uses</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t px-6 py-3 bg-gray-50">
                <Button className="w-full" size="sm">
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}