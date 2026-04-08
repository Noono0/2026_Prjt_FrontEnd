import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl } from "./normalizeApiBaseUrl";

describe("normalizeApiBaseUrl", () => {
    it("trims and strips trailing slashes", () => {
        expect(normalizeApiBaseUrl("  https://api.example.com/v1/  ")).toBe("https://api.example.com/v1");
    });

    it("falls back to localhost when empty after trim", () => {
        expect(normalizeApiBaseUrl("   ")).toBe("http://localhost:8080");
    });
});
