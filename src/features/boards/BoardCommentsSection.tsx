"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode, type RefObject } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    MessageSquareOff,
    MoreVertical,
    Smile,
    ThumbsDown,
    ThumbsUp,
} from "lucide-react";
import {
    ApiError,
    createBoardComment,
    deleteBoardComment,
    dislikeBoardComment,
    fetchBoardComments,
    fetchMyMemberEmoticons,
    likeBoardComment,
    reportBoardComment,
    updateBoardComment,
} from "./api";
import {
    createNoticeBoardComment,
    deleteNoticeBoardComment,
    dislikeNoticeBoardComment,
    fetchNoticeBoardComments,
    likeNoticeBoardComment,
    reportNoticeBoardComment,
    updateNoticeBoardComment,
} from "@/features/noticeBoards/api";
import {
    createBlacklistReportComment,
    deleteBlacklistReportComment,
    dislikeBlacklistReportComment,
    fetchBlacklistReportComments,
    likeBlacklistReportComment,
    reportBlacklistReportComment,
    updateBlacklistReportComment,
} from "@/features/blacklistReport/api";
import { bumpWalletRefresh } from "@/stores/walletRefreshStore";
import type { BoardComment, MemberEmoticon } from "./types";
import { useAuthStore, type User } from "@/stores/authStore";
import { uploadBoardImage } from "@/lib/upload";
import styles from "./BoardCommentsSection.module.css";

const MAX_COMMENT_ATTACH_TOTAL = 3;

type SortKey = "latest" | "oldest" | "like";

type Props = {
    boardSeq: number;
    /** 기본 자유게시판. 공지사항 상세에서는 `notice`, 블랙리스트 제보는 `blacklist` */
    commentTarget?: "board" | "notice" | "blacklist";
    /** 게시글 댓글 허용(Y/N). 자유게시판·공지 공통 */
    commentAllowedYn?: string;
    /** 게시글 답글 허용(Y/N). 자유게시판·공지 공통 */
    replyAllowedYn?: string;
};

function isBoardCommentYnAllowed(v: string | undefined): boolean {
    if (v == null || v === "") return true;
    return v.trim().toUpperCase() === "Y";
}

function formatCommentDate(value?: string): string {
    if (!value) return "";
    const d = new Date(value.replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return value;

    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hour = d.getHours();
    const min = String(d.getMinutes()).padStart(2, "0");
    const isAm = hour < 12;
    const ap = isAm ? "오전" : "오후";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;

    return `${y}. ${m}. ${day}. ${ap} ${h12}:${min}`;
}

function UserAvatarSilhouette() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
    );
}

function CommentAvatar({
    imageUrl,
    displayLabel,
    small,
}: {
    imageUrl?: string;
    displayLabel?: string;
    small?: boolean;
}) {
    const imgCls = small ? `${styles.avatarImg} ${styles.avatarImgSm}` : styles.avatarImg;
    const phCls = small ? `${styles.avatarPlaceholder} ${styles.avatarPlaceholderSm}` : styles.avatarPlaceholder;
    if (imageUrl) {
        return <img src={imageUrl} alt="" className={imgCls} />;
    }
    return (
        <span className={phCls} title={displayLabel} aria-label={displayLabel ?? "프로필"}>
            <UserAvatarSilhouette />
        </span>
    );
}

function escapeHtmlPlain(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function buildCommentContent(bodyText: string, imageUrls: string[]): string {
    const parts: string[] = [];
    const t = bodyText.trim();
    if (t) {
        parts.push("<p>" + escapeHtmlPlain(t).replace(/\n/g, "<br/>") + "</p>");
    }
    for (const rawUrl of imageUrls) {
        const url = rawUrl.trim().replace(/"/g, "");
        if (!url) continue;
        parts.push(
            `<p><img src="${url}" alt="" style="max-width:min(200px,100%);border-radius:6px;" /></p>`
        );
    }
    return parts.join("");
}

function extractImageUrlsFromCommentHtml(html: string): string[] {
    const urls: string[] = [];
    const re = /<img[^>]+src="([^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) !== null) {
        urls.push(m[1]);
    }
    return urls;
}

function htmlToPlainCommentText(html: string): string {
    if (!html) return "";
    let t = html.replace(/<br\s*\/?>/gi, "\n");
    t = t.replace(/<\/p>\s*<p>/gi, "\n");
    t = t.replace(/<[^>]+>/g, "");
    return t.replace(/&nbsp;/g, " ").trim();
}

function slotsUsed(emoticonCount: number, imageCount: number): number {
    return emoticonCount + imageCount;
}

function canSubmitComment(bodyText: string, emoticonCount: number, imageCount: number): boolean {
    if (emoticonCount > 0) return true;
    if (imageCount > 0) return true;
    return bodyText.trim().length > 0;
}

type ComposeEditorProps = {
    variant: "top" | "inline";
    user: User | null;
    bodyText: string;
    setBodyText: (v: string) => void;
    attachedImages: { key: string; url: string }[];
    removeAttachedImage: (key: string) => void;
    selectedEmoticons: { memberEmoticonSeq: number; imageUrl: string }[];
    removeEmoticon: (seq: number) => void;
    emojiOpen: boolean;
    setEmojiOpen: (v: boolean) => void;
    emojiList: MemberEmoticon[] | undefined;
    addEmoticon: (row: MemberEmoticon) => void;
    remainingSlots: number;
    uploadingImage: boolean;
    submitting: boolean;
    fileInputRef: RefObject<HTMLInputElement | null>;
    emojiPanelRef: RefObject<HTMLDivElement | null>;
    emojiBtnRef: RefObject<HTMLButtonElement | null>;
    onPickImageFile: (e: ChangeEvent<HTMLInputElement>) => void;
    onSubmit: () => void;
};

function ComposeEditor({
    variant,
    user,
    bodyText,
    setBodyText,
    attachedImages,
    removeAttachedImage,
    selectedEmoticons,
    removeEmoticon,
    emojiOpen,
    setEmojiOpen,
    emojiList,
    addEmoticon,
    remainingSlots,
    uploadingImage,
    submitting,
    fileInputRef,
    emojiPanelRef,
    emojiBtnRef,
    onPickImageFile,
    onSubmit,
}: ComposeEditorProps) {
    const inline = variant === "inline";
    const usedSlots = slotsUsed(selectedEmoticons.length, attachedImages.length);
    const submitEnabled =
        user?.memberSeq &&
        canSubmitComment(bodyText, selectedEmoticons.length, attachedImages.length) &&
        !submitting &&
        !uploadingImage;

    const fields = (
        <>
            {!inline && (
                <div className={styles.composeMeta}>
                    {user?.username ? (
                        <span className={styles.composeDisplayName}>
                            {user.nickname?.trim() || user.memberName?.trim() || user.username}
                        </span>
                    ) : (
                        <span className={styles.composeDisplayName}>로그인 후 댓글을 작성할 수 있습니다</span>
                    )}
                </div>
            )}
            <div className={styles.inputFrame}>
                <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="내용을 입력해주세요"
                    className={styles.textarea}
                />
                <div className={styles.composeToolbar}>
                            <div className={styles.toolbarLeft}>
                                <button
                                    ref={emojiBtnRef}
                                    type="button"
                                    className={styles.iconToolBtn}
                                    title="내 이모티콘"
                                    disabled={!user?.memberSeq || remainingSlots <= 0}
                                    onClick={() => setEmojiOpen(!emojiOpen)}
                                >
                                    <Smile size={18} strokeWidth={1.75} />
                                </button>
                                <button
                                    type="button"
                                    className={styles.iconToolBtn}
                                    title="이미지 첨부"
                                    disabled={
                                        !user?.memberSeq || remainingSlots <= 0 || uploadingImage || submitting
                                    }
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <ImageIcon size={18} strokeWidth={1.75} />
                                </button>
                                <span className={styles.attachHint}>
                                    첨부 {usedSlots}/{MAX_COMMENT_ATTACH_TOTAL}
                                    {uploadingImage ? " · 업로드 중…" : ""}
                                </span>
                                {emojiOpen ? (
                                    <div ref={emojiPanelRef} className={styles.emojiPanel}>
                                        {emojiList === undefined ? (
                                            <div className={styles.emojiEmpty}>불러오는 중…</div>
                                        ) : emojiList.length === 0 ? (
                                            <div className={styles.emojiEmpty}>
                                                등록된 이모티콘이 없습니다. 회원 메뉴에서 이미지 URL로 등록할 수
                                                있습니다.
                                            </div>
                                        ) : (
                                            <div className={styles.emojiGrid}>
                                                {emojiList.map((em) => (
                                                    <button
                                                        key={em.memberEmoticonSeq}
                                                        type="button"
                                                        className={styles.emojiItemBtn}
                                                        disabled={
                                                            remainingSlots <= 0 ||
                                                            em.memberEmoticonSeq == null ||
                                                            selectedEmoticons.some(
                                                                (s) => s.memberEmoticonSeq === em.memberEmoticonSeq
                                                            )
                                                        }
                                                        onClick={() => addEmoticon(em)}
                                                    >
                                                        {em.imageUrl ? <img src={em.imageUrl} alt="" /> : null}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                className={styles.submitBtn}
                                disabled={!submitEnabled}
                                onClick={() => void onSubmit()}
                            >
                                {submitting ? "등록 중…" : "등록"}
                            </button>
                        </div>
            </div>
            {attachedImages.length > 0 ? (
                <div className={styles.selectedChips}>
                    {attachedImages.map((img) => (
                        <span key={img.key} className={styles.composeImageChip}>
                            <img src={img.url} alt="첨부 이미지 미리보기" />
                            <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => removeAttachedImage(img.key)}
                                aria-label="이미지 제거"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}
            {selectedEmoticons.length > 0 ? (
                <div className={styles.selectedChips}>
                    {selectedEmoticons.map((s) => (
                        <span key={s.memberEmoticonSeq} className={styles.emoticonChip}>
                            <img src={s.imageUrl} alt="" />
                            <button
                                type="button"
                                className={styles.chipRemove}
                                onClick={() => removeEmoticon(s.memberEmoticonSeq)}
                                aria-label="이모티콘 제거"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            ) : null}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: "none" }}
                onChange={(ev) => void onPickImageFile(ev)}
            />
        </>
    );

    if (inline) {
        return (
            <div className={styles.inlineCompose}>
                <div className={styles.avatarCol}>
                    <CommentAvatar
                        imageUrl={user?.profileImageUrl}
                        displayLabel={user?.nickname?.trim() || user?.memberName?.trim() || user?.username || "나"}
                        small
                    />
                </div>
                <div className={styles.inlineComposeSide}>{fields}</div>
            </div>
        );
    }

    return (
        <div className={styles.composeRow}>
            <div className={styles.avatarCol}>
                <CommentAvatar
                    imageUrl={user?.profileImageUrl}
                    displayLabel={user?.nickname?.trim() || user?.memberName?.trim() || user?.username || "게스트"}
                    small={false}
                />
            </div>
            <div className={styles.composeSide}>{fields}</div>
        </div>
    );
}

function CommentBlock({
    boardSeq,
    commentTarget,
    comment,
    depth,
    onRefresh,
    busyId,
    setBusyId,
    openReplyThreadSeq,
    setOpenReplyThreadSeq,
    clearReplyDraft,
    replyComposer,
    repliesAllowed,
    user,
}: {
    boardSeq: number;
    commentTarget: "board" | "notice" | "blacklist";
    comment: BoardComment;
    depth: number;
    onRefresh: () => void;
    busyId: number | null;
    setBusyId: (id: number | null) => void;
    openReplyThreadSeq: number | null;
    setOpenReplyThreadSeq: (id: number | null) => void;
    clearReplyDraft: () => void;
    replyComposer: ReactNode;
    repliesAllowed: boolean;
    user: User | null;
}) {
    const seq = comment.boardCommentSeq;
    const children = comment.children ?? [];
    const replyCount = Math.max(children.length, comment.replyCount ?? 0);
    const small = depth > 0;
    const replyOpen = depth === 0 && seq != null && openReplyThreadSeq === seq;
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState("");
    const [editSaving, setEditSaving] = useState(false);

    const isOwner =
        typeof user?.memberSeq === "number" &&
        typeof comment.writerMemberSeq === "number" &&
        user.memberSeq === comment.writerMemberSeq;

    const nick = comment.writerName?.trim();
    const id = comment.writerMemberId?.trim();
    let primary: string;
    let showAtId = false;
    if (nick) {
        primary = nick;
        showAtId = Boolean(id && id !== nick);
    } else if (id) {
        primary = id;
    } else {
        primary = "회원";
    }

    const run = async (fn: () => Promise<number>) => {
        if (seq == null) return;
        setBusyId(seq);
        try {
            await fn();
            onRefresh();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "처리에 실패했습니다.");
        } finally {
            setBusyId(null);
        }
    };

    const toggleReplyThread = () => {
        if (seq == null) return;
        if (replyOpen) {
            setOpenReplyThreadSeq(null);
            clearReplyDraft();
        } else {
            clearReplyDraft();
            setOpenReplyThreadSeq(seq);
        }
    };

    const isNotice = commentTarget === "notice";
    const isBlacklist = commentTarget === "blacklist";

    const startEdit = () => {
        if (seq == null) return;
        if (depth === 0 && openReplyThreadSeq === seq) {
            setOpenReplyThreadSeq(null);
            clearReplyDraft();
        }
        setEditText(htmlToPlainCommentText(comment.content ?? ""));
        setIsEditing(true);
    };

    const saveEdit = async () => {
        if (seq == null) return;
        const emoSlots = [comment.emoticonSeq1, comment.emoticonSeq2, comment.emoticonSeq3].filter(
            (x) => x != null
        ).length;
        const imgs = extractImageUrlsFromCommentHtml(comment.content ?? "");
        if (!canSubmitComment(editText, emoSlots, imgs.length)) {
            alert("내용을 입력해주세요.");
            return;
        }
        setEditSaving(true);
        try {
            const bodyHtml = buildCommentContent(editText, imgs);
            const payload = {
                content: bodyHtml,
                emoticonSeq1: comment.emoticonSeq1,
                emoticonSeq2: comment.emoticonSeq2,
                emoticonSeq3: comment.emoticonSeq3,
            };
            const ok = isNotice
                ? await updateNoticeBoardComment(boardSeq, seq, payload)
                : isBlacklist
                  ? await updateBlacklistReportComment(boardSeq, seq, payload)
                  : await updateBoardComment(boardSeq, seq, payload);
            if (ok > 0) {
                setIsEditing(false);
                onRefresh();
            } else {
                alert("수정에 실패했습니다.");
            }
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "수정에 실패했습니다.");
        } finally {
            setEditSaving(false);
        }
    };

    const doDelete = async () => {
        if (seq == null) return;
        const confirmMsg =
            depth === 0 && replyCount > 0
                ? "이 댓글과 달린 답글을 모두 삭제할까요?"
                : "이 댓글을 삭제할까요?";
        if (!window.confirm(confirmMsg)) return;
        setBusyId(seq);
        try {
            const ok = isNotice
                ? await deleteNoticeBoardComment(boardSeq, seq)
                : isBlacklist
                  ? await deleteBlacklistReportComment(boardSeq, seq)
                  : await deleteBoardComment(boardSeq, seq);
            if (ok > 0) {
                setIsEditing(false);
                onRefresh();
            } else {
                alert("삭제에 실패했습니다.");
            }
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "삭제에 실패했습니다.");
        } finally {
            setBusyId(null);
        }
    };

    const cardClass = depth > 0 ? `${styles.card} ${styles.cardNested}` : styles.card;

    return (
        <div className={cardClass}>
            <div className={styles.cardInner}>
                <div className={styles.avatarCol}>
                    <CommentAvatar
                        imageUrl={comment.writerProfileImageUrl}
                        displayLabel={primary}
                        small={small}
                    />
                </div>
                <div className={styles.mainCol}>
                    <div className={styles.headerRow}>
                        <div className={styles.headerMain}>
                            <div className={styles.nameLine}>
                                <span className={styles.displayName}>{primary}</span>
                                {showAtId && id ? <span className={styles.memberId}>@{id}</span> : null}
                                <time className={styles.date} dateTime={comment.createDt}>
                                    {formatCommentDate(comment.createDt)}
                                </time>
                            </div>
                        </div>
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button type="button" className={styles.menuBtn} aria-label="댓글 메뉴">
                                    <MoreVertical size={18} strokeWidth={2} />
                                </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                                <DropdownMenu.Content className={styles.dropdownContent} sideOffset={6} align="end">
                                    {isOwner ? (
                                        <>
                                            <DropdownMenu.Item
                                                className={styles.dropdownItem}
                                                disabled={busyId !== null || seq == null || editSaving}
                                                onSelect={(ev) => {
                                                    ev.preventDefault();
                                                    startEdit();
                                                }}
                                            >
                                                수정
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                className={styles.dropdownItem}
                                                disabled={busyId !== null || seq == null || editSaving}
                                                onSelect={(ev) => {
                                                    ev.preventDefault();
                                                    void doDelete();
                                                }}
                                            >
                                                삭제
                                            </DropdownMenu.Item>
                                            <div className={styles.dropdownSeparator} aria-hidden />
                                        </>
                                    ) : null}
                                    <DropdownMenu.Item
                                        className={styles.dropdownItem}
                                        disabled={busyId !== null || seq == null || isOwner}
                                        onSelect={(ev) => {
                                            ev.preventDefault();
                                            if (seq != null) {
                                                void run(() =>
                                                    isNotice
                                                        ? reportNoticeBoardComment(boardSeq, seq!)
                                                        : isBlacklist
                                                          ? reportBlacklistReportComment(boardSeq, seq!)
                                                          : reportBoardComment(boardSeq, seq!)
                                                );
                                            }
                                        }}
                                    >
                                        신고 {comment.reportCount != null ? `(${comment.reportCount})` : ""}
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                    {isEditing ? (
                        <div>
                            <textarea
                                className={styles.editTextarea}
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={4}
                                aria-label="댓글 수정"
                            />
                            <div className={styles.editActions}>
                                <button
                                    type="button"
                                    className={styles.editSaveBtn}
                                    disabled={editSaving || busyId !== null}
                                    onClick={() => void saveEdit()}
                                >
                                    {editSaving ? "저장 중…" : "저장"}
                                </button>
                                <button
                                    type="button"
                                    className={styles.editCancelBtn}
                                    disabled={editSaving}
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditText("");
                                    }}
                                >
                                    취소
                                </button>
                            </div>
                        </div>
                    ) : comment.content ? (
                        <div
                            className={`${styles.body} prose prose-invert max-w-none text-sm`}
                            dangerouslySetInnerHTML={{ __html: comment.content }}
                        />
                    ) : null}
                    <div className={styles.emoticons}>
                        {[comment.emoticonImageUrl1, comment.emoticonImageUrl2, comment.emoticonImageUrl3]
                            .filter(Boolean)
                            .map((src) => (
                                <img key={src} src={src} alt="이모티콘" />
                            ))}
                    </div>
                    <div className={styles.actionRow}>
                        <button
                            type="button"
                            disabled={busyId !== null || seq == null || isEditing}
                            className={`${styles.actionPill} ${
                                comment.myVoteType === "L" ? styles.actionPillActive : ""
                            }`}
                            onClick={() =>
                                seq != null &&
                                run(() =>
                                    isNotice
                                        ? likeNoticeBoardComment(boardSeq, seq)
                                        : isBlacklist
                                          ? likeBlacklistReportComment(boardSeq, seq)
                                          : likeBoardComment(boardSeq, seq)
                                )
                            }
                        >
                            <ThumbsUp size={16} strokeWidth={2} aria-hidden />
                            <span>{comment.likeCount ?? 0}</span>
                        </button>
                        <button
                            type="button"
                            disabled={busyId !== null || seq == null || isEditing}
                            className={`${styles.actionPill} ${
                                comment.myVoteType === "D" ? styles.actionPillActiveDis : ""
                            }`}
                            onClick={() =>
                                seq != null &&
                                run(() =>
                                    isNotice
                                        ? dislikeNoticeBoardComment(boardSeq, seq)
                                        : isBlacklist
                                          ? dislikeBlacklistReportComment(boardSeq, seq)
                                          : dislikeBoardComment(boardSeq, seq)
                                )
                            }
                        >
                            <ThumbsDown size={16} strokeWidth={2} aria-hidden />
                            <span>{comment.dislikeCount ?? 0}</span>
                        </button>
                        {depth === 0 && seq != null && (repliesAllowed || replyCount > 0) ? (
                            <button
                                type="button"
                                disabled={isEditing}
                                className={`${styles.actionPill} ${styles.replyTogglePill}`}
                                onClick={toggleReplyThread}
                            >
                                {replyOpen ? (
                                    <ChevronUp size={16} strokeWidth={2} aria-hidden />
                                ) : (
                                    <ChevronDown size={16} strokeWidth={2} aria-hidden />
                                )}
                                <span>
                                    {replyOpen ? "답글 접기" : "답글 보기"} ({replyCount})
                                </span>
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
            {replyOpen && replyComposer ? (
                <div className={styles.replyThread}>
                    {children.length > 0
                        ? children.map((ch) => (
                              <CommentBlock
                                  key={ch.boardCommentSeq}
                                  boardSeq={boardSeq}
                                  commentTarget={commentTarget}
                                  comment={ch}
                                  depth={1}
                                  onRefresh={onRefresh}
                                  busyId={busyId}
                                  setBusyId={setBusyId}
                                  openReplyThreadSeq={openReplyThreadSeq}
                                  setOpenReplyThreadSeq={setOpenReplyThreadSeq}
                                  clearReplyDraft={clearReplyDraft}
                                  replyComposer={null}
                                  repliesAllowed={repliesAllowed}
                                  user={user}
                              />
                          ))
                        : null}
                    {replyComposer}
                </div>
            ) : null}
        </div>
    );
}

type SelectedEmo = { memberEmoticonSeq: number; imageUrl: string };
type AttachedImage = { key: string; url: string };

export default function BoardCommentsSection({
    boardSeq,
    commentTarget = "board",
    commentAllowedYn,
    replyAllowedYn,
}: Props) {
    const { user } = useAuthStore();
    const isNoticeBoard = commentTarget === "notice";
    const isBlacklistBoard = commentTarget === "blacklist";
    const commentsAllowed = isBoardCommentYnAllowed(commentAllowedYn);
    const repliesAllowed = commentsAllowed && isBoardCommentYnAllowed(replyAllowedYn);
    const [sort, setSort] = useState<SortKey>("latest");
    const [items, setItems] = useState<BoardComment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [bodyText, setBodyText] = useState("");
    const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [openReplyThreadSeq, setOpenReplyThreadSeq] = useState<number | null>(null);
    const [busyId, setBusyId] = useState<number | null>(null);

    const [selectedEmoticons, setSelectedEmoticons] = useState<SelectedEmo[]>([]);
    const [emojiOpen, setEmojiOpen] = useState(false);
    const [emojiList, setEmojiList] = useState<MemberEmoticon[] | undefined>(undefined);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const emojiPanelRef = useRef<HTMLDivElement>(null);
    const emojiBtnRef = useRef<HTMLButtonElement>(null);

    const clearReplyDraft = useCallback(() => {
        setBodyText("");
        setAttachedImages([]);
        setSelectedEmoticons([]);
        setEmojiOpen(false);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setItems(
                await (isNoticeBoard
                    ? fetchNoticeBoardComments(boardSeq, sort)
                    : isBlacklistBoard
                      ? fetchBlacklistReportComments(boardSeq, sort)
                      : fetchBoardComments(boardSeq, sort))
            );
        } catch (e) {
            setItems([]);
            setError(e instanceof Error ? e.message : "댓글을 불러오지 못했습니다.");
        } finally {
            setLoading(false);
        }
    }, [boardSeq, sort, isNoticeBoard, isBlacklistBoard]);

    useEffect(() => {
        void load();
    }, [load]);

    useEffect(() => {
        if (!commentsAllowed) {
            setOpenReplyThreadSeq(null);
            clearReplyDraft();
        }
    }, [commentsAllowed, clearReplyDraft]);

    useEffect(() => {
        if (!emojiOpen) return;
        const onDoc = (ev: MouseEvent) => {
            const t = ev.target as Node;
            if (emojiPanelRef.current?.contains(t)) return;
            if (emojiBtnRef.current?.contains(t)) return;
            setEmojiOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [emojiOpen]);

    const loadEmojiList = useCallback(async () => {
        if (emojiList !== undefined) return;
        try {
            setEmojiList(await fetchMyMemberEmoticons());
        } catch {
            setEmojiList([]);
        }
    }, [emojiList]);

    useEffect(() => {
        if (emojiOpen) void loadEmojiList();
    }, [emojiOpen, loadEmojiList]);

    const imageCount = attachedImages.length;
    const usedSlots = slotsUsed(selectedEmoticons.length, imageCount);
    const remainingSlots = MAX_COMMENT_ATTACH_TOTAL - usedSlots;

    const addEmoticon = (row: MemberEmoticon) => {
        const seq = row.memberEmoticonSeq;
        if (seq == null || !row.imageUrl) return;
        if (selectedEmoticons.some((s) => s.memberEmoticonSeq === seq)) return;
        if (slotsUsed(selectedEmoticons.length, imageCount) >= MAX_COMMENT_ATTACH_TOTAL) {
            alert(`이모티콘과 이미지는 합쳐 최대 ${MAX_COMMENT_ATTACH_TOTAL}개까지 첨부할 수 있습니다.`);
            return;
        }
        setSelectedEmoticons((prev) => [...prev, { memberEmoticonSeq: seq, imageUrl: row.imageUrl! }]);
        setEmojiOpen(false);
    };

    const removeEmoticon = (seq: number) => {
        setSelectedEmoticons((prev) => prev.filter((s) => s.memberEmoticonSeq !== seq));
    };

    const removeAttachedImage = (key: string) => {
        setAttachedImages((prev) => prev.filter((x) => x.key !== key));
    };

    const onPickImageFile = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !user?.memberSeq) return;
        if (slotsUsed(selectedEmoticons.length, attachedImages.length) >= MAX_COMMENT_ATTACH_TOTAL) {
            alert(`이모티콘과 이미지는 합쳐 최대 ${MAX_COMMENT_ATTACH_TOTAL}개까지 첨부할 수 있습니다.`);
            return;
        }
        setUploadingImage(true);
        try {
            const url = await uploadBoardImage(file);
            const key = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
            setAttachedImages((prev) => [...prev, { key, url }]);
        } catch (err) {
            alert(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
        } finally {
            setUploadingImage(false);
        }
    };

    const onSubmit = async () => {
        if (!user?.memberSeq) {
            alert("로그인 후 댓글을 작성할 수 있습니다.");
            return;
        }
        if (!commentsAllowed) {
            alert("이 게시글은 댓글이 비활성화되어 있습니다.");
            return;
        }
        if (openReplyThreadSeq != null && !repliesAllowed) {
            alert("이 게시글은 답글 작성이 허용되지 않았습니다.");
            return;
        }
        if (!canSubmitComment(bodyText, selectedEmoticons.length, attachedImages.length)) {
            alert("내용을 입력하거나 이모티콘·이미지를 추가해주세요.");
            return;
        }
        if (slotsUsed(selectedEmoticons.length, attachedImages.length) > MAX_COMMENT_ATTACH_TOTAL) {
            alert(`이모티콘과 이미지는 합쳐 최대 ${MAX_COMMENT_ATTACH_TOTAL}개입니다.`);
            return;
        }
        setSubmitting(true);
        try {
            const seqs = selectedEmoticons.map((s) => s.memberEmoticonSeq);
            const content = buildCommentContent(
                bodyText,
                attachedImages.map((x) => x.url)
            );
            const payload = {
                content,
                parentBoardCommentSeq: openReplyThreadSeq ?? undefined,
                emoticonSeq1: seqs[0],
                emoticonSeq2: seqs[1],
                emoticonSeq3: seqs[2],
            };
            if (isNoticeBoard) {
                await createNoticeBoardComment(boardSeq, payload);
            } else if (isBlacklistBoard) {
                await createBlacklistReportComment(boardSeq, payload);
            } else {
                await createBoardComment(boardSeq, payload);
            }
            bumpWalletRefresh();
            clearReplyDraft();
            await load();
        } catch (e) {
            alert(e instanceof ApiError ? e.message : "등록에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const composeEditorProps: Omit<ComposeEditorProps, "variant" | "onSubmit" | "user"> = {
        bodyText,
        setBodyText,
        attachedImages,
        removeAttachedImage,
        selectedEmoticons,
        removeEmoticon,
        emojiOpen,
        setEmojiOpen,
        emojiList,
        addEmoticon,
        remainingSlots,
        uploadingImage,
        submitting,
        fileInputRef,
        emojiPanelRef,
        emojiBtnRef,
        onPickImageFile,
    };

    return (
        <section className={styles.section}>
            <h2 className={styles.title}>댓글</h2>

            {!commentsAllowed ? (
                <div className={styles.commentsDisabledBanner} role="status" aria-live="polite">
                    <MessageSquareOff className={styles.commentsDisabledIcon} strokeWidth={2} aria-hidden />
                    <span>이 게시글은 댓글이 비활성화되어 있습니다.</span>
                </div>
            ) : null}

            <div className={styles.sortRow}>
                {(
                    [
                        ["latest", "최신순"],
                        ["like", "추천순"],
                        ["oldest", "오래된순"],
                    ] as const
                ).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        className={`${styles.sortBtn} ${sort === key ? styles.sortBtnActive : ""}`}
                        onClick={() => setSort(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {openReplyThreadSeq === null && commentsAllowed ? (
                <div className={styles.compose}>
                    <ComposeEditor
                        variant="top"
                        user={user}
                        {...composeEditorProps}
                        onSubmit={onSubmit}
                    />
                </div>
            ) : null}

            {error ? <div className="text-sm text-amber-300">{error}</div> : null}
            {loading ? <div className={styles.empty}>불러오는 중…</div> : null}
            {!loading && !error && items.length === 0 ? (
                <div className={styles.empty}>
                    {commentsAllowed ? "첫 댓글을 남겨보세요." : "등록된 댓글이 없습니다."}
                </div>
            ) : null}

            <div className={styles.list}>
                {items.map((c) => (
                    <CommentBlock
                        key={c.boardCommentSeq}
                        boardSeq={boardSeq}
                        commentTarget={commentTarget}
                        comment={c}
                        depth={0}
                        onRefresh={load}
                        busyId={busyId}
                        setBusyId={setBusyId}
                        openReplyThreadSeq={openReplyThreadSeq}
                        setOpenReplyThreadSeq={setOpenReplyThreadSeq}
                        clearReplyDraft={clearReplyDraft}
                        repliesAllowed={repliesAllowed}
                        user={user}
                        replyComposer={
                            repliesAllowed && openReplyThreadSeq === c.boardCommentSeq ? (
                                <ComposeEditor
                                    variant="inline"
                                    user={user}
                                    {...composeEditorProps}
                                    onSubmit={onSubmit}
                                />
                            ) : null
                        }
                    />
                ))}
            </div>
        </section>
    );
}
