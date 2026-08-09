export {};

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready: () => void;
        close: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: string | number;
          }
        };
        platform: string;
        colorScheme: "light" | "dark";
        sendData: (data: string) => void;
      };
    };
  }
}
