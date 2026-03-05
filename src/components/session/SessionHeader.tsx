import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Pause, RotateCcw } from "lucide-react";

interface Props {
  isRunning: boolean;
  onStop: () => void;
  onReset: () => void;
}

export function SessionHeader({ isRunning, onStop, onReset }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium text-foreground">Live Session</span>
        <span className="text-xs text-muted-foreground">— Code Review Pipeline</span>
        {isRunning && (
          <Badge variant="outline" className="bg-agent-coder/20 text-agent-coder text-[10px] ml-2">
            Running
          </Badge>
        )}
      </div>
      <div className="flex gap-1">
        {isRunning && (
          <Button variant="ghost" size="sm" onClick={onStop} className="h-7 text-xs">
            <Pause className="h-3 w-3 mr-1" />
            Stop
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs">
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset
        </Button>
      </div>
    </div>
  );
}
