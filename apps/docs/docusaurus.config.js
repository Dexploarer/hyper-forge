"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var prism_react_renderer_1 = require("prism-react-renderer");
var config = {
    title: "Asset-Forge Documentation",
    tagline: "AI-Powered 3D Asset Generation Platform",
    favicon: "img/favicon.ico",
    // Production URL
    url: "https://your-docs-domain.com",
    baseUrl: "/",
    // GitHub pages deployment config (optional)
    organizationName: "yourorg",
    projectName: "asset-forge",
    onBrokenLinks: "warn",
    onBrokenMarkdownLinks: "warn",
    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },
    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    // Point to your API routes docs
                    editUrl: "https://github.com/yourorg/asset-forge/tree/main/apps/docs/",
                    docItemComponent: "@theme/ApiItem", // OpenAPI theme component
                },
                blog: false, // Disable blog
                theme: {
                    customCss: "./src/css/custom.css",
                },
            },
        ],
    ],
    plugins: [
        [
            "docusaurus-plugin-openapi-docs",
            {
                id: "api",
                docsPluginId: "classic",
                config: {
                    assetforge: {
                        specPath: "http://localhost:3004/api/openapi.json", // Local dev
                        // For production build, use: 'https://your-api-domain.com/api/openapi.json'
                        outputDir: "docs/api-reference",
                        sidebarOptions: {
                            groupPathsBy: "tag",
                            categoryLinkSource: "tag",
                        },
                        version: "1.0.0",
                        label: "v1.0.0",
                        baseUrl: "/api-reference",
                        versions: {
                            "1.0.0": {
                                specPath: "http://localhost:3004/api/openapi.json",
                                outputDir: "docs/api-reference",
                                label: "v1.0.0",
                                baseUrl: "/api-reference",
                            },
                        },
                    },
                },
            },
        ],
    ],
    themes: ["docusaurus-theme-openapi-docs"],
    themeConfig: {
        image: "img/asset-forge-social-card.jpg",
        navbar: {
            title: "Asset-Forge",
            logo: {
                alt: "Asset-Forge Logo",
                src: "img/logo.svg",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "guidesSidebar",
                    position: "left",
                    label: "Guides",
                },
                {
                    type: "docSidebar",
                    sidebarId: "apiSidebar",
                    position: "left",
                    label: "API Reference",
                },
                {
                    href: "http://localhost:3004/swagger",
                    label: "Swagger UI",
                    position: "right",
                },
                {
                    href: "https://github.com/yourorg/asset-forge",
                    label: "GitHub",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Getting Started",
                            to: "/docs/intro",
                        },
                        {
                            label: "API Reference",
                            to: "/docs/api-reference",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "GitHub",
                            href: "https://github.com/yourorg/asset-forge",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "Swagger UI",
                            href: "http://localhost:3004/swagger",
                        },
                    ],
                },
            ],
            copyright: "Copyright \u00A9 ".concat(new Date().getFullYear(), " Asset-Forge Team. Built with Docusaurus."),
        },
        prism: {
            theme: prism_react_renderer_1.themes.github,
            darkTheme: prism_react_renderer_1.themes.dracula,
            additionalLanguages: ["bash", "json", "typescript", "javascript"],
        },
        // OpenAPI theme config
        languageTabs: [
            {
                highlight: "bash",
                language: "curl",
                logoClass: "bash",
            },
            {
                highlight: "javascript",
                language: "nodejs",
                logoClass: "nodejs",
            },
            {
                highlight: "typescript",
                language: "typescript",
                logoClass: "typescript",
            },
        ],
    },
};
exports.default = config;
