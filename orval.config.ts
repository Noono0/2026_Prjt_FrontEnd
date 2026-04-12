import { defineConfig } from "orval";

const openApiUrl = process.env.OPENAPI_URL ?? "http://127.0.0.1:8080/v3/api-docs";

export default defineConfig({
    prjt: {
        input: {
            target: openApiUrl,
        },
        output: {
            mode: "tags-split",
            target: "src/generated/orval/endpoints.ts",
            schemas: "src/generated/orval/model",
            client: "fetch",
            clean: true,
            indexFiles: true,
            formatter: "prettier",
            override: {
                mutator: {
                    path: "./src/lib/orval-mutator.ts",
                    name: "customFetch",
                },
                fetch: {
                    includeHttpResponseReturnType: false,
                    forceSuccessResponse: false,
                },
            },
        },
    },
});
