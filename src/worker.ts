import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import { deriveWorkflow, type WorkflowIssue } from "./workflow.js";
import { PLUGIN_ID } from "./manifest.js";

function normalizeIssue<T extends { updatedAt: Date | string }>(issue: T) {
  return { ...issue, updatedAt: new Date(issue.updatedAt).toISOString() };
}

const plugin = definePlugin({
  async setup(ctx) {
    ctx.logger.info("Agent Pixels plugin setup complete");

    ctx.data.register("camera-room", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : null;
      if (!companyId) return { companyId, observedAt: new Date().toISOString(), agents: [], tasks: [], selected: null };
      const [agents, listed] = await Promise.all([
        ctx.agents.list({ companyId, limit: 100, offset: 0 }),
        ctx.issues.list({ companyId, limit: 20, offset: 0 }),
      ]);
      // 列表投影不包含 executionState，必须读取详情；分批限制并发。
      const tasks: WorkflowIssue[] = [];
      for (let offset = 0; offset < listed.length; offset += 4) {
        const batch = await Promise.all(listed.slice(offset, offset + 4).map(i => ctx.issues.get(i.id, companyId)));
        for (const item of batch) if (item) tasks.push(normalizeIssue(item));
      }
      tasks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const requested = typeof params.issueId === 'string' && params.issueId ? params.issueId : null;
      const requestedTask = requested ? await ctx.issues.get(requested, companyId) : null;
      let selected: WorkflowIssue | null = requested ? (requestedTask ? normalizeIssue(requestedTask) : null) : tasks.find(i => !['done', 'cancelled'].includes(i.status)) ?? tasks[0] ?? null;
      let runs: Awaited<ReturnType<typeof ctx.issues.summaries.getOrchestration>>['runs'] = [];
      let comments: Awaited<ReturnType<typeof ctx.issues.listComments>> = [];
      if (selected) {
        // 跨请求发生交接时重读，避免旧阶段搭配新运行被错误展示。
        for (let attempt = 0; attempt < 3; attempt++) {
          const before: WorkflowIssue = selected!;
          const [summary, thread] = await Promise.all([
            ctx.issues.summaries.getOrchestration({ issueId: before.id, companyId, includeSubtree: false }),
            ctx.issues.listComments(before.id, companyId),
          ]);
          const after = await ctx.issues.get(before.id, companyId);
          if (!after) throw new Error('当前任务已不可读');
          selected = normalizeIssue(after);
          if (before.updatedAt === selected.updatedAt && JSON.stringify(before.executionState) === JSON.stringify(after.executionState)) {
            runs = summary.runs; comments = thread; break;
          }
          if (attempt === 2) throw new Error('任务正在交接，等待下一次一致快照');
        }
      }
      const workflow = selected ? deriveWorkflow(selected, runs) : null;
      return {
        companyId, observedAt: new Date().toISOString(), room: 'Office',
        tasks: tasks.map(i => ({ id: i.id, identifier: i.identifier, title: i.title, status: i.status })),
        selected: selected ? { ...selected, workflow, runs: runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
          comments: comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-12).map(c => ({ id: c.id, authorAgentId: c.authorAgentId, createdAt: c.createdAt, body: c.body })) } : null,
        agents: agents.map(agent => {
          const working = workflow?.actorId === agent.id && workflow.activity === 'running';
          return { id: agent.id, name: agent.name, status: agent.status, urlKey: agent.urlKey,
            activityKind: working ? (['review', 'rereview'].includes(workflow!.phase) ? 'research' : 'coding') : 'idle',
            workflowLabel: workflow?.actorId === agent.id ? workflow.label : agent.status === 'running' ? '其他任务运行中' : '空闲',
          };
        }),
      };
    });

    ctx.data.register("character-settings", async (params) => {
      const companyId = typeof params.companyId === "string" ? params.companyId : null;
      const agents = companyId ? await ctx.agents.list({ companyId, limit: 100, offset: 0 }) : [];

      return {
        agents: agents.map((agent) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          urlKey: agent.urlKey,
        })),
      };
    });
  },

  async onHealth() {
    return { status: "ok", message: `${PLUGIN_ID} ready` };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
