"use client";

import { useId } from "react";

/** SOOP 방송국 버튼용 인라인 SVG (`<img src=".svg">`는 turbopack/경로 이슈로 비어 보일 수 있어 번들에 포함) */
export function SoopBroadcastIcon({ size = 48, className }: { size?: number; className?: string }) {
    const safeId = useId().replace(/[^a-zA-Z0-9_-]/g, "_");
    const gradId = `soop-grad-${safeId}`;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            width={size}
            height={size}
            className={className}
            aria-hidden
        >
            <path
                fill="#334155"
                stroke="#94a3b8"
                strokeWidth={0.75}
                d="M0 6a6 6 0 0 1 6-6h12a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H6a6 6 0 0 1-6-6z"
            />
            <path
                fill={`url(#${gradId})`}
                d="M16.453 6.188a5.85 5.85 0 0 0-4.367 1.953.114.114 0 0 1-.172 0 5.86 5.86 0 1 0 0 7.812.114.114 0 0 1 .172 0 5.86 5.86 0 1 0 4.368-9.765m0 8.906c-.937 0-1.72-.452-2.201-.962-.153-.163-.343-.386-.552-.576q-.15-.134-.293-.243A2.4 2.4 0 0 0 12 12.867a2.42 2.42 0 0 0-1.407.445 4 4 0 0 0-.293.244c-.21.19-.399.413-.552.576-.48.51-1.263.962-2.201.962l-.071-.002q-.06-.001-.121-.005-.042-.002-.082-.006l-.049-.004a3.047 3.047 0 0 1-2.724-3.03v.013-.026.013a3.05 3.05 0 0 1 2.724-3.03l.051-.005.08-.006.121-.004.07-.002c.938 0 1.721.452 2.202.962.153.163.343.386.551.575q.15.136.294.244c.392.28.878.446 1.406.446s1.014-.166 1.406-.446a5 5 0 0 0 .294-.244c.209-.189.398-.412.551-.575A3.07 3.07 0 0 1 16.453 9l.07.002.122.004.077.006.054.005a3.05 3.05 0 0 1 2.718 2.851l.001.029.003.083v.124q0 .047-.003.094v.02a3.05 3.05 0 0 1-2.719 2.858l-.055.004a4 4 0 0 1-.199.01l-.07.003z"
            />
            <defs>
                <linearGradient id={gradId} x1="3.795" x2="20.928" y1="5.63" y2="18.955" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#0082FF" />
                    <stop offset="0.42" stopColor="#0A96FF" />
                    <stop offset="0.56" stopColor="#05BCFF" />
                    <stop offset="0.76" stopColor="#00F0FF" />
                    <stop offset="0.79" stopColor="#04F0FC" />
                    <stop offset="0.82" stopColor="#10F1F5" />
                    <stop offset="0.85" stopColor="#24F4E8" />
                    <stop offset="0.89" stopColor="#40F7D7" />
                    <stop offset="0.92" stopColor="#64FBC1" />
                    <stop offset="0.94" stopColor="#82FFB0" />
                </linearGradient>
            </defs>
        </svg>
    );
}
