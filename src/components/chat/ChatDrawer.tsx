import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { MessageCircle, Send, Bot, User, AlertTriangle, CheckCircle, X, Shield, Clock, Activity } from 'lucide-react';
import type { User as UserType, Role, Tier } from '@/models/core';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  type?: 'system' | 'error' | 'simulation' | 'export';
  data?: any;
}

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: UserType | null;
  roles: Role[] | null;
  tiers: Tier[] | null;
}

export function ChatDrawer({ open, onOpenChange, currentUser, roles, tiers }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add welcome message on first load
    if (messages.length === 0) {
      const welcomeCommands = [
        '• `/status` - View system status and metrics',
        '• `/simulate [description]` - Run campaign simulation',
        '• `/export [period]` - Generate export reports'
      ];

      // Add additional commands based on permissions
      if (currentUser && roles && tiers) {
        const userRole = roles.find(r => r.roleId === currentUser.roleId);
        const userTier = tiers.find(t => t.tierId === currentUser.tierId);
        
        if (userRole?.permissions.includes('roles:write')) {
          welcomeCommands.splice(1, 0, '• `/set [rule]` - Configure governance rules');
        }
      }

      setMessages([{
        id: '1',
        content: `👋 **Welcome to Vizzy AI Assistant!**

I'm here to help you manage your marketing campaigns and system operations.

**Available Commands:**
${welcomeCommands.join('\n')}

Type a command or ask me anything about your campaigns!`,
        role: 'assistant',
        type: 'system'
      }]);
    }
  }, [currentUser, roles, tiers]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages are added
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id'>) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      ...message
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsProcessing(true);

    addMessage({
      content: userMessage,
      role: 'user'
    });

    await processCommand(userMessage);
    setIsProcessing(false);
  };

  const processCommand = async (input: string) => {
    const trimmed = input.trim();

    if (trimmed.startsWith('/status')) {
      setTimeout(() => {
        const statusInfo = {
          lastExport: '2 hours ago',
          activeUsers: 3,
          approvedActivities: 5,
          systemHealth: 'Operational'
        };

        addMessage({
          content: `📊 **System Status Report**

• Last Export: ${statusInfo.lastExport}
• Active Users: ${statusInfo.activeUsers}
• Approved Activities: ${statusInfo.approvedActivities}
• System Health: ${statusInfo.systemHealth}
• Database: Connected
• Audit Logs: Active`,
          role: 'assistant',
          type: 'system',
          data: statusInfo
        });
      }, 800);

    } else if (trimmed.startsWith('/simulate')) {
      const prompt = trimmed.substring(10).trim();
      if (!prompt) {
        addMessage({
          content: '⚠️ **Missing Description**: Please provide a simulation description.\n\nExample: `/simulate Email campaign for holiday promotion`',
          role: 'assistant',
          type: 'error'
        });
        return;
      }

      setTimeout(() => {
        addMessage({
          content: `🔍 **Simulation Complete: "${prompt}"**

**Predicted Outcomes:**
• Estimated Reach: 15,000 users
• Expected Open Rate: 24.5%
• Projected Click Rate: 3.8%
• Conversion Estimate: 1.2%

**Resource Requirements:**
• Design Time: 2 hours
• Copy Review: 30 minutes
• QA Testing: 45 minutes

*This simulation is pending approval for implementation.*`,
          role: 'assistant',
          type: 'simulation'
        });
      }, 1500);

    } else if (trimmed.startsWith('/export')) {
      const period = trimmed.substring(8).trim() || 'current week';
      
      setTimeout(() => {
        addMessage({
          content: `📤 **Export Generated: ${period}**

• Export Type: Wrike Integration
• Activities Included: 12
• File Format: Excel (.xlsx)
• Status: Ready for Download

The export has been validated and is ready for use in your project management system.`,
          role: 'assistant',
          type: 'export'
        });
      }, 1200);

    } else if (trimmed.startsWith('/set')) {
      const rule = trimmed.substring(5).trim();
      if (!rule) {
        addMessage({
          content: '⚠️ **Missing Rule**: Please specify a governance rule to set.\n\nExample: `/set Require manager approval for campaigns over $10k`',
          role: 'assistant',
          type: 'error'
        });
        return;
      }

      // Check admin permissions
      const userRole = roles?.find(r => r.roleId === currentUser?.roleId);
      if (!userRole?.permissions.includes('roles:write')) {
        addMessage({
          content: '🔒 **Access Denied**: You need Admin permissions to configure governance rules.',
          role: 'assistant',
          type: 'error'
        });
        return;
      }

      setTimeout(() => {
        addMessage({
          content: `✅ **Governance Rule Set Successfully**

**New Rule:** ${rule}

This rule is now active and will be enforced across all campaign workflows.`,
          role: 'assistant',
          type: 'system'
        });
      }, 1000);

    } else if (trimmed.startsWith('/help') || trimmed === '/') {
      const availableCommands = [
        '• `/status` - View system status and metrics',
        '• `/simulate [description]` - Run campaign simulation',
        '• `/export [period]` - Generate export reports'
      ];

      // Add admin commands if user has permissions
      const userRole = roles?.find(r => r.roleId === currentUser?.roleId);
      if (userRole?.permissions.includes('roles:write')) {
        availableCommands.push('• `/set [rule]` - Configure governance rules');
      }

      addMessage({
        content: `🤖 **Available Commands:**

${availableCommands.join('\n')}

You can also ask me questions about your campaigns, and I'll do my best to help!`,
        role: 'assistant',
        type: 'system'
      });

    } else {
      // Handle general questions
      setTimeout(() => {
        addMessage({
          content: `💡 **I understand you're asking about: "${input}"**

I'm still learning! For now, I can help you with:
• System status and metrics
• Campaign simulations  
• Export operations
• Governance rules (if you're an admin)

Try using one of the command buttons below or type \`/help\` for a full list.`,
          role: 'assistant'
        });
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        )}
        
        <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-lg p-3 ${
            isUser 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted text-foreground'
          }`}>
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
          </div>
          
          {message.type && !isUser && (
            <div className="flex items-center gap-1 mt-1">
              {message.type === 'system' && <CheckCircle className="h-3 w-3 text-green-500" />}
              {message.type === 'error' && <AlertTriangle className="h-3 w-3 text-red-500" />}
              {message.type === 'simulation' && <Activity className="h-3 w-3 text-blue-500" />}
              {message.type === 'export' && <Send className="h-3 w-3 text-purple-500" />}
              <Badge variant="outline" className="text-xs">
                {message.type}
              </Badge>
            </div>
          )}
        </div>

        {isUser && (
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-secondary" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[500px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Vizzy AI Assistant
            <Badge variant="outline" className="text-xs">
              Beta
            </Badge>
          </SheetTitle>
          <SheetDescription>
            Your intelligent marketing campaign assistant
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {messages.map(renderMessage)}
            
            {isProcessing && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    Vizzy is thinking...
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message or command..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="icon"
                title="Send message (or press Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Command Buttons */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1"
                onClick={() => setInputValue('/status')}
                tabIndex={0}
                role="button"
                aria-label="Insert status command"
              >
                /status
              </Badge>
              
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1"
                onClick={() => setInputValue('/simulate ')}
                tabIndex={0}
                role="button"
                aria-label="Insert simulate command"
              >
                /simulate
              </Badge>
              
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1"
                onClick={() => setInputValue('/export ')}
                tabIndex={0}
                role="button"
                aria-label="Insert export command"
              >
                /export
              </Badge>
              
              {roles?.find(r => r.roleId === currentUser?.roleId)?.permissions.includes('roles:write') && (
                <Badge 
                  variant="outline" 
                  className="cursor-pointer hover:bg-muted transition-colors text-xs px-2 py-1"
                  onClick={() => setInputValue('/set ')}
                  tabIndex={0}
                  role="button"
                  aria-label="Insert set command"
                >
                  /set
                </Badge>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}