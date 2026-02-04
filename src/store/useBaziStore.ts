import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserInput, BaziReport } from '../types';

interface BaziState {
  currentInput: UserInput | null;
  currentReport: BaziReport | null;
  history: { input: UserInput; report: BaziReport; id: string; timestamp: number }[];
  
  setInput: (input: UserInput) => void;
  setReport: (report: BaziReport) => void;
  saveRecord: () => void;
  deleteRecord: (id: string) => void;
}

export const useBaziStore = create<BaziState>()(
  persist(
    (set, get) => ({
      currentInput: null,
      currentReport: null,
      history: [],
      
      setInput: (input) => set({ currentInput: input }),
      setReport: (report) => set({ currentReport: report }),
      saveRecord: () => {
        const { currentInput, currentReport, history } = get();
        if (!currentInput || !currentReport) return;
        
        const newRecord = {
          input: currentInput,
          report: currentReport,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        };
        
        set({ history: [newRecord, ...history].slice(0, 50) });
      },
      deleteRecord: (id) => set({ history: get().history.filter(h => h.id !== id) }),
    }),
    {
      name: 'bazi-storage',
    }
  )
);
