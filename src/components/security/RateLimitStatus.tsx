import { useState, useEffect } from 'react';
import { useRateLimiter, RateLimitType } from '@/hooks/useRateLimiter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter';

interface RateLimitStatusProps {
  type: RateLimitType;
  endpoint?: string;
  showAlert?: boolean;
  className?: string;
}

export function RateLimitStatus({
  type,
  endpoint,
  showAlert = true,
  className,
}: RateLimitStatusProps) {
  const { isLimited, remaining, resetAt, retryAfter, refresh, getStatus } = useRateLimiter({
    type,
    endpoint,
  });
  const [countdown, setCountdown] = useState<number | null>(null);

  const config = RATE_LIMIT_CONFIGS[type];
  const maxRequests = config.maxRequests;
  const percentage = (remaining / maxRequests) * 100;

  useEffect(() => {
    // Initial status check
    getStatus();
  }, [getStatus]);

  useEffect(() => {
    if (!isLimited || !retryAfter) {
      setCountdown(null);
      return;
    }

    setCountdown(retryAfter);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          refresh();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLimited, retryAfter, refresh]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  if (isLimited && showAlert) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Rate Limit Exceeded</AlertTitle>
        <AlertDescription className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Please wait {countdown !== null ? formatTime(countdown) : '...'} before trying again
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {isLimited ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : remaining > maxRequests * 0.2 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Clock className="h-4 w-4 text-yellow-500" />
            )}
            Rate Limit Status
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-xs capitalize">{type} endpoint</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Requests remaining:</span>
            <Badge variant={remaining > 0 ? 'secondary' : 'destructive'}>
              {remaining} / {maxRequests}
            </Badge>
          </div>
          <Progress
            value={percentage}
            className={
              percentage > 50
                ? '[&>div]:bg-green-500'
                : percentage > 20
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-red-500'
            }
          />
          {resetAt && (
            <p className="text-xs text-muted-foreground">
              Resets at: {new Date(resetAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RateLimitWarningProps {
  type: RateLimitType;
  endpoint?: string;
  warningThreshold?: number; // Percentage at which to show warning
}

export function RateLimitWarning({
  type,
  endpoint,
  warningThreshold = 30,
}: RateLimitWarningProps) {
  const { isLimited, remaining, retryAfter, refresh, getStatus } = useRateLimiter({
    type,
    endpoint,
  });
  const [countdown, setCountdown] = useState<number | null>(null);

  const config = RATE_LIMIT_CONFIGS[type];
  const maxRequests = config.maxRequests;
  const percentage = (remaining / maxRequests) * 100;

  useEffect(() => {
    getStatus();
  }, [getStatus]);

  useEffect(() => {
    if (!isLimited || !retryAfter) {
      setCountdown(null);
      return;
    }

    setCountdown(retryAfter);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          refresh();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isLimited, retryAfter, refresh]);

  if (isLimited) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Rate limit exceeded</AlertTitle>
        <AlertDescription>
          {countdown !== null && (
            <span>Please wait {Math.floor(countdown / 60)}m {countdown % 60}s before trying again.</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (percentage > warningThreshold) {
    return null;
  }

  return (
    <Alert variant="default" className="border-yellow-500 bg-yellow-500/10">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertTitle>Rate limit warning</AlertTitle>
      <AlertDescription>
        You have {remaining} requests remaining. Please slow down to avoid being rate limited.
      </AlertDescription>
    </Alert>
  );
}

export default RateLimitStatus;
