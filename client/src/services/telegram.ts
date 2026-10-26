declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
          start_param?: string;
        };
        themeParams?: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        expand: () => void;
        close: () => void;
        ready: () => void;
        openTelegramLink: (url: string) => void;
        openLink: (url: string) => void;
        HapticFeedback?: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        BackButton?: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
        MainButton?: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          onClick: (cb: () => void) => void;
          offClick: (cb: () => void) => void;
        };
      };
    };
  }
}

export const tg = {
  get isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  },

  get webApp() {
    return window.Telegram?.WebApp;
  },

  get user() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user;
  },

  get startParam(): string | undefined {
    return window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  },

  get initData(): string {
    return window.Telegram?.WebApp?.initData || '';
  },

  expand() {
    try {
      window.Telegram?.WebApp?.expand?.();
      window.Telegram?.WebApp?.ready?.();
    } catch (e) {
      console.warn('Telegram expand error:', e);
    }
  },

  haptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select' = 'light') {
    try {
      const haptic = window.Telegram?.WebApp?.HapticFeedback;
      if (!haptic) return;

      if (type === 'success' || type === 'warning' || type === 'error') {
        haptic.notificationOccurred(type);
      } else if (type === 'select') {
        haptic.selectionChanged();
      } else {
        haptic.impactOccurred(type);
      }
    } catch {
      // ignore
    }
  },

  openShare(text: string, url: string) {
    const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(fullUrl);
    } else {
      window.open(fullUrl, '_blank');
    }
  },

  setBackButton(onClick?: () => void) {
    const backBtn = window.Telegram?.WebApp?.BackButton;
    if (!backBtn) return;
    if (onClick) {
      backBtn.show();
      backBtn.onClick(onClick);
    } else {
      backBtn.hide();
    }
  },
};
