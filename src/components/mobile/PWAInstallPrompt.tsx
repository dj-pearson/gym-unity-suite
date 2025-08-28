import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  X, 
  Share,
  Plus,
  Globe
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      setIsInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };

    checkInstalled();

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
      
      // Show prompt after a delay if not installed
      setTimeout(() => {
        if (!isInstalled && !localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA install accepted');
      } else {
        console.log('PWA install dismissed');
      }
      
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('PWA install error:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const getInstallInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;

    if (isIOS && isSafari) {
      return {
        icon: Globe,
        title: "Install on iOS",
        steps: [
          "Tap the Share button",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to install the app"
        ]
      };
    }

    if (isChrome) {
      return {
        icon: Globe,
        title: "Install on Chrome",
        steps: [
          "Tap the menu (three dots)",
          "Select 'Add to Home screen'",
          "Tap 'Add' to install"
        ]
      };
    }

    return {
      icon: Smartphone,
      title: "Install App",
      steps: [
        "Look for the install option in your browser menu",
        "Tap 'Add to Home Screen' or 'Install'",
        "Follow the prompts to install"
      ]
    };
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Show manual instructions if browser doesn't support auto-install
  if (showPrompt && !canInstall) {
    const instructions = getInstallInstructions();
    const Icon = instructions.icon;

    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 md:hidden shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">{instructions.title}</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Install RepClub for quick access and offline features
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 mb-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                  {index + 1}
                </Badge>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={handleDismiss} className="w-full">
            Got it
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show install prompt with native support
  if (showPrompt && canInstall) {
    return (
      <Card className="fixed bottom-20 left-4 right-4 z-50 md:hidden shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <CardTitle className="text-base">Install RepClub</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription>
            Get quick access to your gym with our mobile app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}