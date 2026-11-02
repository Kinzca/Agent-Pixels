import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

export const PLUGIN_ID = "agent-pixels.compat";
export const PLUGIN_VERSION = "0.2.1";
export const PAGE_ROUTE = "agent-pixels-compat";

export const SLOT_IDS = {
  sidebar: "agent-pixels-sidebar",
  page: "agent-pixels-camera-page",
  settingsPage: "agent-pixels-settings-page",
} as const;

export const EXPORT_NAMES = {
  sidebar: "AgentPixelsSidebarLink",
  page: "AgentPixelsCameraPage",
  settingsPage: "AgentPixelsSettingsPage",
} as const;

const manifest: PaperclipPluginManifestV1 = {
  id: PLUGIN_ID,
  apiVersion: 1,
  version: PLUGIN_VERSION,
  displayName: "Agent Pixels · 流程核查",
  description: "Security camera style pixel office view for Paperclip companies.",
  author: "Garratt Campton",
  categories: ["ui"],
  capabilities: [
    "companies.read",
    "agents.read",
    "issues.read",
    "issues.orchestration.read",
    "issue.comments.read",
    "instance.settings.register",
    "ui.sidebar.register",
    "ui.page.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "sidebar",
        id: SLOT_IDS.sidebar,
        displayName: "Agent Pixels · 流程核查",
        exportName: EXPORT_NAMES.sidebar,
      },
      {
        type: "page",
        id: SLOT_IDS.page,
        displayName: "Agent Pixels · 流程核查",
        exportName: EXPORT_NAMES.page,
        routePath: PAGE_ROUTE,
      },
      {
        type: "settingsPage",
        id: SLOT_IDS.settingsPage,
        displayName: "Agent Pixels Settings",
        exportName: EXPORT_NAMES.settingsPage,
      },
    ],
  },
};

export default manifest;
