"use client";

import { useMemo, useState } from "react";
import styles from "./GoogleSheetEmbedPage.module.css";

/** 공유·권한이 맞으면 로그인 없이도 열릴 수 있습니다. 막히면 시트 공유 설정을 확인하세요. */
const GOOGLE_SHEET_EMBED_SRC =
    "https://docs.google.com/spreadsheets/d/1zwIJjl2UTkPREkI37in9e0PAwX9xwFtEU3-ECAYYaeU/edit?rm=minimal&widget=true&headers=false&gid=0";

const ZOOM_MIN = 50;
const ZOOM_MAX = 150;
const ZOOM_DEFAULT = 100;

export default function GoogleSheetEmbedPage() {
    const [zoomPercent, setZoomPercent] = useState(ZOOM_DEFAULT);
    const z = zoomPercent / 100;

    const scalerStyle = useMemo(
        () =>
            ({
                width: `${100 / z}%`,
                height: `${100 / z}%`,
                transform: `scale(${z})`,
                transformOrigin: "0 0",
            }) as const,
        [z]
    );

    return (
        <div className={styles.page}>
            <h1 className={styles.title}>시트지</h1>
            <p className={styles.subtitle}>확대·축소 조절가능합니다.</p>
            <div className={styles.zoomBar}>
                <label className={styles.zoomLabel} htmlFor="sheet-zoom-range">
                    보기 비율
                </label>
                <input
                    id="sheet-zoom-range"
                    className={styles.zoomRange}
                    type="range"
                    min={ZOOM_MIN}
                    max={ZOOM_MAX}
                    step={5}
                    value={zoomPercent}
                    onChange={(e) => setZoomPercent(Number(e.target.value))}
                    aria-valuemin={ZOOM_MIN}
                    aria-valuemax={ZOOM_MAX}
                    aria-valuenow={zoomPercent}
                />
                <span className={styles.zoomValue}>{zoomPercent}%</span>
                <button type="button" className={styles.zoomReset} onClick={() => setZoomPercent(ZOOM_DEFAULT)}>
                    100%로
                </button>
            </div>
            <div className={styles.frameWrap}>
                <div className={styles.frameScroll}>
                    <div className={styles.frameScaler} style={scalerStyle}>
                        <iframe
                            className={styles.frame}
                            src={GOOGLE_SHEET_EMBED_SRC}
                            title="시트지"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                        />
                    </div>
                </div>
            </div>
            <p className={styles.footerNote}>
                원본:{" "}
                <a
                    href="https://docs.google.com/spreadsheets/d/1zwIJjl2UTkPREkI37in9e0PAwX9xwFtEU3-ECAYYaeU/htmlview#gid=0"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    구글 시트에서 열기
                </a>
            </p>
        </div>
    );
}
