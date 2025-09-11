'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  Wand2,
  MessageSquare,
  Lightbulb,
  Zap,
  Bot
} from 'lucide-react';

export default function HomePage() {
  const [idea, setIdea] = useState('');

  const exampleIdeas = [
    "Send a daily email summary of my tasks",
    "Monitor social media mentions and save to spreadsheet",
    "Backup database every night to cloud storage",
    "Process form submissions and add to CRM",
    "Generate weekly reports from analytics data"
  ];

  const handleIdeaSubmit = () => {
    if (!idea.trim()) return;
    // Navigate to workflow builder with the idea
    window.location.href = `/workflow?idea=${encodeURIComponent(idea)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          {/* Logo and Title */}
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"
            >
              <Sparkles className="h-10 w-10 text-primary" />
            </motion.div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              What would you like to automate?
            </h1>
            <p className="text-xl text-muted-foreground">
              Just describe your idea, and I'll build the workflow for you
            </p>
          </div>

          {/* Main Input */}
          <Card className="p-8 shadow-xl border-2">
            <div className="space-y-6">
              <div className="relative">
                <Input
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your automation idea in plain English..."
                  className="text-lg py-6 px-6 pr-32"
                  onKeyPress={(e) => e.key === 'Enter' && handleIdeaSubmit()}
                />
                <Button
                  onClick={handleIdeaSubmit}
                  size="lg"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  disabled={!idea.trim()}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>

              {/* Example Ideas */}
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Try one of these ideas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {exampleIdeas.map((example, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => setIdea(example)}
                      className="text-xs"
                    >
                      {example}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent workflow generation from natural language
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mx-auto">
                  <MessageSquare className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="font-semibold">Interactive</h3>
                <p className="text-sm text-muted-foreground">
                  Guided conversation with multiple choice options
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 text-center space-y-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="font-semibold">Instant</h3>
                <p className="text-sm text-muted-foreground">
                  Get a working workflow in seconds, not hours
                </p>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}