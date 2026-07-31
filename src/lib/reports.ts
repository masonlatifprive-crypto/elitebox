/**
 * Local report queue — user-submitted addon/metadata issue reports.
 *
 * Reports stay on-device (localStorage ring, newest first, capped at 100)
 * until a backend moderation endpoint exists. The admin surface at
 * /app/admin reads this queue. Honest by design: submitting a report tells
 * the user it is stored locally and will be sent once sync is configured.
 */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ReportEntry {
  id: string;
  kind: 'addon' | 'metadata' | 'stream';
  subjectId: string; // addon id or title id
  subjectName: string;
  note: string;
  createdAt: number;
}

interface ReportsState {
  reports: ReportEntry[];
  addReport: (entry: Omit<ReportEntry, 'id' | 'createdAt'>) => void;
  removeReport: (id: string) => void;
  clearReports: () => void;
}

const MAX_REPORTS = 100;

export const useReports = create<ReportsState>()(
  persist(
    (set) => ({
      reports: [],
      addReport: (entry) =>
        set((s) => ({
          reports: [
            {
              ...entry,
              id: `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: Date.now(),
            },
            ...s.reports,
          ].slice(0, MAX_REPORTS),
        })),
      removeReport: (id) => set((s) => ({ reports: s.reports.filter((r) => r.id !== id) })),
      clearReports: () => set({ reports: [] }),
    }),
    {
      name: 'elitebox.v1.reports',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
