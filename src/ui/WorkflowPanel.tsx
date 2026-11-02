import type { deriveWorkflow, WorkflowIssue, Run } from '../workflow.js';
export type WorkflowSnapshot = {
  observedAt: string;
  tasks: Array<{ id: string; identifier: string; title: string; status: string }>;
  agents: Array<{ id: string; name: string; status?: string | null; workflowLabel?: string }>;
  selected: (WorkflowIssue & { workflow: ReturnType<typeof deriveWorkflow>; runs: Run[]; comments: Array<{ id: string; authorAgentId: string | null; createdAt: string; body: string }> }) | null;
};
const activities: Record<string, string> = { running: '正在运行', queued: '已排队', waiting: '等待启动', finished: '阶段已结束', failed: '运行失败', unknown: '运行状态待确认' };
const runStatuses: Record<string, string> = { running: '运行中', queued: '已排队', succeeded: '运行结束', cancelled: '已停止', failed: '失败', timed_out: '超时' };
const phases = [['execution', '执行'], ['review', '审查'], ['rework', '返修'], ['rereview', '复审']] as const;
const time = (value?: string | null) => value ? new Date(value).toLocaleTimeString() : '—';
export function WorkflowPanel({ data, companyPrefix, issueId, onSelect, error, stale }: {
  data: WorkflowSnapshot | null; companyPrefix: string | null; issueId: string; onSelect: (id: string) => void; error: string | null; stale: boolean;
}) {
  const task = data?.selected;
  const root = companyPrefix ? `/${encodeURIComponent(companyPrefix)}` : '';
  const taskHref = task ? `${root}/issues/${encodeURIComponent(task.identifier ?? task.id)}` : '#';
  const name = (id?: string | null) => data?.agents.find(a => a.id === id)?.name ?? (id ? '其他参与者' : '—');
  const box = { padding: '10px 12px', background: '#1f2937', borderRadius: 6, border: '1px solid #374151' };
  return <section aria-label="真实任务流程" style={{ marginBottom: 12, fontSize: 13 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
      <label>核查任务 <select aria-label="核查任务" value={issueId} onChange={e => onSelect(e.target.value)} style={{ background: '#1f2937', color: '#fff', padding: 6, maxWidth: 550 }}>
        <option value="">自动跟随进行中的任务</option>
        {data?.tasks.map(i => <option key={i.id} value={i.id}>{i.identifier} · {i.title}</option>)}
      </select></label>
      <span style={{ color: error || stale ? '#fbbf24' : '#a7f3d0' }}>{error ? `读取失败：${error}` : stale ? '数据尚未更新，当前显示仅供参考' : '已同步'} · 上次读取 {time(data?.observedAt)}</span>
    </div>
    {task ? <>
      <div style={{ ...box, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', marginBottom: 8 }}>
        <a href={taskHref} target="_blank" rel="noreferrer" style={{ color: '#93c5fd' }}>{task.identifier} · 原始任务与审查记录 ↗</a>
        <strong style={{ color: '#6ee7b7', fontSize: 18 }}>{task.workflow.label}</strong>
        <span>{activities[task.workflow.activity]} · 当前负责人 {name(task.workflow.actorId)}</span>
        <span>最近决策：{task.workflow.decision === 'approved' ? '批准' : task.workflow.decision === 'changes_requested' ? '要求返修' : task.workflow.decision ?? '尚无'}</span>
        <div style={{ display: 'flex', gap: 6 }}>{phases.map(([key, label]) => <span key={key} style={{ padding: '4px 8px', borderRadius: 4, background: task.workflow.phase === key ? '#065f46' : '#374151', opacity: task.workflow.phase === key ? 1 : 0.6 }}>{label}</span>)}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>{data?.agents.map(a => <div key={a.id} style={{ ...box, flex: '1 1 240px' }}><strong>{a.name}</strong> · {a.workflowLabel}<span style={{ color: '#9ca3af', marginLeft: 12 }}>宿主状态：{a.status}</span></div>)}</div>
      <details style={{ ...box, marginBottom: 8 }}><summary style={{ cursor: 'pointer' }}>真实运行与提交记录 · {task.runs.length} 次运行 / {task.comments.length} 条最近评论</summary>
        <p style={{ color: '#9ca3af' }}>运行结束不代表审查通过；转交阶段时旧运行可能被停止。决策以任务审查状态及原始记录为准。本页展示最近 20 个任务、所选任务最近 12 条评论。</p>
        <ol>{task.runs.map(run => <li key={run.id} style={{ marginBottom: 6 }}><a style={{ color: '#93c5fd' }} href={`${root}/agents/${encodeURIComponent(run.agentId)}/runs/${encodeURIComponent(run.id)}`} target="_blank" rel="noreferrer">{name(run.agentId)} · {runStatuses[run.status] ?? run.status}</a> · {time(run.startedAt)} → {time(run.finishedAt)}{run.error ? <span> · {run.error}</span> : null}</li>)}</ol>
        {task.comments.map(c => <details key={c.id} style={{ borderTop: '1px solid #374151', padding: '8px 0' }}><summary>{name(c.authorAgentId)} · {time(c.createdAt)} · {c.body.split('\n').find(line => line.trim())?.slice(0, 100)}</summary><div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', padding: 8 }}>{c.body}</div></details>)}
      </details>
    </> : <div style={box}>{error ? '当前无法读取任务' : '等待可核查的任务数据'}</div>}
  </section>;
}
