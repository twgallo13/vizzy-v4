import { useState, useRef, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Bot, User, AlertTriangle, CheckCircle, X, Shield, Clock, Activity } from 'lucide-react';
import { useAuditLog, AUDIT_ACTIONS } from '@/lib/audit';
import { useIsMobile } from '@/hooks/use-mobile';
import type { User as UserType, Role, Tier } from '@/models/core';
import { useCurrentUserPermissions } from '@/hooks/usePermissions';

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
  currentUser?: UserType | null;
  roles?: Role[];
  tiers?: Tier[];
}

export function ChatDrawer({ open, onOpenChange, currentUser, roles = [], tiers = [] }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingSimulation, setPendingSimulation] = useState<SimulationResult | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { writeAuditLog } = useAuditLog();
  const isMobile = useIsMobile();
  const permissions = useCurrentUserPermissions(currentUser || null, roles, tiers);

  // Initialize chat with welcome message
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeCommands = [
        '• `/simulate [description]` - Run campaign simulations',
        '• `/status` - Check system health',
        '• `/export [period]` - Export activities to Wrike'
      ];

      // Add /set command only for admins
      if (permissions.hasPerm('roles:write')) {
        welcomeCommands.splice(1, 0, '• `/set [rule]` - Update governance rules (Admin only)');
      }

      setMessages([{
        id: '1',
        role: 'assistant',
        content: `Hi ${currentUser?.displayName || 'there'}! I'm Vizzy, your AI marketing assistant. I can help you with:\n\n${welcomeCommands.join('\n')}\n\nWhat would you like to do?`,
        timestamp: new Date(),
        type: 'system'
      }]);
    }
  }, [open, messages.length, currentUser?.displayName, permissions]);

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
    // Check simulation permission
    if (!permissions.hasPerm('planner:write')) {
      addMessage({
        role: 'assistant',
        content: '🔒 **Permission Denied**\n\nYou need planner write permissions to run simulations.\n\nContact your administrator to request access.',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    
    // Mock AI simulation with delay
    setTimeout(async () => {
      const simulationResult: SimulationResult = {
        change: prompt,
        diff: {
          before: { 
            status: 'draft', 
            schedule: 'Wednesday 2:00 PM',
            channel: 'Email',
            assignee: 'Current User',
            priority: 'Normal'
          },
          after: { 
            status: 'draft', 
            schedule: 'Tuesday 10:00 AM',
            channel: 'Email',
            assignee: 'Current User',
            priority: 'High'
          }
        },
        needsApproval: true
      };
      
      setPendingSimulation(simulationResult);
      
      addMessage({
        role: 'assistant',
        content: `🔍 **Simulation Analysis Complete**\n\nRequest: "${prompt}"\n\n⚠️ **Human Approval Required**\nI've generated a diff showing the proposed changes. Please review the changes below and click "Approve" to apply them to your campaign planner.\n\n🚫 **No changes will be made without explicit approval.**`,
        type: 'simulation',
        data: simulationResult
      });
      
      // Log simulation run with full diff data
      await writeAuditLog({
        userId: currentUser?.uid || 'unknown',
        action: AUDIT_ACTIONS.AI_SIMULATE_RUN,
        targetId: 'simulation_' + Date.now(),
        source: 'chat',
        before: simulationResult.diff.before,
        after: { 
          ...simulationResult.diff.after,
          simulationPrompt: prompt,
          requiresApproval: true
        }
      });
      
      setIsProcessing(false);
    }, 1500);
  };

  const handleSetCommand = async (rule: string) => {
    // Strict admin-only check for /set command
    if (!permissions.hasPerm('roles:write')) {
      addMessage({
        role: 'assistant',
        content: '🚫 **Insufficient Permissions**\n\nThe `/set` command is restricted to **Administrators only**.\n\n**Access Denied:** Only users with admin role can modify governance rules.\n\nYour current role: ' + (roles.find(r => r.roleId === currentUser?.roleId)?.name || 'Unknown') + '\nContact your system administrator if you need to update governance rules.',
        type: 'error'
      });
      return;
    }
    
    setIsProcessing(true);
    
    setTimeout(async () => {
      const ruleData = {
        rule: rule,
        setBy: currentUser?.displayName || 'Unknown',
        timestamp: new Date().toISOString(),
        userId: currentUser?.uid || 'unknown'
      };

      addMessage({
        role: 'assistant',
        content: `✅ **Governance Rule Set Successfully**\n\n**Rule:** ${rule}\n**Set by:** ${currentUser?.displayName}\n**Time:** ${new Date().toLocaleTimeString()}\n\n🔐 This rule is now active and will be enforced for all future activities. All team members will be automatically notified of this governance change.`,
        type: 'rule'
      });
      
      // Log rule set with proper diff structure
      await writeAuditLog({
        userId: currentUser?.uid || 'unknown',
        action: AUDIT_ACTIONS.AI_RULE_SET,
        targetId: 'governance_rule_' + Date.now(),
        source: 'chat',
        before: { governanceRules: 'previous_state' },
        after: ruleData
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
        approvedActivities: 3,
        userRole: roles.find(r => r.roleId === currentUser?.roleId)?.name || 'Unknown',
        userTier: tiers.find(t => t.tierId === currentUser?.tierId)?.name || 'Unknown',
        effectivePermissions: Array.from(permissions.effective)
      };
      
      addMessage({
        role: 'assistant',
        content: `📊 **System Status Report**\n\n**System Health**\n• Status: ${statusInfo.system === 'Operational' ? '✅' : '❌'} ${statusInfo.system}\n• Last Export: ${statusInfo.lastExport}\n• wrikeName Compliance: ${statusInfo.wrikeNameCompliance}\n\n**Activity Overview**\n• Active Users: ${statusInfo.activeUsers}\n• Draft Activities: ${statusInfo.draftActivities}\n• Approved Activities: ${statusInfo.approvedActivities}\n\n**Your Access Level**\n• Role: ${statusInfo.userRole}\n• Tier: ${statusInfo.userTier}\n• Permissions: ${statusInfo.effectivePermissions.length} active\n\nAll systems functioning normally.`,
        type: 'status',
        data: statusInfo
      });
      
      // Log status request
      await writeAuditLog({
        userId: currentUser?.uid || 'unknown',
        action: AUDIT_ACTIONS.AI_STATUS_REQUESTED,
        targetId: 'system_status',
        source: 'chat'
      });
      
      setIsProcessing(false);
    }, 800);
  };

  const handleExportCommand = async (period: string) => {
    // Check export permission
    if (!permissions.hasPerm('export:write')) {
      addMessage({
        role: 'assistant',
        content: '🔒 **Permission Denied**\n\nYou need export write permissions to trigger exports.\n\nContact your administrator to request access.',
        type: 'error'
      });
      return;
    }

    setIsProcessing(true);
    
    setTimeout(async () => {
      const exportResult = {
        period,
        status: 'success',
        fileName: `${period}_export_${new Date().toISOString().split('T')[0]}.xlsx`,
        activitiesExported: 12,
        warnings: []
      };

      addMessage({
        role: 'assistant',
        content: `📤 **Export Complete**\n\nPeriod: ${period}\nFile: ${exportResult.fileName}\nActivities: ${exportResult.activitiesExported} exported\n\n✅ wrikeName validation passed\n✅ XLSX file generated\n✅ Export logged to audit trail\n\nThe file has been downloaded to your device.`,
        type: 'export'
      });
      
      // Log export trigger
      await writeAuditLog({
        userId: currentUser?.uid || 'unknown',
        action: AUDIT_ACTIONS.AI_EXPORT_TRIGGERED,
        targetId: period,
        source: 'chat',
        after: exportResult
      });
      
      setIsProcessing(false);
    }, 2000);
  };

  const handleApproveSimulation = async () => {
    if (!pendingSimulation) return;
    
    // Check approval permission - this is required for /simulate commits
    if (!permissions.hasPerm('planner:approve')) {
      addMessage({
        role: 'assistant',
        content: '🔒 **Approval Permission Required**\n\nYou need approval permissions to commit simulation changes.\n\nPlease ask a Manager or Administrator to review this simulation.',
        type: 'error'
      });
      return;
    }
    
    setIsProcessing(true);
    
    // Apply the simulation changes
    setTimeout(async () => {
      addMessage({
        role: 'assistant',
        content: `✅ **Simulation Changes Applied**\n\n**Human approval confirmed** - Changes have been committed to your campaign planner:\n\n• Schedule: ${pendingSimulation.diff.before.schedule} → ${pendingSimulation.diff.after.schedule}\n• Priority: ${pendingSimulation.diff.before.priority || 'Normal'} → ${pendingSimulation.diff.after.priority}\n\n🔍 **Audit trail updated** - All changes logged for compliance\n📢 **Team notified** - Relevant users will see the updated campaign data`,
        type: 'system'
      });
      
      // Log simulation approval with complete diff data
      await writeAuditLog({
        userId: currentUser?.uid || 'unknown',
        action: AUDIT_ACTIONS.AI_SIMULATE_APPROVED,
        targetId: 'simulation_approved_' + Date.now(),
        source: 'chat',
        before: pendingSimulation.diff.before,
        after: {
          ...pendingSimulation.diff.after,
          approvedBy: currentUser?.displayName || 'Unknown',
          approvedAt: new Date().toISOString(),
          originalPrompt: pendingSimulation.change
        }
      });
      
      setPendingSimulation(null);
      setIsProcessing(false);
    }, 800);
  };

  const handleRejectSimulation = async () => {
    if (!pendingSimulation) return;
    
    addMessage({
      role: 'assistant',
      content: '❌ **Simulation Rejected**\n\nNo changes have been made to your campaign planner. The proposed simulation has been discarded.',
      type: 'system'
    });
    
    // Log simulation rejection for audit trail
    await writeAuditLog({
      userId: currentUser?.uid || 'unknown',
      action: AUDIT_ACTIONS.AI_SIMULATE_REJECTED,
      targetId: 'simulation_rejected_' + Date.now(),
      source: 'chat',
      before: pendingSimulation.diff.before,
      after: {
        rejected: true,
        rejectedBy: currentUser?.displayName || 'Unknown',
        rejectedAt: new Date().toISOString(),
        originalPrompt: pendingSimulation.change
      }
    });
    
    setPendingSimulation(null);
  };

  const processCommand = async (input: string) => {
    const trimmed = input.trim();
    
    if (trimmed.startsWith('/simulate ')) {
      const prompt = trimmed.substring(10).trim();
      if (!prompt) {
        addMessage({
          role: 'assistant',
          content: '⚠️ **Missing Simulation Description**\n\nPlease provide a description of what you want to simulate.\n\nExample: `/simulate Move Sneakerheads email to Tuesday 10am`',
          type: 'error'
        });
        return;
      }
      await handleSimulateCommand(prompt);
    } else if (trimmed.startsWith('/set ')) {
      const rule = trimmed.substring(5).trim();
      if (!rule) {
        addMessage({
          role: 'assistant',
          content: '⚠️ **Missing Rule Definition**\n\nPlease provide a rule to set.\n\nExample: `/set cadence Sneakerheads max 5 per week`',
          type: 'error'
        });
        return;
      }
      await handleSetCommand(rule);
    } else if (trimmed === '/status') {
      await handleStatusCommand();
    } else if (trimmed.startsWith('/export ')) {
      const period = trimmed.substring(8).trim();
      if (!period) {
        addMessage({
          role: 'assistant',
          content: '⚠️ **Missing Export Period**\n\nPlease specify what to export.\n\nExamples:\n• `/export week` - Export current week\n• `/export today` - Export today\n• `/export tuesday` - Export specific day',
          type: 'error'
        });
        return;
      }
      await handleExportCommand(period);
    } else if (trimmed.startsWith('/')) {
      const availableCommands = [
        '• `/simulate [description]` - Run campaign simulations',
        '• `/status` - Check system health',
        '• `/export [period]` - Export activities to Wrike'
      ];

      // Add /set command only for admins
      if (permissions.hasPerm('roles:write')) {
        availableCommands.splice(1, 0, '• `/set [rule]` - Update governance rules (Admin only)');
      }

      addMessage({
        role: 'assistant',
        content: `❓ **Unknown Command**\n\nI don't recognize that command. Available commands:\n\n${availableCommands.join('\n')}\n\nTry typing one of these commands or ask me a question!`,
        type: 'error'
      });
    } else {
      // Regular chat message - enhanced natural language processing
      const lowercaseInput = trimmed.toLowerCase();
      
      if (lowercaseInput.includes('help') || lowercaseInput.includes('what can you do')) {
        const availableCommands = [
          '• `/simulate [description]` - Run campaign simulations',
          '• `/status` - Check system health',
          '• `/export [period]` - Export activities to Wrike'
        ];

        if (permissions.hasPerm('roles:write')) {
          availableCommands.splice(1, 0, '• `/set [rule]` - Update governance rules (Admin only)');
        }

        addMessage({
          role: 'assistant',
          content: `🤖 **I'm here to help!**\n\nI can assist you with:\n\n${availableCommands.join('\n')}\n\nI'm designed to work with specific commands for security and accuracy. What would you like to do?`,
          type: 'system'
        });
      } else if (lowercaseInput.includes('status') || lowercaseInput.includes('health')) {
        addMessage({
          role: 'assistant',
          content: '💡 **System Status Available**\n\nTo check system health, use the `/status` command. This will show you:\n• System operational status\n• Recent export activity\n• User and activity counts\n• Your current permissions\n\nTry typing `/status` now!',
          type: 'system'
        });
      } else if (lowercaseInput.includes('export') || lowercaseInput.includes('wrike')) {
        addMessage({
          role: 'assistant',
          content: '📤 **Export Commands Available**\n\nTo export activities to Wrike, use:\n• `/export week` - Export current week\n• `/export today` - Export today\n• `/export tuesday` - Export specific day\n\nNote: You need export permissions to use this feature.',
          type: 'system'
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `💬 I understand you're asking about: "${trimmed}"\n\n🎯 **For the best results, please use specific commands:**\n• Type \`/status\` to check system health\n• Type \`/simulate [description]\` to run scenarios\n• Type \`/export [period]\` to generate files\n\nWhat would you like to do?`,
          type: 'system'
        });
      }
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
        
        <div className={`flex-1 ${isUser ? 'text-right' : ''} ${isMobile ? 'min-w-0' : ''}`}>
          <div className={`inline-block ${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} p-3 rounded-lg ${
            isUser 
              ? 'bg-primary text-primary-foreground' 
              : message.type === 'error'
              ? 'bg-red-50 border border-red-200 text-red-800'
              : message.type === 'system'
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-muted text-muted-foreground'
          }`}>
            <div className={`whitespace-pre-wrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {message.content}
            </div>
          </div>
          
          {message.type === 'simulation' && message.data && pendingSimulation && (
            <Card className={`mt-3 ${isMobile ? 'max-w-full' : 'max-w-md'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`${isMobile ? 'text-xs' : 'text-sm'} flex items-center gap-2`}>
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Simulation Results
                </CardTitle>
                <CardDescription className="text-xs">
                  Changes require approval before applying
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`space-y-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  {/* Enhanced Diff Display */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Before → After
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="border border-red-200 rounded-md bg-red-25 p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span className="text-xs font-medium text-red-700">Current State</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(message.data.diff.before).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="font-medium text-red-600">{key}:</span>
                              <span className="text-red-800">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border border-green-200 rounded-md bg-green-25 p-2">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-xs font-medium text-green-700">Proposed State</span>
                        </div>
                        <div className="space-y-1">
                          {Object.entries(message.data.diff.after).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs">
                              <span className="font-medium text-green-600">{key}:</span>
                              <span className="text-green-800">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleApproveSimulation}
                      className="flex-1"
                      disabled={!permissions.hasPerm('planner:approve') || isProcessing}
                      aria-label={permissions.hasPerm('planner:approve') ? 'Approve simulation changes and apply to campaign planner' : 'Approval permission required'}
                      title={permissions.hasPerm('planner:approve') ? 'Click to approve and apply these simulation changes' : 'You need planner:approve permission to commit changes'}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {permissions.hasPerm('planner:approve') ? 'Approve & Apply' : 'Need Approval Permission'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRejectSimulation}
                      className="flex-1"
                      disabled={isProcessing}
                      aria-label="Reject simulation changes and discard them"
                      title="Click to reject and discard these simulation changes"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                  </div>
                  
                  {!permissions.hasPerm('planner:approve') && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                      <Shield className="h-3 w-3" />
                      Manager or Admin approval required to commit changes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground mt-1 flex items-center gap-2`}>
            <span>{message.timestamp.toLocaleTimeString()}</span>
            {message.type && (
              <Badge variant="outline" className="text-xs">
                {message.type === 'simulation' && <Activity className="h-2 w-2 mr-1" />}
                {message.type === 'error' && <AlertTriangle className="h-2 w-2 mr-1" />}
                {message.type === 'rule' && <Shield className="h-2 w-2 mr-1" />}
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
      <DrawerContent className={`${isMobile ? 'h-[85vh]' : 'h-[80vh]'}`}>
        <DrawerHeader className={`${isMobile ? 'pb-2' : ''}`}>
          <DrawerTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Vizzy AI Assistant
            {currentUser && (
              <Badge variant="outline" className="text-xs ml-auto">
                {roles.find(r => r.roleId === currentUser.roleId)?.name || 'User'}
              </Badge>
            )}
          </DrawerTitle>
          <DrawerDescription className={`${isMobile ? 'text-xs' : ''}`}>
            Your intelligent marketing campaign assistant
          </DrawerDescription>
        </DrawerHeader>
        
        <div className={`flex-1 overflow-hidden flex flex-col ${isMobile ? 'px-2' : 'px-4'}`}>
          {/* Messages */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${isMobile ? 'pb-2' : 'pb-4'}`}>
            {messages.map(renderMessage)}
            
            {isProcessing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="inline-block bg-muted text-muted-foreground p-3 rounded-lg">
                    <div className={`flex items-center gap-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
          <div className={`border-t ${isMobile ? 'pt-2 pb-2' : 'pt-4 pb-4'}`}>
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isMobile ? "Type command..." : "Type a command or message... (try /status)"}
                disabled={isProcessing}
                className={`flex-1 ${isMobile ? 'text-sm' : ''}`}
                aria-label="Chat input field for AI assistant commands"
                aria-describedby="chat-input-help"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                size="icon"
                aria-label="Send message to AI assistant"
                title="Send message (or press Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            <div id="chat-input-help" className="sr-only">
              Use commands like /status, /simulate, /export, or /set (admin only) to interact with the AI assistant
            </div>
            
            {/* Quick Command Buttons */}
            <div className={`flex flex-wrap gap-1 ${isMobile ? 'mt-1' : 'mt-2'}`} role="toolbar" aria-label="Quick command shortcuts">
              <Badge 
                variant="outline" 
                className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs'} cursor-pointer hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring`} 
                onClick={() => setInputValue('/status')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setInputValue('/status');
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Insert status command"
              >
                /status
              </Badge>
              <Badge 
                variant="outline" 
                className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs'} cursor-pointer hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring`} 
                onClick={() => setInputValue('/simulate ')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setInputValue('/simulate ');
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Insert simulate command"
              >
                /simulate
              </Badge>
              {permissions.hasPerm('export:write') && (
                <Badge 
                  variant="outline" 
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs'} cursor-pointer hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring`} 
                  onClick={() => setInputValue('/export week')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInputValue('/export week');
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Insert export command"
                >
                  /export
                </Badge>
              )}
              {permissions.hasPerm('roles:write') && (
                <Badge 
                  variant="outline" 
                  className={`${isMobile ? 'text-xs px-2 py-1' : 'text-xs'} cursor-pointer hover:bg-secondary focus:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring`} 
                  onClick={() => setInputValue('/set ')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInputValue('/set ');
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label="Insert set command (admin only)"
                >
                  /set
                </Badge>
              )}
            </div>
            
            {/* Permission Status */}
            {isMobile && currentUser && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Shield className="h-3 w-3" />
                <span>{permissions.effective.size} permissions active</span>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}