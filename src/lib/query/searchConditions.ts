import type { CodeGroupSearchCondition } from "@/features/commonCodes/api";
import type { MemberSearchCondition } from "@/features/members/api";
import type { MenuSearchCondition } from "@/features/menus/api";
import type { RoleSearchCondition } from "@/features/roles/api";

/** API 요청용: 빈 문자열·공백은 undefined 로 정리 */
export function normalizeMemberSearchCondition(
    c: MemberSearchCondition
): MemberSearchCondition {
    return {
        ...c,
        memberId: c.memberId?.trim() ? c.memberId.trim() : undefined,
        memberName: c.memberName?.trim() ? c.memberName.trim() : undefined,
        roleCode: c.roleCode?.trim() ? c.roleCode.trim() : undefined,
        status: c.status?.trim() ? c.status.trim() : undefined,
        page: c.page,
        size: c.size,
        sortBy: c.sortBy,
        sortDir: c.sortDir,
    };
}

export function sameMemberSearchCondition(
    a: MemberSearchCondition,
    b: MemberSearchCondition
): boolean {
    const na = normalizeMemberSearchCondition(a);
    const nb = normalizeMemberSearchCondition(b);
    return (
        (na.memberId ?? "") === (nb.memberId ?? "") &&
        (na.memberName ?? "") === (nb.memberName ?? "") &&
        (na.roleCode ?? "") === (nb.roleCode ?? "") &&
        (na.status ?? "") === (nb.status ?? "") &&
        na.page === nb.page &&
        na.size === nb.size &&
        (na.sortBy ?? "") === (nb.sortBy ?? "") &&
        na.sortDir === nb.sortDir
    );
}

export function normalizeCodeGroupSearchCondition(
    c: CodeGroupSearchCondition
): CodeGroupSearchCondition {
    return {
        ...c,
        codeGroupId: c.codeGroupId?.trim() ? c.codeGroupId.trim() : undefined,
        codeGroupName: c.codeGroupName?.trim() ? c.codeGroupName.trim() : undefined,
        useYn: c.useYn === "" || c.useYn === undefined ? undefined : c.useYn,
        delYn: c.delYn,
        page: c.page,
        size: c.size,
        sortBy: c.sortBy,
        sortDir: c.sortDir,
    };
}

export function sameCodeGroupSearchCondition(
    a: CodeGroupSearchCondition,
    b: CodeGroupSearchCondition
): boolean {
    const na = normalizeCodeGroupSearchCondition(a);
    const nb = normalizeCodeGroupSearchCondition(b);
    return (
        (na.codeGroupId ?? "") === (nb.codeGroupId ?? "") &&
        (na.codeGroupName ?? "") === (nb.codeGroupName ?? "") &&
        (na.useYn ?? "") === (nb.useYn ?? "") &&
        (na.delYn ?? "") === (nb.delYn ?? "") &&
        na.page === nb.page &&
        na.size === nb.size &&
        (na.sortBy ?? "") === (nb.sortBy ?? "") &&
        na.sortDir === nb.sortDir
    );
}

export function normalizeRoleSearchCondition(c: RoleSearchCondition): RoleSearchCondition {
    return {
        ...c,
        roleCode: c.roleCode?.trim() ? c.roleCode.trim() : undefined,
        roleName: c.roleName?.trim() ? c.roleName.trim() : undefined,
        useYn: c.useYn === "" || c.useYn === undefined ? undefined : c.useYn,
        page: c.page,
        size: c.size,
        sortBy: c.sortBy,
        sortDir: c.sortDir,
    };
}

export function sameRoleSearchCondition(a: RoleSearchCondition, b: RoleSearchCondition): boolean {
    const na = normalizeRoleSearchCondition(a);
    const nb = normalizeRoleSearchCondition(b);
    return (
        (na.roleCode ?? "") === (nb.roleCode ?? "") &&
        (na.roleName ?? "") === (nb.roleName ?? "") &&
        (na.useYn ?? "") === (nb.useYn ?? "") &&
        na.page === nb.page &&
        na.size === nb.size &&
        (na.sortBy ?? "") === (nb.sortBy ?? "") &&
        na.sortDir === nb.sortDir
    );
}

export function normalizeMenuSearchCondition(c: MenuSearchCondition): MenuSearchCondition {
    return {
        ...c,
        menuCode: c.menuCode?.trim() ? c.menuCode.trim() : undefined,
        menuName: c.menuName?.trim() ? c.menuName.trim() : undefined,
        useYn: c.useYn === "" || c.useYn === undefined ? undefined : c.useYn,
        parentMenuId: c.parentMenuId,
        page: c.page,
        size: c.size,
        sortBy: c.sortBy,
        sortDir: c.sortDir,
    };
}

export function sameMenuSearchCondition(a: MenuSearchCondition, b: MenuSearchCondition): boolean {
    const na = normalizeMenuSearchCondition(a);
    const nb = normalizeMenuSearchCondition(b);
    return (
        (na.menuCode ?? "") === (nb.menuCode ?? "") &&
        (na.menuName ?? "") === (nb.menuName ?? "") &&
        (na.useYn ?? "") === (nb.useYn ?? "") &&
        (na.parentMenuId ?? null) === (nb.parentMenuId ?? null) &&
        na.page === nb.page &&
        na.size === nb.size &&
        (na.sortBy ?? "") === (nb.sortBy ?? "") &&
        na.sortDir === nb.sortDir
    );
}
