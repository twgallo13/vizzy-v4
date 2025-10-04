import { useState, useRef, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Send, Bot, User, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useAuditLog, AUDIT_ACTIONS } from '@/lib/audit';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'simulation' | 'rule' | 'status' | 'export' | 'error' | 'system';
  data?: any;
}

interface SimulationResult {
  change: string;
  diff: {
    before: any;
    after: any;
  };
  needsApproval?: boolean;
}

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatDrawer({ open, onOpenChange }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Vizzy, your AI marketing assistant. I can help you with:\n\n• `/simulate` - Run campaign simulations\n• `/set` - Update governance rules (Admin only)\n• `/status` - Check system health\n• `/export` - Export activities to Wrike\n\nWhat would you like to do?',
      timestamp: new Date(),
      type: 'system'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSimulation, setPendingSimulation] = useState<SimulationResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { writeAuditLog } = useAuditLog();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSimulateCommand = async (prompt: string) => {
    setIsProcessing(true);
    
    // Mock AI simulation with delay
    setTimeout(async () => {
      const simulationResult: SimulationResult = {
        change: prompt,
        diff: {
          before: { status: 'draft', schedule: 'Wednesday' },
          after: { status: 'draft', schedule: 'Tuesday 10:00 AM' }
        },
        needsApproval: true
      };
      
      setPendingSimulation(simulationResult);
      
      addMessage({
        role: 'assistant',
        content: `I've analyzed your request: "${prompt}"\n\nHere's what would change:`,
        type: 'simulation',
        data: simulationResult
      });
      
      // Log simulation run
      await writeAuditLog({
        userId: 'u_1',
        action: AUDIT_ACTIONS.AI_SIMULATE_RUN,
        targetId: 'simulation_' + Date.now(),
        source: 'chat',
        after: simulationResult
      });
      
      setIsProcessing(false);
    }, 1500);
  };

  const handleSetCommand = async (rule: string) => {
    // Check if user is admin (mock check)
    const isAdmin = true; // In real app, check user permissions
    
    if (!isAdmin) {
      addMessage({
        role: 'assistant',
        content: 'Permission denied. Only administrators can use the `/set` command.',
        type: 'error'
      });
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(async () => {
      addMessage({
        role: 'assistant',
        content: `Governance rule updated: ${rule}\n\nThe new rule is now active and will be enforced for all future activities.`,
        type: 'rule'
      });
      
      // Log rule set
      await writeAuditLog({
        userId: 'u_1',
        action: AUDIT_ACTIONS.AI_RULE_SET,
        targetId: 'governance_rule',
        source: 'chat',
        after: { rule, timestamp: new Date().toISOString() }
      });
      
      setIsProcessing(false);
    }, 1000);
  };

  const handleStatusCommand = async () => {
    setIsProcessing(true);
    
    setTimeout(async () => {
      const statusInfo = {
        system: 'Operational',
        lastExport: '2 hours ago',
        wrikeNameCompliance: '100%',
        activeUsers: 3,
        draftActivities: 2,
        approvedActivities: 3
      };
      
      addMessage({
        role: 'assistant',
        content: 'System Status Report:\n\n• System Health: ✅ Operational\n• Last Export: 2 hours ago\n• wrikeName Compliance: 100%\n• Active Users: 3\n• Draft Activities: 2\n• Approved Activities: 3\n\nAll systems functioning normally.',
        type: 'status',
        data: statusInfo
      });
      
      // Log status request
      await writeAuditLog({
        userId: 'u_1',  
        action: AUDIT_ACTIONS.AI_STATUS_REQUESTED,
        targetId: 'system_status',
        source: 'chat'
      });
      
      setIsProcessing(false);
    }, 800);
  };

  const handleExportCommand = async (period: string) => {
    setIsProcessing(true);
    
    setTimeout(async () => {
      addMessage({
        role: 'assistant',
        content: `Export initiated for ${period}.\n\nChecking wrikeName validation for all assigned users... ✅\nGenerating XLSX file... ✅\n\nExport complete! The file has been downloaded to your device.`,
        type: 'export'
      });
      
      // Log export trigger
      await writeAuditLog({
        userId: 'u_1',
        action: AUDIT_ACTIONS.AI_EXPORT_TRIGGERED,
        targetId: period,
        source: 'chat'
      });
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleApproveSimulation = async () => {
    if (!pendingSimulation) return;
    
    addMessage({
      role: 'assistant',
      content: `✅ Simulation approved and changes have been applied.\n\nThe requested changes are now live in your campaign planner.`,
      type: 'system'
    });
    
    // Log simulation approval
    await writeAuditLog({
      userId: 'u_1',
      action: AUDIT_ACTIONS.AI_SIMULATE_APPROVED,
      targetId: 'simulation_approved',
      source: 'chat',
      before: pendingSimulation.diff.before,
      after: pendingSimulation.diff.after
    });
    
    setPendingSimulation(null);
  };

  const handleRejectSimulation = () => {
    addMessage({
      role: 'assistant',
      content: '❌ Simulation rejected. No changes have been made to your campaign planner.',
      type: 'system'
    });
    
    setPendingSimulation(null);
  };

  const processCommand = async (input: string) => {
    if (input.startsWith('/simulate ')) {
      const prompt = input.substring(10);
      await handleSimulateCommand(prompt);
    } else if (input.startsWith('/set ')) {
      const rule = input.substring(5);
      await handleSetCommand(rule);
    } else if (input === '/status') {
      await handleStatusCommand();
    } else if (input.startsWith('/export ')) {
      const period = input.substring(8);
      await handleExportCommand(period);
    } else if (input.startsWith('/')) {
      addMessage({
        role: 'assistant',
        content: 'Unknown command. Available commands:\n\n• `/simulate [description]` - Run campaign simulations\n• `/set [rule]` - Update governance rules (Admin only)\n• `/status` - Check system health\n• `/export [period]` - Export activities to Wrike',
        type: 'error'
      });
    } else {
      // Regular chat message
      addMessage({
        role: 'assistant',
        content: `I understand you're asking about: "${input}"\n\nFor now, I work best with specific commands. Try using:\n• \`/simulate\` to run campaign scenarios\n• \`/status\` to check system health\n• \`/export\` to generate Wrike files\n\nWhat would you like to do?`,
        type: 'system'
      });
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;
    
    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    addMessage({
      role: 'user',
      content: userMessage
    });
    
    // Process the command/message
    await processCommand(userMessage);
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
      <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block max-w-[80%] p-3 rounded-lg ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <div className="whitespace-pre-wrap text-sm">
              {message.content}
            </div>
          </div>
          
          {message.type === 'simulation' && message.data && pendingSimulation && (
            <Card className="mt-3 max-w-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Simulation Results
                </CardTitle>
                <CardDescription className="text-xs">
                  Changes require approval before applying
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-medium text-red-600">Before:</span>
                    <pre className="bg-red-50 p-2 rounded mt-1 text-xs">
                      {JSON.stringify(message.data.diff.before, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">After:</span>
                    <pre className="bg-green-50 p-2 rounded mt-1 text-xs">
                      {JSON.stringify(message.data.diff.after, null, 2)}
                    </pre>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button 
                    size="sm" 
                    onClick={handleApproveSimulation}
                    className="flex-1"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRejectSimulation}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="text-xs text-muted-foreground mt-1">
            {message.timestamp.toLocaleTimeString()}
            {message.type && (
              <Badge variant="outline" className="ml-2 text-xs">
                {message.type}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Vizzy AI Assistant
          </DrawerTitle>
          <DrawerDescription>
            Your intelligent marketing campaign assistant
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col px-4">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map(renderMessage)}
            
            {isProcessing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-muted text-muted-foreground p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                      Vizzy is thinking...
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input */}
          <div className="border-t pt-4 pb-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a command or message... (try /status)"
                disabled={isProcessing}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setInputValue('/status')}>
                /status
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setInputValue('/simulate ')}>
                /simulate
              </Badge>
              <Badge variant="outline" className="text-xs cursor-pointer" onClick={() => setInputValue('/export week')}>
                /export
              </Badge>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}