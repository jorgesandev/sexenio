"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CsvExportPayload } from "@/lib/csv";

interface CsvExportContextValue {
  payload: CsvExportPayload | null;
  setPayload: (payload: CsvExportPayload | null) => void;
  download: () => void;
}

const CsvExportContext = createContext<CsvExportContextValue | null>(null);

export function CsvExportProvider({ children }: { children: ReactNode }) {
  const [payload, setPayload] = useState<CsvExportPayload | null>(null);

  const download = useCallback(() => {
    if (!payload) return;
    const blob = new Blob([payload.content], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = payload.filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [payload]);

  const value = useMemo(
    () => ({ payload, setPayload, download }),
    [payload, download],
  );

  return (
    <CsvExportContext.Provider value={value}>
      {children}
    </CsvExportContext.Provider>
  );
}

const fallback: CsvExportContextValue = {
  payload: null,
  setPayload: () => undefined,
  download: () => undefined,
};

export function useCsvExport(): CsvExportContextValue {
  return useContext(CsvExportContext) ?? fallback;
}

export function useRegisterCsvExport(payload: CsvExportPayload | null): void {
  const { setPayload } = useCsvExport();

  useEffect(() => {
    setPayload(payload);
    return () => setPayload(null);
  }, [payload, setPayload]);
}
