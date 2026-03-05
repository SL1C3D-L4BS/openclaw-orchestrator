"use client";

import { createContext, useContext, type ReactNode } from "react";

interface SimulationContextValue {
  activeNodeId: string | null;
}

const SimulationContext = createContext<SimulationContextValue>({
  activeNodeId: null,
});

export function SimulationProvider({
  activeNodeId,
  children,
}: {
  activeNodeId: string | null;
  children: ReactNode;
}) {
  return (
    <SimulationContext.Provider value={{ activeNodeId }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  return useContext(SimulationContext);
}
