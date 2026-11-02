import { uiText, useUiLocale } from "./i18n.js";
import { useEffect, useMemo, useRef, useState } from "react";
import { useHostContext, usePluginData, type PluginSettingsPageProps, type PluginSidebarProps } from "@paperclipai/plugin-sdk/ui";
import { WorkflowPanel, WorkflowSummary, WorkflowTaskPicker, type WorkflowSnapshot } from "./WorkflowPanel.js";
import { OFFICE_STYLES } from "./officeStyles.js";
import { PAGE_ROUTE } from "../manifest.js";
import { PixelOfficeCanvas } from "./PixelOfficeCanvas.js";
import { getPluginAssetBaseUrl, type AssetIndex } from "./pixelAssets.js";

type CameraRoomData = WorkflowSnapshot & {
  companyId: string;
  observedAt: string;
  room: string;
  agents: Array<{
    id: string;
    name: string;
    status?: string | null;
    urlKey?: string | null;
    activityKind?: "coding" | "research" | "writing" | "meeting" | "idle";
    characterIndex?: number;
    workflowLabel?: string;
  }>;
};

type CharacterSettingsData = {
  agents: Array<{
    id: string;
    name: string;
    status?: string | null;
    urlKey?: string | null;
  }>;
};

type CameraId = "office" | "boardroomKitchen" | "overflowOffice";

function cameraPagePath(companyPrefix: string | null): string {
  return companyPrefix ? `/${companyPrefix}/${PAGE_ROUTE}` : `/${PAGE_ROUTE}`;
}

function assignmentsStorageKey(companyId: string | null): string {
  return `agent-pixels.character-assignments.${companyId ?? "instance"}`;
}

function readStoredAssignments(companyId: string | null): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(assignmentsStorageKey(companyId)) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] =>
        typeof entry[0] === "string" && typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] >= 0,
      ),
    );
  } catch {
    return {};
  }
}

function writeStoredAssignments(companyId: string | null, assignments: Record<string, number>) {
  window.localStorage.setItem(assignmentsStorageKey(companyId), JSON.stringify(assignments));
}

function OfficeIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18M5 21V3h10v18M15 9h4v12M8 7h4M8 11h4M8 15h4M9 21v-2h2v2" />
  </svg>;
}

export function AgentPixelsSidebarLink({ context }: PluginSidebarProps) {
  useUiLocale();
  const href = cameraPagePath(context.companyPrefix);
  const isActive = typeof window !== 'undefined' && window.location.pathname.startsWith(href);
  return <>
    <style>{OFFICE_STYLES}</style>
    <a href={href} className="ap-office-nav" aria-current={isActive ? 'page' : undefined}>
      <OfficeIcon /><span>{uiText("Office")}</span>
    </a>
  </>;
}

export function AgentPixelsCameraPage() {
  const locale = useUiLocale();
  const pageRef = useRef<HTMLElement>(null);
  const { companyId, companyPrefix } = useHostContext();
  const [issueId, setIssueId] = useState('');
  const { data: response, loading, error, refresh } = usePluginData<CameraRoomData>('camera-room', { companyId, issueId });
  const data = response?.companyId === companyId && (!issueId || response.selected?.id === issueId) ? response : null;
  const [clock, setClock] = useState(Date.now());
  const busy = useRef(loading);
  busy.current = loading;
  useEffect(() => { setIssueId(''); }, [companyId]);
  useEffect(() => {
    const tick = () => {
      setClock(Date.now());
      if (!document.hidden && !busy.current) { busy.current = true; refresh(); }
    };
    const timer = window.setInterval(tick, 2500);
    const visible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', visible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [companyId, issueId, refresh]);
  const stale = !data || clock - Date.parse(data.observedAt) > 12000;
  const [assignments, setAssignments] = useState<Record<string, number>>(() => readStoredAssignments(companyId ?? null));
  const agents = useMemo(
    () => (data?.agents ?? []).map((agent) => ({ ...agent, workflowLabel: agent.workflowLabel ? uiText(agent.workflowLabel) : undefined, characterIndex: assignments[agent.id] })),
    [assignments, data?.agents, locale],
  );
  const [camera, setCamera] = useState<CameraId>("office");
  const [view, setView] = useState<"camera" | "characters">("camera");

  useEffect(() => {
    setAssignments(readStoredAssignments(companyId ?? null));
  }, [companyId]);

  useEffect(() => {
    const hostSlot = pageRef.current?.parentElement;
    const hostBackRow = hostSlot?.previousElementSibling as HTMLElement | null;
    const hostWrapper = hostSlot?.parentElement as HTMLElement | null;
    const previousDisplay = hostBackRow?.style.display;
    const previousGap = hostWrapper?.style.gap;

    if (hostBackRow?.textContent?.includes("Back")) hostBackRow.style.display = "none";
    if (hostWrapper) hostWrapper.style.gap = "0";

    return () => {
      if (hostBackRow && previousDisplay !== undefined) hostBackRow.style.display = previousDisplay;
      if (hostWrapper && previousGap !== undefined) hostWrapper.style.gap = previousGap;
    };
  }, []);

  const readTime = data?.observedAt ? new Date(data.observedAt).toLocaleTimeString() : '—';
  const syncLabel = error ? '读取失败' : stale ? (loading && !data ? '首次连接中' : '等待新数据') : '自动刷新';
  const roomName = camera === 'office' ? '办公室与休息区' : camera === 'boardroomKitchen' ? '会议室与茶水间' : '扩展办公室';

  return (
    <main ref={pageRef} className="ap-office" aria-label={uiText("Office")}>
      <style>{OFFICE_STYLES}</style>
      <div className="ap-office-toolbar">
        <WorkflowTaskPicker key={companyId ?? "instance"} data={data} issueId={issueId} onSelect={setIssueId} />
        <div className="ap-office-sync" data-tone={error || stale ? 'warning' : 'ok'}>
          <span className="ap-office-dot" aria-hidden="true" />{uiText(syncLabel)}
          <time dateTime={data?.observedAt}>{uiText("上次读取 ")}{readTime}</time>
        </div>
      </div>
      <WorkflowSummary data={data} companyPrefix={companyPrefix} error={error?.message ?? null} stale={stale} />
      <div className="ap-office-workspace">
        <section className="ap-office-scene" aria-label={uiText("办公室现场")}>
          <header className="ap-office-scene-head">
            <div className="ap-office-scene-name"><OfficeIcon />{view === 'characters' ? uiText("角色设置") : uiText(roomName)}</div>
            <div className="ap-office-controls">
              <div className="ap-office-segments" aria-label={uiText("办公室视角")}>
                {([['office', '办公室'], ['boardroomKitchen', '会议室'], ['overflowOffice', '扩展区']] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === 'camera' && camera === id} onClick={() => { setView('camera'); setCamera(id); }}>{label}</button>)}
              </div>
              <button className="ap-office-quiet-button" type="button" aria-pressed={view === 'characters'} onClick={() => setView(view === 'characters' ? 'camera' : 'characters')}>{uiText("角色")}</button>
            </div>
          </header>
          {view === 'characters' ? <CharacterAssignmentsPanel companyId={companyId ?? null} assignments={assignments} onAssignmentsChange={setAssignments} /> : <div className="ap-office-camera" aria-label={uiText("Agent Pixels office camera")}>
            <PixelOfficeCanvas camera={camera} agents={agents} />
          </div>}
          <footer className="ap-office-scene-foot"><span>{agents.length}{uiText(" 位 Agent · ")}{view === 'characters' ? uiText("角色分配") : uiText("团队现场")}</span><span>{uiText("当前任务状态见上方摘要")}</span></footer>
        </section>
        <WorkflowPanel data={data} companyPrefix={companyPrefix} error={error?.message ?? null} stale={stale} />
      </div>
    </main>
  );
}

function useCharacterAssets() {
  const [assets, setAssets] = useState<Array<{ index: number; path: string; url: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPluginAssetBaseUrl().then(async baseUrl => {
      const response = await fetch(`${baseUrl}agent-pixels-assets.json`);
      if (!response.ok) throw new Error(`素材目录读取失败：${response.status}`);
      return { index: await response.json() as AssetIndex, baseUrl };
    })
      .then(({ index, baseUrl }) => {
        if (cancelled) return;
        setAssets(index.characters.map((path, index) => ({ index, path, url: `${baseUrl}${path}` })));
        setError(null);
      })
      .catch((nextError: unknown) => {
        if (cancelled) return;
        setError(nextError instanceof Error ? nextError.message : String(nextError));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { assets, error };
}

function SpritePreview({ url, scale = 2 }: { url: string; scale?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 16 * scale,
        height: 32 * scale,
        backgroundImage: `url(${url})`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "0 0",
        backgroundSize: `${16 * scale * 7}px ${32 * scale * 3}px`,
        imageRendering: "pixelated",
      }}
    />
  );
}

function CharacterAssignmentsPanel({
  companyId,
  assignments,
  onAssignmentsChange,
}: {
  companyId: string | null;
  assignments?: Record<string, number>;
  onAssignmentsChange?: (assignments: Record<string, number>) => void;
}) {
  useUiLocale();
  const { data, loading, error, refresh } = usePluginData<CharacterSettingsData>("character-settings", companyId ? { companyId } : {});
  const { assets, error: assetError } = useCharacterAssets();
  const [savingAgentId, setSavingAgentId] = useState<string | null>(null);
  const [storedAssignments, setStoredAssignments] = useState<Record<string, number>>(() => assignments ?? readStoredAssignments(companyId));
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [draftIndex, setDraftIndex] = useState<number | null>(null);

  useEffect(() => {
    setStoredAssignments(assignments ?? readStoredAssignments(companyId));
  }, [assignments, companyId]);

  const agents = data?.agents ?? [];
  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;
  const selectedIndex = selectedAgent ? storedAssignments[selectedAgent.id] : undefined;
  const visibleIndex = draftIndex ?? selectedIndex;

  useEffect(() => {
    setDraftIndex(null);
  }, [selectedAgent?.id, selectedIndex]);

  async function updateAssignment(agentId: string, characterIndex: number | null) {
    setSavingAgentId(agentId);
    try {
      const next = { ...storedAssignments };
      if (characterIndex === null) delete next[agentId];
      else next[agentId] = characterIndex;
      writeStoredAssignments(companyId, next);
      setStoredAssignments(next);
      onAssignmentsChange?.(next);
      refresh();
    } finally {
      setSavingAgentId(null);
    }
  }

  if (loading) return <div className="ap-office-empty">{uiText("正在读取角色设置…")}</div>;
  if (error) return <div style={{ padding: 24, fontSize: 13 }}>{uiText("读取角色设置失败：")}{error.message}</div>;

  function randomIndex(): number | null {
    if (assets.length === 0) return null;
    const used = new Set(Object.values(storedAssignments));
    const open = assets.filter((asset) => !used.has(asset.index) || asset.index === selectedIndex);
    const pool = open.length > 0 ? open : assets;
    return pool[Math.floor(Math.random() * pool.length)]?.index ?? null;
  }

  return (
    <section style={{ padding: "18px", display: "grid", gap: "14px", color: "var(--foreground)", background: "var(--background)", border: "none", fontFamily: "inherit" }}>
      {assetError ? <div style={{ fontSize: "13px", color: "var(--destructive, #ef4444)" }}>{assetError}</div> : null}

      <div className="ap-office-character-grid">
        <aside style={{ border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "var(--card)" }}>
          <div style={{ padding: "12px", fontSize: "18px", fontWeight: 800, borderBottom: "1px solid var(--border)" }}>{uiText("团队成员")}</div>
          <div style={{ maxHeight: "610px", overflow: "auto" }}>
            {agents.map((agent) => {
              const assigned = storedAssignments[agent.id];
              const assignedAsset = assets[assigned] ?? null;
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  style={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 42px",
                    gap: "8px",
                    alignItems: "center",
                    padding: "9px 10px",
                    border: 0,
                    borderBottom: "1px solid var(--border)",
                    background: isSelected ? "var(--accent)" : "transparent",
                    color: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {agent.name}
                    </span>
                    <span style={{ display: "block", fontSize: "11px", opacity: 0.65 }}>{assignedAsset ? uiText("char_{{value0}}", { value0: String(assigned) }) : uiText("自动")}</span>
                  </span>
                  <span style={{ width: 36, height: 48, display: "grid", placeItems: "center", background: "var(--muted)", borderRadius: 4 }}>
                    {assignedAsset ? <SpritePreview url={assignedAsset.url} scale={1.5} /> : <span style={{ fontSize: 10, opacity: 0.65 }}>{uiText("Auto")}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section style={{ display: "grid", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "15px", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {selectedAgent?.name ?? uiText("暂无 Agent")}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.7 }}>
                {visibleIndex !== undefined && visibleIndex !== null ? uiText("已选择角色 {{value0}}", { value0: String(visibleIndex) }) : uiText("自动分配角色")}
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {selectedAgent ? (
                <button
                  type="button"
                  disabled={savingAgentId === selectedAgent.id || draftIndex === null}
                  onClick={() => void updateAssignment(selectedAgent.id, draftIndex)}
                  style={{ padding: "7px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--accent)", color: "inherit", cursor: draftIndex === null ? "default" : "pointer" }}
                >{uiText("保存")}</button>
              ) : null}
              {selectedAgent ? (
                <button
                  type="button"
                  disabled={savingAgentId === selectedAgent.id || assets.length === 0}
                  onClick={() => {
                    const next = randomIndex();
                    if (next !== null) setDraftIndex(next);
                  }}
                  style={{ padding: "7px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "inherit", cursor: "pointer" }}
                >{uiText("随机")}</button>
              ) : null}
              {selectedAgent && selectedIndex !== undefined ? (
              <button
                type="button"
                disabled={savingAgentId === selectedAgent.id}
                onClick={() => void updateAssignment(selectedAgent.id, null)}
                style={{ padding: "7px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "transparent", color: "inherit", cursor: "pointer" }}
              >{uiText("重置")}</button>
              ) : null}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(58px, 1fr))",
              gap: "8px",
              maxHeight: "610px",
              overflow: "auto",
              padding: "10px",
              border: "1px solid var(--border)",
              borderRadius: 6,
              background: "var(--muted)",
            }}
          >
            {assets.map((asset) => (
              <button
                key={asset.path}
                type="button"
                disabled={!selectedAgent || savingAgentId === selectedAgent.id}
                onClick={() => setDraftIndex(asset.index)}
                title={asset.path.replace("characters/", "").replace(".png", "")}
                style={{
                  height: 82,
                  display: "grid",
                  placeItems: "center",
                  border: asset.index === visibleIndex ? "2px solid var(--foreground)" : "1px solid var(--border)",
                  borderRadius: 6,
                  background: asset.index === visibleIndex ? "var(--accent)" : "var(--card)",
                  cursor: selectedAgent ? "pointer" : "default",
                }}
              >
                <SpritePreview url={asset.url} scale={2} />
              </button>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export function AgentPixelsSettingsPage({ context }: PluginSettingsPageProps) {
  return (
    <main className="ap-office">
      <style>{OFFICE_STYLES}</style>
      <CharacterAssignmentsPanel companyId={context.companyId ?? null} />
    </main>
  );
}
