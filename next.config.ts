import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    /** SVG를 React 컴포넌트로 import (예: import Icon from "./icon.svg"). `next dev --turbo` 는 webpack 설정 미적용일 수 있음 → 빌드·prod는 webpack 기준. */
    webpack(config) {
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: /\.[jt]sx?$/,
            use: ["@svgr/webpack"],
        });
        return config;
    },
};

export default nextConfig;
