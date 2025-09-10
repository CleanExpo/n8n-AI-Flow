'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NewWorkflowPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to AI workflow generator
    router.push('/ai-workflow');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to AI Workflow Generator...</p>
      </div>
    </div>
  );
}