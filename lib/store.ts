import { create } from "zustand";

interface AppStore {
  selectedProjectId: string | null;
  selectedTestId: string | null;
  activeFilters: {
    service: string[];
    level: string[];
    search: string;
  };
  wsConnectionState: "connecting" | "connected" | "disconnected" | "error";
  sidebarCollapsed: boolean;
  commandBarOpen: boolean;
  setSelectedProjectId: (id: string | null) => void;
  setSelectedTestId: (id: string | null) => void;
  setActiveFilters: (filters: Partial<AppStore["activeFilters"]>) => void;
  setWsConnectionState: (state: AppStore["wsConnectionState"]) => void;
  toggleSidebar: () => void;
  setCommandBarOpen: (open: boolean) => void;
}

export const useStore = create<AppStore>((set) => ({
  selectedProjectId: null,
  selectedTestId: null,
  activeFilters: {
    service: [],
    level: [],
    search: "",
  },
  wsConnectionState: "disconnected",
  sidebarCollapsed: false,
  commandBarOpen: false,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),
  setSelectedTestId: (id) => set({ selectedTestId: id }),
  setActiveFilters: (filters) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, ...filters },
    })),
  setWsConnectionState: (wsConnectionState) => set({ wsConnectionState }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setCommandBarOpen: (open) => set({ commandBarOpen: open }),
}));
