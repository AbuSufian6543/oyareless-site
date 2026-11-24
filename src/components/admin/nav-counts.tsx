"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type NavCounts = {
  newSubmissions: number;
  newQuotes: number;
  newApplications: number;
  unreadNotifications: number;
  openTickets: number;
  openTasks: number;
};

const ReadCounts = createContext<NavCounts | null>(null);
const WriteCounts = createContext<(counts: NavCounts) => void>(() => {});

export function NavCountProvider({ children }: { children: ReactNode }) {
  const [counts, setCounts] = useState<NavCounts | null>(null);
  return (
    <WriteCounts.Provider value={setCounts}>
      <ReadCounts.Provider value={counts}>{children}</ReadCounts.Provider>
    </WriteCounts.Provider>
  );
}

export function NavCountBridge({ counts }: { counts: NavCounts }) {
  const setCounts = useContext(WriteCounts);
  useEffect(() => {
    setCounts(counts);
  }, [counts, setCounts]);
  return null;
}

export function useNavCounts() {
  return useContext(ReadCounts);
}
