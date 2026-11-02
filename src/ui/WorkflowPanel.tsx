import type { deriveWorkflow, WorkflowIssue, Run } from '../workflow.js';

export type WorkflowSnapshot = {
  observedAt: string;
  tasks: Array<{ id: string; identifier: string; title: string; status: string }>;
  agents: Array<{ id: string; name: string; status?: string | null; workflowLabel?: string }>;
  selected: (WorkflowIssue & {
    workflow: ReturnType<typeof deriveWorkflow>;
    runs: Run[];
    comments: Array<{ id: string; authorAgentId: string | null; createdAt: string; body: string }>;
  }) | null;
};
const activities: Record<string, string> = { running: '正在运行', queued: '已排队', waiting: '等待启动', finished: '阶段已结束', failed: '运行失败', unknown: '运行状态待确认' };
const runStatuses: Record<string, string> = { running: '运行中', queued: '已排队', succeeded: '运行结束', cancelled: '已停止', failed: '失败', timed_out: '超时' };
const agentStatuses: Record<string, string> = { idle: '空闲', running: '运行中', paused: '已暂停', error: '异常', terminated: '已停用' };
const phases = [['execution', '执行'], ['review', '审查'], ['rework', '返修'], ['rereview', '复审']] as const;
const time = (value?: string | null) => value ? new Date(value).toLocaleTimeString() : '—';

export function WorkflowTaskPicker({ data, issueId, onSelect }: {
  data: WorkflowSnapshot | null; issueId: string; onSelect: (id: string) => void;
}) {
  return <label className="ap-office-task-picker">
    <span className="ap-office-field-label">核查任务</span>
    <select className="ap-office-select" aria-label="核查任务" value={issueId} onChange={e => onSelect(e.target.value)}>
      <option value="">自动跟随进行中的任务</option>
      {data?.tasks.map(task => <option key={task.id} value={task.id}>{task.identifier} · {task.title}</option>)}
    </select>
  </label>;
}

export function WorkflowPanel({ data, companyPrefix, error, stale }: {
  data: WorkflowSnapshot | null; companyPrefix: string | null; error: string | null; stale: boolean;
}) {
  const task = data?.selected;
  const root = companyPrefix ? `/${encodeURIComponent(companyPrefix)}` : '';
  const taskHref = task ? `${root}/issues/${encodeURIComponent(task.identifier ?? task.id)}` : '#';
  const name = (id?: string | null) => data?.agents.find(a => a.id === id)?.name ?? (id ? '其他参与者' : '—');
  const decision = task?.workflow.decision;
  const decisionText = decision === 'approved' ? '批准' : decision === 'changes_requested' ? '要求返修' : decision ?? '尚无';

  return <aside className="ap-office-inspector" aria-label="真实任务流程">
    <header className="ap-office-panel-head">
      <h2>流程核查</h2>
      {task ? <a className="ap-office-task-ref" href={taskHref} target="_blank" rel="noreferrer" aria-label={`打开 ${task.identifier ?? '当前任务'} 原始记录`}>{task.identifier ?? '原始任务'} ↗</a> : null}
    </header>
    {task ? <>
      <div className="ap-office-panel-body">
        <p className="ap-office-task-title">{task.title}</p>
        <div className="ap-office-state-line">
          <strong className="ap-office-state-label">{task.workflow.label}</strong>
          {decision === 'approved' ? <span className="ap-office-badge" data-tone="success"><span className="ap-office-dot" aria-hidden="true" />已批准</span> : null}
        </div>
        <div className="ap-office-stages" aria-label="当前执行阶段">
          {phases.map(([key, label]) => <span key={key} className="ap-office-stage" aria-current={task.workflow.phase === key ? 'step' : undefined}>{label}</span>)}
        </div>
        <dl className="ap-office-facts">
          <div><dt>运行情况</dt><dd>{activities[task.workflow.activity] ?? task.workflow.activity}</dd></div>
          <div><dt>当前负责人</dt><dd>{name(task.workflow.actorId)}</dd></div>
          <div><dt>最近决策</dt><dd>{decisionText}</dd></div>
        </dl>
        <hr className="ap-office-divider" />
        <div className="ap-office-section-title">Agent <span>{data?.agents.length ?? 0} 位成员</span></div>
        {data?.agents.map(agent => <div key={agent.id} className="ap-office-agent" title={`宿主状态：${agent.status ?? '未知'}`}>
          <span className="ap-office-avatar" aria-hidden="true">{Array.from(agent.name)[0]}</span>
          <span className="ap-office-agent-name">{agent.name}</span>
          <span className="ap-office-agent-state">{agent.workflowLabel ?? agentStatuses[agent.status ?? ''] ?? '状态待确认'}</span>
        </div>)}
      </div>
      <details className="ap-office-records">
        <summary>真实运行与提交记录 · {task.runs.length} 次运行</summary>
        <div className="ap-office-record-content">
          <p className="ap-office-caption">运行结束与审查批准分别记录。转交时旧运行可能被停止，最终结果以任务决策为准。</p>
          <ol className="ap-office-runs">
            {task.runs.map(run => <li key={run.id} className="ap-office-run">
              <div className="ap-office-run-top">
                <a className="ap-office-record-link" href={`${root}/agents/${encodeURIComponent(run.agentId)}/runs/${encodeURIComponent(run.id)}`} target="_blank" rel="noreferrer">{name(run.agentId)} ↗</a>
                <span className="ap-office-caption">{runStatuses[run.status] ?? run.status}</span>
              </div>
              <div className="ap-office-run-time">{time(run.startedAt)} → {time(run.finishedAt)}</div>
              {run.error ? <div className="ap-office-run-error">{run.error}</div> : null}
            </li>)}
          </ol>
          <div className="ap-office-section-title">提交原文 <span>最近 {task.comments.length} 条</span></div>
          {task.comments.map(comment => <details key={comment.id} className="ap-office-comment">
            <summary>{name(comment.authorAgentId)} · {time(comment.createdAt)}
              <span className="ap-office-comment-title">{comment.body.split('\n').find(line => line.trim())?.slice(0, 100)}</span>
            </summary>
            <div className="ap-office-comment-body">{comment.body}</div>
          </details>)}
          <a className="ap-office-record-link ap-office-caption" href={taskHref} target="_blank" rel="noreferrer">打开完整任务与审查记录 ↗</a>
        </div>
      </details>
    </> : <div className="ap-office-empty">{error ? '暂时无法读取核查记录' : '选择任务后在这里查看执行与审查情况。'}</div>}
    {error || stale ? <div className="ap-office-panel-body"><p className="ap-office-caption">{error ? `读取失败：${error}` : '数据尚未更新，当前显示仅供参考。'}</p></div> : null}
  </aside>;
}
