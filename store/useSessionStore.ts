import create from 'zustand';

type State = {
  runningId: string | null;
  setRunningId: (id: string | null) => void;
};

export const useSessionStore = create<State>((set) => ({
  runningId: null,
  setRunningId: (id) => set({ runningId: id })
}));
