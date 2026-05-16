/**
 * sonner 기반 토스트/컨펌 유틸.
 *
 * - `sonner.*`: 의미에 맞는 toast 호출 헬퍼 (success/error/warning/info/message).
 * - `confirmSonner`: native `confirm()`을 대체하는 Promise 기반 유틸.
 *   사용 예) `if (!(await confirmSonner("삭제할까요?"))) return;`
 *
 * 참고: confirmSonner는 화면 구석 토스트로 동작하므로,
 *       파괴적/중요 동작은 추후 별도 ConfirmDialog 모달로 교체 검토.
 */
import { toast, type ExternalToast } from "sonner";

export const sonner = {
    success: (message: string, options?: ExternalToast) => toast.success(message, options),
    error: (message: string, options?: ExternalToast) => toast.error(message, options),
    warning: (message: string, options?: ExternalToast) => toast.warning(message, options),
    info: (message: string, options?: ExternalToast) => toast.info(message, options),
    message: (message: string, options?: ExternalToast) => toast(message, options),
};

export type ConfirmSonnerOptions = {
    confirmLabel?: string;
    cancelLabel?: string;
    description?: string;
};

/**
 * Promise 기반 confirm. native `confirm()` 대체용.
 * 확인 버튼 클릭 시 true, 취소/닫힘/자동닫힘 시 false 반환.
 */
export function confirmSonner(message: string, options: ConfirmSonnerOptions = {}): Promise<boolean> {
    const { confirmLabel = "확인", cancelLabel = "취소", description } = options;

    return new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (value: boolean) => {
            if (settled) return;
            settled = true;
            resolve(value);
        };

        toast(message, {
            description,
            duration: Infinity,
            closeButton: false,
            action: {
                label: confirmLabel,
                onClick: () => settle(true),
            },
            cancel: {
                label: cancelLabel,
                onClick: () => settle(false),
            },
            onDismiss: () => settle(false),
            onAutoClose: () => settle(false),
        });
    });
}
