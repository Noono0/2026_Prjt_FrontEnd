import { defaultApiRequestInit } from "@/lib/http/requestInit";
import { ApiError } from "@/features/boards/api";
import type {
    CalendarEventView,
    CalendarRangeRequest,
    CalendarScheduleDetail,
    CalendarScheduleSaveBody,
    ScheduleCategoryOption,
} from "./types";

type ApiResponse<T> = {
    success: boolean;
    code?: string;
    message?: string;
    data: T;
};

async function apiFetch<T>(input: RequestInfo, init?: RequestInit): Promise<ApiResponse<T>> {
    const res = await fetch(input, {
        ...defaultApiRequestInit,
        ...init,
    });

    let json: ApiResponse<T> | null = null;

    try {
        json = (await res.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError("응답 형식이 올바르지 않습니다.");
    }

    if (!res.ok || !json.success) {
        throw new ApiError(json?.message ?? "요청 처리 중 오류가 발생했습니다.");
    }

    return json;
}

export async function fetchCalendarScheduleCategories(): Promise<ScheduleCategoryOption[]> {
    const result = await apiFetch<ScheduleCategoryOption[]>("/api/calendar-schedules/categories", {
        method: "GET",
    });
    return result.data ?? [];
}

export async function fetchCalendarEvents(range: CalendarRangeRequest): Promise<CalendarEventView[]> {
    const result = await apiFetch<CalendarEventView[]>("/api/calendar-schedules/range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(range),
    });
    return result.data ?? [];
}

export async function fetchCalendarScheduleDetail(seq: number): Promise<CalendarScheduleDetail> {
    const result = await apiFetch<CalendarScheduleDetail>(`/api/calendar-schedules/detail/${seq}`, {
        method: "GET",
    });
    return result.data;
}

export async function createCalendarSchedule(body: CalendarScheduleSaveBody): Promise<number> {
    const result = await apiFetch<number>("/api/calendar-schedules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function updateCalendarSchedule(body: CalendarScheduleSaveBody): Promise<number> {
    const result = await apiFetch<number>("/api/calendar-schedules/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    return result.data ?? 0;
}

export async function deleteCalendarSchedule(seq: number): Promise<number> {
    const result = await apiFetch<number>(`/api/calendar-schedules/delete/${seq}`, {
        method: "DELETE",
    });
    return result.data ?? 0;
}
