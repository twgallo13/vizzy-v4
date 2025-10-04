import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

// UI (shadcn)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Bot, User, AlertTriangle, CheckCircle, X, Send } from "lucide-react";

// Data & helpers
import type { User as CoreUser } from "@/models/core";
import { writeAuditLog } from "@/lib/audit"; // must exist per SPS

// Optional: callable stubs (replace with real imports if you have them)
// import { httpsCallable } from "firebase/functions";
// import { functions } from "@/lib/firebase";
// const simulateChangeFn = httpsCallable(functions, "simulateChange");
// const setRuleFn = httpsCallable(functions, "setRule");
// const getStatusFn = httpsCallable(functions, "getStatus");

// ---- Types ----
type RoleKind = "user" | "assistant" | "system";

interface ChatMessage {
  id: string;
  role: RoleKind;
  content: string; // markdown/plain text
  type?: "error" | "info" | "diff" | "status" | "export";
  data?: any;
}

interface SimulationDiff {
  before: Record<string, any>;
  after: Record<string, any>;
}

interface PendingSimulation {
  prompt: string;
  diff: SimulationDiff;
}

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: Pick<CoreUser, "uid" | "displayName"> | null;
  // Guard helper from SPS: effective permissions = role ∪ tier
  hasPerm: (perm: string) => boolean;
}

export default function ChatDrawer({ open, onOpenChange, currentUser, hasPerm }: ChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pending, setPending] = useState<PendingSimulation | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToEnd, [messages, pending, open]);

  // ---- Message helpers ----
  function addMessage(m: Omit<ChatMessage, "id">) {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), ...m }]);
  }

  // ---- Commands ----
  async function handleSimulate(cmd: string) {
    // cmd looks like: /simulate Move Sneakerheads email to Tue 10am
    const prompt = cmd.replace(/^\/simulate\s*/i, "").trim();
    if (!prompt) {
      addMessage({ role: "assistant", type: "error", content: "⚠️ Provide a simulation prompt after `/simulate`." });
      return;
    }

    setIsProcessing(true);
    try {
      // Call your backend here instead of the stub
      // const res = await simulateChangeFn({ change: prompt });
      // const diff = (res.data as any).diff as SimulationDiff;

      // Stub diff consistent with SPS shape
      const diff: SimulationDiff = {
        before: { activity: { day: "Mon", channel: "Email", status: "draft" } },
        after: { activity: { day: "Tue", channel: "Email", status: "draft" } },
      };

      // Emit audit: AI_SIMULATE_RUN
      await writeAuditLog({
        userId: currentUser?.uid || "unknown",
        action: "AI_SIMULATE_RUN",
        targetId: "simulation",
        source: "chat",
        before: {},
        after: { simulationPrompt: prompt, diff },
      });

      setPending({ prompt, diff });
      addMessage({
        role: "assistant",
        type: "diff",
        content: `🔍 **Simulation ready.** Review the diff and **Approve** to apply.`,
        data: diff,
      });
    } catch (e) {
      addMessage({ role: "assistant", type: "error", content: "Simulation failed. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleApprove() {
    if (!pending) return;
    if (!hasPerm("planner:approve")) {
      addMessage({ role: "assistant", type: "error", content: "⛔ You don't have permission to approve simulations." });
      return;
    }
    setIsProcessing(true);
    try {
      // Apply the change server-side in real app
      // ...

      // Emit audit: AI_SIMULATE_APPROVED
      await writeAuditLog({
        userId: currentUser?.uid || "unknown",
        action: "AI_SIMULATE_APPROVED",
        targetId: "simulation",
        source: "chat",
        before: pending.diff.before,
        after: { ...pending.diff.after, approvedBy: currentUser?.displayName || "unknown" },
      });

      addMessage({ role: "assistant", type: "info", content: "✅ Simulation applied." });
      setPending(null);
    } catch (e) {
      addMessage({ role: "assistant", type: "error", content: "Failed to apply simulation." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleReject() {
    if (!pending) return;
    setIsProcessing(true);
    try {
      await writeAuditLog({
        userId: currentUser?.uid || "unknown",
        action: "AI_SIMULATE_APPROVED", // optional: could use AI_SIMULATE_REJECTED if you add it
        targetId: "simulation",
        source: "chat",
        before: pending.diff.before,
        after: { rejected: true, rejectedAt: new Date().toISOString() },
      });
      addMessage({ role: "assistant", type: "info", content: "✅ Simulation rejected." });
      setPending(null);
    } catch (e) {
      addMessage({ role: "assistant", type: "error", content: "Failed to reject simulation." });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSet(cmd: string) {
    // /set cadence Sneakerheads "max 5 per week"
    if (!hasPerm("rules:write")) {
      addMessage({ role: "assistant", type: "error", content: "⛔ Insufficient permission for `/set`." });
      return;
    }
    const rest = cmd.replace(/^\/set\s*/i, "").trim();
    if (!rest) {
      addMessage({ role: "assistant", type: "error", content: "⚠️ Provide a rule after `/set`." });
      return;
    }
    setIsProcessing(true);
    try {
      // const res = await setRuleFn({ rule: "cadence", target: "Sneakerheads", value: "max 5 per week" });
      await writeAuditLog({
        userId: currentUser?.uid || "unknown",
        action: "AI_RULE_SET",
        targetId: "governance",
        source: "chat",
        before: {},
        after: { raw: rest },
      });
      addMessage({ role: "assistant", type: "info", content: "✅ Rule updated." });
    } catch (e) {
      addMessage({ role: "assistant", type: "error", content: "Failed to set rule." });
    } finally {
      setIsProcessing(false);
    }
  }

  function processLine(line: string) {
    const trimmed = line.trim();
    if (!trimmed) return;

    // record user message
    addMessage({ role: "user", content: trimmed });

    if (trimmed.startsWith("/simulate")) return void handleSimulate(trimmed);
    if (trimmed.startsWith("/set")) return void handleSet(trimmed);

    // Help
    const help = [
      "Available commands:",
      "• `/simulate <change>` — propose a change and review the diff",
      "• `/set <rule>` — Admin only",
    ].join("\n");
    addMessage({ role: "assistant", content: help, type: "info" });
  }

  function onSubmit() {
    if (!input || isProcessing) return;
    const toSend = input;
    setInput("");
    processLine(toSend);
  }

  // ---- Render ----
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Vizzy Chat</DialogTitle>
          <DialogDescription>
            Vizzy drafts and simulates changes. Approval is required for commits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1" aria-live="polite">
          {messages.map((m) => (
            <div key={m.id} className="flex items-start gap-2">
              <div className="mt-1">{m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}</div>
              <div className="flex-1">
                <Card className="shadow-sm">
                  <CardContent className="p-3 text-sm whitespace-pre-wrap">
                    {m.content}
                    {m.type === "diff" && m.data && (
                      <div className="mt-3 text-xs">
                        <div className="font-medium">Diff (before → after)</div>
                        <Separator className="my-2" />
                        <pre className="bg-muted p-2 rounded-md overflow-x-auto" aria-label="Simulation diff">
{JSON.stringify(m.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {pending && (
          <Card className="mt-2 border-primary/40">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Changes require approval
              </CardTitle>
              <CardDescription>Review the proposed change and approve to apply.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto" aria-label="Pending simulation diff">
{JSON.stringify(pending.diff, null, 2)}
              </pre>
              <div className="flex gap-2">
                <Button
                  aria-label="Approve simulation"
                  onClick={handleApprove}
                  disabled={isProcessing || !hasPerm("planner:approve")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  aria-label="Reject simulation"
                  variant="outline"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  <X className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="gap-2">
          <div className="flex w-full gap-2">
            <Input
              aria-label="Type a message"
              placeholder="Type a message… (/simulate, /set)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
            />
            <Button aria-label="Send" onClick={onSubmit} disabled={isProcessing}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
