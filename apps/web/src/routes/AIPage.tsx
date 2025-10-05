import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Send, Lightbulb, TrendingUp, Users, Target } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiSuggestionsApi, callables } from '@/lib/api';
import { trackFeatureUsage, trackUserAction } from '@/lib/telemetry';

interface AISuggestion {
  id: string;
  type: 'content' | 'strategy' | 'optimization' | 'audience';
  title: string;
  description: string;
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected';
  campaignId?: string;
  createdAt: Date;
}

export default function AIPage(): JSX.Element {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  // Fetch AI suggestions
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: () => aiSuggestionsApi.getAll(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Generate AI suggestion mutation
  const generateSuggestionMutation = useMutation({
    mutationFn: async (data: { prompt: string; type: string }) => {
      const result = await callables.aiSuggest(data);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggestions'] });
      trackFeatureUsage('ai', 'generate_suggestion');
    },
  });

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      await generateSuggestionMutation.mutateAsync({
        prompt: prompt.trim(),
        type: 'content',
      });
      setPrompt('');
      trackUserAction('ai_suggestion_requested');
    } catch (error) {
      console.error('Failed to generate suggestion:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'content':
        return Brain;
      case 'strategy':
        return TrendingUp;
      case 'optimization':
        return Target;
      case 'audience':
        return Users;
      default:
        return Lightbulb;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800';
      case 'accepted':
        return 'bg-success-100 text-success-800';
      case 'rejected':
        return 'bg-danger-100 text-danger-800';
      default:
        return 'bg-secondary-100 text-secondary-800';
    }
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">AI Assistant</h1>
          <p className="text-secondary-600 mt-1">
            Get AI-powered suggestions for your campaigns
          </p>
        </div>
      </div>

      {/* AI Prompt */}
      <div className="card">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-6 w-6 text-primary-600" />
          <h2 className="text-lg font-semibold text-secondary-900">Ask AI</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you need help with... (e.g., 'Create a social media strategy for our new product launch')"
              className="w-full h-32 p-3 border border-secondary-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              disabled={isGenerating}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-secondary-500">
              AI suggestions are generated based on best practices and your campaign data
            </div>
            <button
              type="submit"
              disabled={!prompt.trim() || isGenerating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-secondary-900">Recent Suggestions</h2>
          <div className="text-sm text-secondary-600">
            {suggestions.length} total suggestions
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">No suggestions yet</h3>
            <p className="text-secondary-600">
              Ask the AI for help to see your first suggestions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion: AISuggestion, index: number) => {
              const Icon = getTypeIcon(suggestion.type);
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-secondary-900">
                          {suggestion.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(suggestion.status)}`}>
                          {suggestion.status}
                        </span>
                      </div>
                      
                      <p className="text-secondary-600 text-sm mb-3">
                        {suggestion.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-secondary-500">
                          <span>Confidence: {Math.round(suggestion.confidence * 100)}%</span>
                          <span>{formatDate(suggestion.createdAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="btn-ghost text-xs">
                            Accept
                          </button>
                          <button className="btn-ghost text-xs text-danger-600 hover:text-danger-700">
                            Reject
                          </button>
                          <button className="btn-ghost text-xs text-primary-600 hover:text-primary-700">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Suggestions</p>
              <p className="text-2xl font-bold text-secondary-900">{suggestions.length}</p>
            </div>
            <Brain className="h-8 w-8 text-primary-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Accepted</p>
              <p className="text-2xl font-bold text-success-600">
                {suggestions.filter((s: AISuggestion) => s.status === 'accepted').length}
              </p>
            </div>
            <Lightbulb className="h-8 w-8 text-success-600" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Pending</p>
              <p className="text-2xl font-bold text-warning-600">
                {suggestions.filter((s: AISuggestion) => s.status === 'pending').length}
              </p>
            </div>
            <Target className="h-8 w-8 text-warning-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
