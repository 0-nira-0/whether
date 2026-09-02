import { createContext, useContext, useState, type ReactNode } from 'react';
import { METRIC, type Units } from '../units';

type UnitsSetting = { units: Units; setUnits: (units: Units) => void };

const UnitsContext = createContext<UnitsSetting>({ units: METRIC, setUnits: () => undefined });

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setUnits] = useState<Units>(METRIC);
  return <UnitsContext.Provider value={{ units, setUnits }}>{children}</UnitsContext.Provider>;
}

export function useUnits(): UnitsSetting {
  return useContext(UnitsContext);
}
