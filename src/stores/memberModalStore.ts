import { create } from "zustand";
import type { Member } from "@/components/members/memberTypes";

type MemberModalMode = "create" | "edit";

type MemberModalState = {
    open: boolean;
    mode: MemberModalMode;
    selected: Member | null;
    openCreate: () => void;
    openEdit: (member: Member) => void;
    close: () => void;
};

export const useMemberModalStore = create<MemberModalState>((set) => ({
    open: false,
    mode: "create",
    selected: null,

    openCreate: () =>
        set({
            open: true,
            mode: "create",
            selected: null,
        }),

    openEdit: (member) =>
        set({
            open: true,
            mode: "edit",
            selected: member,
        }),

    close: () =>
        set({
            open: false,
            mode: "create",
            selected: null,
        }),
}));
