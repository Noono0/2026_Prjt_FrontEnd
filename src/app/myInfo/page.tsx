"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useAuthStore } from "@/stores/authStore";
import { changeMyPassword, findMemberByMemberId, type MemberDetailResponse, updateMyInfo } from "@/features/members/api";
import { uploadImageFile } from "@/lib/upload";
import WalletSection from "@/features/members/WalletSection";

function toDateInputValue(birthYmd?: string) {
    if (!birthYmd) return "";
    if (/^\d{8}$/.test(birthYmd)) {
        return `${birthYmd.slice(0, 4)}-${birthYmd.slice(4, 6)}-${birthYmd.slice(6, 8)}`;
    }
    return birthYmd;
}

export default function MyInfoPage() {
    const { data: session } = useSession();
    const { user } = useAuthStore();

    const memberId = useMemo(
        () => user?.username ?? session?.user?.name ?? session?.user?.email ?? "",
        [session?.user?.email, session?.user?.name, user?.username]
    );

    const [info, setInfo] = useState<MemberDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);

    const loadMyInfo = async () => {
        if (!memberId) {
            alert("로그인 정보를 찾을 수 없습니다.");
            return;
        }
        try {
            setLoading(true);
            const detail = await findMemberByMemberId(memberId);
            if (!detail) {
                alert("회원 정보를 찾을 수 없습니다.");
                setInfo(null);
                return;
            }
            setInfo(detail);
        } catch (e) {
            alert(e instanceof Error ? e.message : "회원정보 조회 실패");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!memberId) return;
        void loadMyInfo();
    }, [memberId]);

    const handleFileChange = async (file?: File) => {
        if (!file) return;
        try {
            const { fileUrl, fileSeq } = await uploadImageFile(file, "/myInfo");
            setInfo((prev) =>
                prev
                    ? {
                          ...prev,
                          profileImageUrl: fileUrl,
                          profileImageFileSeq: fileSeq,
                      }
                    : prev
            );
        } catch (e) {
            alert(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
        }
    };

    const handleSave = async () => {
        if (!info) return;
        try {
            setSaving(true);
            await updateMyInfo(info);
            alert("회원정보가 저장되었습니다.");
            await loadMyInfo();
        } catch (e) {
            alert(e instanceof Error ? e.message : "회원정보 저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const clearImage = () => {
        setInfo((prev) => (prev ? { ...prev, profileImageUrl: null, profileImageFileSeq: null } : prev));
    };

    const handleChangePassword = async () => {
        if (!currentPassword.trim() || !newPassword.trim() || !newPasswordConfirm.trim()) {
            alert("현재 비밀번호/새 비밀번호/확인을 모두 입력해주세요.");
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            alert("새 비밀번호 확인이 일치하지 않습니다.");
            return;
        }
        if (newPassword.length < 8) {
            alert("새 비밀번호는 8자 이상으로 입력해주세요.");
            return;
        }

        try {
            setPasswordSaving(true);
            await changeMyPassword(currentPassword, newPassword);
            alert("비밀번호가 변경되었습니다.");
            setCurrentPassword("");
            setNewPassword("");
            setNewPasswordConfirm("");
        } catch (e) {
            alert(e instanceof Error ? e.message : "비밀번호 변경 실패");
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <div className="min-h-[70vh] rounded-2xl border border-slate-800 bg-[#0c1017] p-6 text-slate-100 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">내 회원정보</h1>
                <button
                    type="button"
                    onClick={loadMyInfo}
                    disabled={loading}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm hover:bg-slate-800"
                >
                    {loading ? "불러오는 중..." : "새로고침"}
                </button>
            </div>

            <div className="mb-6">
                <WalletSection />
            </div>

            {!info ? (
                <p className="text-sm text-slate-400">회원정보를 불러오는 중입니다.</p>
            ) : (
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                            <div className="mb-2 text-sm text-slate-400">아이디</div>
                            <div className="text-lg">{info.memberId}</div>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                            <div className="mb-2 text-sm text-slate-400">성명</div>
                            <input
                                value={info.memberName ?? ""}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, memberName: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                            <div className="mb-2 text-sm text-slate-400">닉네임</div>
                            <input
                                value={info.nickname ?? ""}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, nickname: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                                placeholder="게시글·댓글에 표시"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="mb-2 text-sm text-slate-400">이메일</div>
                            <input
                                value={info.email ?? ""}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, email: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                        </div>
                        <div>
                            <div className="mb-2 text-sm text-slate-400">휴대폰</div>
                            <input
                                value={info.phone ?? ""}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, phone: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <div className="mb-2 text-sm text-slate-400">생년월일</div>
                            <input
                                type="date"
                                value={toDateInputValue(info.birthYmd)}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, birthYmd: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                        </div>
                        <div>
                            <div className="mb-2 text-sm text-slate-400">성별</div>
                            <select
                                value={info.gender ?? "M"}
                                onChange={(e) => setInfo((prev) => (prev ? { ...prev, gender: e.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            >
                                <option value="M">남</option>
                                <option value="F">여</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                        <div className="mb-3 text-sm text-slate-400">프로필 이미지</div>
                        <div className="mb-3">
                            {info.profileImageUrl ? (
                                <img src={info.profileImageUrl} alt="profile" className="h-28 w-28 rounded-full object-cover" />
                            ) : (
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-800 text-xs text-slate-500">
                                    이미지 없음
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm hover:bg-slate-800">
                                이미지 등록/수정
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleFileChange(e.target.files?.[0])}
                                />
                            </label>
                            <button
                                type="button"
                                onClick={clearImage}
                                className="rounded-lg border border-rose-700 bg-rose-950/40 px-3 py-2 text-sm text-rose-200 hover:bg-rose-900/50"
                            >
                                이미지 삭제
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
                    >
                        {saving ? "저장 중..." : "회원정보 저장"}
                    </button>

                    <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
                        <h2 className="mb-3 text-lg font-semibold text-white">비밀번호 변경</h2>
                        <div className="grid gap-3 md:grid-cols-3">
                            <input
                                type="password"
                                placeholder="현재 비밀번호"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                            <input
                                type="password"
                                placeholder="새 비밀번호"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                            <input
                                type="password"
                                placeholder="새 비밀번호 확인"
                                value={newPasswordConfirm}
                                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                className="rounded-lg border border-slate-700 bg-[#081326] px-3 py-2"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={handleChangePassword}
                            disabled={passwordSaving}
                            className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                        >
                            {passwordSaving ? "변경 중..." : "비밀번호 변경"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
