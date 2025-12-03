import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionTimeoutWarningProps {
  isOpen: boolean;
  timeRemaining: number;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionTimeoutWarning({
  isOpen,
  timeRemaining,
  onExtend,
  onLogout
}: SessionTimeoutWarningProps) {
  const [progress, setProgress] = useState(100);
  const [initialTime, setInitialTime] = useState(timeRemaining);

  // Store initial time when dialog opens
  useEffect(() => {
    if (isOpen && timeRemaining > 0) {
      setInitialTime(timeRemaining);
      setProgress(100);
    }
  }, [isOpen]);

  // Update progress based on remaining time
  useEffect(() => {
    if (isOpen && initialTime > 0) {
      const newProgress = (timeRemaining / initialTime) * 100;
      setProgress(Math.max(0, newProgress));
    }
  }, [timeRemaining, initialTime, isOpen]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds} seconds`;
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="w-6 h-6 text-yellow-500" />
            Session Timeout Warning
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              Your session is about to expire due to inactivity.
              You will be automatically logged out in:
            </p>

            <div className="text-center py-4">
              <span className="text-4xl font-bold text-foreground">
                {formatTime(timeRemaining)}
              </span>
            </div>

            <Progress
              value={progress}
              className="h-2"
            />

            <p className="text-sm">
              Click "Stay Logged In" to continue your session, or "Log Out" to end your session now.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onExtend}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
