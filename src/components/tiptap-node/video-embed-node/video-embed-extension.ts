import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
    interface Commands<ReturnType> {
        videoEmbed: {
            setVideoEmbed: (attrs: { embedSrc: string; originalUrl: string }) => ReturnType;
        };
    }
}

export const VideoEmbed = Node.create({
    name: "videoEmbed",
    group: "block",
    atom: true,
    draggable: true,
    selectable: true,
    defining: true,

    addAttributes() {
        return {
            embedSrc: {
                default: null,
            },
            originalUrl: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "div.board-video-embed",
                priority: 100,
                getAttrs: (element) => {
                    if (!(element instanceof HTMLElement)) return false;
                    const iframe = element.querySelector("iframe");
                    const src = iframe?.getAttribute("src")?.trim() || element.getAttribute("data-embed-src")?.trim();
                    if (!src) return false;
                    const originalUrl = element.getAttribute("data-original-url")?.trim() || src;
                    return { embedSrc: src, originalUrl };
                },
            },
        ];
    },

    renderHTML({ node }) {
        const embedSrc = node.attrs.embedSrc as string | null;
        const originalUrl = (node.attrs.originalUrl as string | null) || embedSrc;
        if (!embedSrc) {
            return ["div", { class: "board-video-embed board-video-embed--empty" }];
        }
        return [
            "div",
            mergeAttributes({
                class: "board-video-embed",
                "data-original-url": originalUrl ?? "",
                "data-embed-src": embedSrc,
            }),
            [
                "iframe",
                {
                    src: embedSrc,
                    loading: "lazy",
                    class: "board-video-embed-iframe",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen",
                    allowfullscreen: "true",
                    referrerpolicy: "strict-origin-when-cross-origin",
                    title: "Embedded video",
                },
            ],
        ];
    },

    addCommands() {
        return {
            setVideoEmbed:
                (attrs: { embedSrc: string; originalUrl: string }) =>
                ({ commands }) =>
                    commands.insertContent({
                        type: this.name,
                        attrs,
                    }),
        };
    },
});

export default VideoEmbed;
