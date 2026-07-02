import { useState, useEffect } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export function useConnectivite() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let subscribed = true;

    const init = async () => {
      try {
        const state = await NetInfo.fetch();
        if (subscribed) {
          setIsConnected(state.isConnected);
        }
      } catch {
        if (subscribed) {
          setIsConnected(null);
        }
      }
    };

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (subscribed) {
        setIsConnected(state.isConnected);
      }
    });

    init();

    return () => {
      subscribed = false;
      unsubscribe();
    };
  }, []);

  return { isConnected };
}
