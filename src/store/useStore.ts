import { create } from 'zustand'

interface StoreState {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useStore = create<StoreState>((set) => ({
  // Add your state here
  count: 0,
  increment: () => set((state: StoreState) => ({ count: state.count + 1 })),
  decrement: () => set((state: StoreState) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

export default useStore
