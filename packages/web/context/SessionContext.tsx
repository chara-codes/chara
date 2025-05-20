"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { trpc } from "@/utils/trpc";

interface SessionContextType {
  session: {
    id: string;
    username: string;
    createdAt: Date;
    lastAccessed: Date;
  } | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionContextType["session"]>(() => {
    // Try to load from localStorage on initial render (client-side only)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("session");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert ISO strings back to Date objects
        return {
          ...parsed,
          createdAt: new Date(parsed.createdAt),
          lastAccessed: new Date(parsed.lastAccessed),
        };
      }
      return null;
    }
    return null;
  });

  const { data: sessionData } = trpc.sessions.getOrCreate.useQuery(
    {
      sessionId: session?.id,
    },
    {
      // Disable auto-refetching
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  useEffect(() => {
    if (sessionData) {
      // Parse dates when setting the session state
      const parsed = {
        ...sessionData,
        createdAt: new Date(sessionData.createdAt),
        lastAccessed: new Date(sessionData.lastAccessed),
      };
      setSession(parsed);
      localStorage.setItem("session", JSON.stringify(parsed, (key, value) => {
        // Convert dates to ISO strings when storing in localStorage
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      }));
    }
  }, [sessionData]);

  return (
    <SessionContext.Provider value={{ session }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
