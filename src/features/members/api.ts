import type { Member } from "@/components/members/MemberFormModal";

export type RoleItem = {
    id: number;
    role_name: string;
};

type MembersResponse = {
    items: Member[];
};

type RolesResponse = {
    items: RoleItem[];
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
    const res = await fetch(input, {
        cache: "no-store",
        ...init,
    });

    if (!res.ok) {
        let message = "요청 처리 중 오류가 발생했습니다.";
        try {
            const json = await res.json();
            message = json?.message ?? message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    return res.json() as Promise<T>;
}

export async function fetchMembers(keyword?: string): Promise<Member[]> {
    const qs = new URLSearchParams();
    if (keyword?.trim()) qs.set("q", keyword.trim());

    const url = qs.toString() ? `/api/members?${qs.toString()}` : "/api/members";
    const data = await apiFetch<MembersResponse>(url);
    return data.items ?? [];
}

export async function fetchRoles(): Promise<RoleItem[]> {
    const data = await apiFetch<RolesResponse>("/api/roles");
    return data.items ?? [];
}

export async function saveMember(member: Member, mode: "create" | "edit") {
    return apiFetch("/api/members", {
        method: mode === "create" ? "POST" : "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(member),
    });
}

export async function deleteMembers(ids: string[]) {
    const qs = new URLSearchParams();
    qs.set("ids", ids.join(","));

    return apiFetch(`/api/members?${qs.toString()}`, {
        method: "DELETE",
    });
}