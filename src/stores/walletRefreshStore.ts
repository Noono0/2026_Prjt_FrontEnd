import { create } from "zustand";

/**
 * 상단바·지갑 표시 갱신용. 포인트가 변할 수 있는 API 성공 후 bumpWalletRefresh() 호출.
 */
type WalletRefreshState = {
    tick: number;
    bump: () => void;
};

export const useWalletRefreshStore = create<WalletRefreshState>((set) => ({
    tick: 0,
    bump: () => set((s) => ({ tick: s.tick + 1 })),
}));

export function bumpWalletRefresh(): void {
    useWalletRefreshStore.getState().bump();
}
