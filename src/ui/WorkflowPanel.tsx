import { uiText, useUiLocale } from "./i18n.js";
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

export { WorkflowTaskPicker } from './TaskPicker.js';

function decisionLabel(decision?: string | null) {
  return uiText(decision === 'approved' ? '批准' : decision === 'changes_requested' ? '要求返修' : decision ?? '尚无审查决策');
}

export function WorkflowSummary({ data, companyPrefix, error, stale }: {
  data: WorkflowSnapshot | null; companyPrefix: string | null; error: string | null; stale: boolean;
}) {
  useUiLocale();
  const task = data?.selected;
  if (!task) return <section className="ap-office-summary ap-office-summary-empty" aria-label={uiText("当前任务摘要")}>
    {error ? uiText("当前任务读取失败，请等待重新同步。") : data ? uiText("当前暂无可核查任务。") : uiText("正在读取当前任务…")}
  </section>;
  const root = companyPrefix ? `/${encodeURIComponent(companyPrefix)}` : '';
  const href = `${root}/issues/${encodeURIComponent(task.identifier ?? task.id)}`;
  const actor = task.workflow.actorId;
  const owner = actor ? data?.agents.find(agent => agent.id === actor)?.name ?? uiText('其他参与者')
    : ['approved', 'completed'].includes(task.workflow.phase) ? uiText('本轮已结束')
    : task.workflow.phase === 'cancelled' ? uiText('任务已取消') : uiText('待确认');
  return <section className="ap-office-summary" aria-label={uiText("当前任务摘要")}>
    <dl className="ap-office-summary-grid">
      <div className="ap-office-summary-task">
        <dt>{uiText("当前任务")}</dt>
        <dd><a className="ap-office-task-ref" href={href} target="_blank" rel="noreferrer">{task.identifier ?? uiText("原始任务")} ↗</a><span className="ap-office-summary-title" title={task.title}>{task.title}</span></dd>
      </div>
      <div>
        <dt>{uiText("当前阶段")}</dt>
        <dd><strong className="ap-office-summary-phase">{uiText(task.workflow.label)}</strong><span className="ap-office-summary-detail">{uiText(activities[task.workflow.activity] ?? task.workflow.activity)}</span></dd>
      </div>
      <div><dt>{uiText("负责人")}</dt><dd>{owner}</dd></div>
      <div><dt>{uiText("最近审查决策")}</dt><dd>{decisionLabel(task.workflow.decision)}<span className="ap-office-summary-detail">{uiText("来自任务审查状态")}</span></dd></div>
    </dl>
    {error || stale ? <p className="ap-office-summary-warning">{error ? uiText("同步读取失败，当前显示为上次读取的任务状态。") : uiText("数据尚未更新，当前显示为上次读取的任务状态。")}</p> : null}
  </section>;
}

export function WorkflowPanel({ data, companyPrefix, error, stale }: {
  data: WorkflowSnapshot | null; companyPrefix: string | null; error: string | null; stale: boolean;
}) {
  useUiLocale();
  const task = data?.selected;
  const root = companyPrefix ? `/${encodeURIComponent(companyPrefix)}` : '';
  const taskHref = task ? `${root}/issues/${encodeURIComponent(task.identifier ?? task.id)}` : '#';
  const name = (id?: string | null) => data?.agents.find(a => a.id === id)?.name ?? (id ? uiText('其他参与者') : '—');

  return <aside className="ap-office-inspector" aria-label={uiText("真实任务流程")}>
    <header className="ap-office-panel-head">
      <h2>{uiText("流程核查")}</h2>
      {task ? <a className="ap-office-task-ref" href={taskHref} target="_blank" rel="noreferrer" aria-label={uiText("打开 {{value0}} 原始记录", { value0: String(task.identifier ?? '当前任务') })}>{task.identifier ?? uiText("原始任务")} ↗</a> : null}
    </header>
    {task ? <>
      <div className="ap-office-panel-body">
        <div className="ap-office-section-title">{uiText("流程阶段 ")}<span>{uiText("当前阶段高亮")}</span></div>
        <div className="ap-office-stages" aria-label={uiText("当前执行阶段")}>
          {phases.map(([key, label]) => <span key={key} className="ap-office-stage" aria-current={task.workflow.phase === key ? 'step' : undefined}>{uiText(label)}</span>)}
        </div>
        <div className="ap-office-section-title">{uiText("Agent ")}<span>{data?.agents.length ?? 0}{uiText(" 位成员")}</span></div>
        {data?.agents.map(agent => <div key={agent.id} className="ap-office-agent" title={uiText("宿主状态：{{value0}}", { value0: String(agent.status ?? '未知') })}>
          <span className="ap-office-avatar" aria-hidden="true">{Array.from(agent.name)[0]}</span>
          <span className="ap-office-agent-name">{agent.name}</span>
          <span className="ap-office-agent-state">{uiText(agent.workflowLabel ?? agentStatuses[agent.status ?? ''] ?? uiText("状态待确认"))}</span>
        </div>)}
      </div>
      <details className="ap-office-records">
        <summary>{uiText("真实运行与提交记录 · ")}{task.runs.length}{uiText(" 次运行")}</summary>
        <div className="ap-office-record-content">
          <div className="ap-office-record-context">
            <strong>{uiText("当前任务状态：")}{uiText(task.workflow.label)}</strong>
            <p className="ap-office-caption">{uiText("最近审查决策：")}{decisionLabel(task.workflow.decision)}{uiText("。依据为任务审查状态。")}</p>
          </div>
          <p className="ap-office-caption">{uiText("以下运行与提交保留历史过程，可能包含此前的退回意见。运行结束与审查批准分别记录，原文标题不代表当前结论。")}</p>
          <ol className="ap-office-runs">
            {task.runs.map(run => <li key={run.id} className="ap-office-run">
              <div className="ap-office-run-top">
                <a className="ap-office-record-link" href={`${root}/agents/${encodeURIComponent(run.agentId)}/runs/${encodeURIComponent(run.id)}`} target="_blank" rel="noreferrer">{name(run.agentId)} ↗</a>
                <span className="ap-office-caption">{uiText(runStatuses[run.status] ?? run.status)}</span>
              </div>
              <div className="ap-office-run-time">{time(run.startedAt)} → {time(run.finishedAt)}</div>
              {run.error ? <div className="ap-office-run-error">{run.error}</div> : null}
            </li>)}
          </ol>
          <div className="ap-office-section-title">{uiText("提交原文 ")}<span>{uiText("最近 ")}{task.comments.length}{uiText(" 条")}</span></div>
          {task.comments.map(comment => <details key={comment.id} className="ap-office-comment">
            <summary><span>{name(comment.authorAgentId)} · {time(comment.createdAt)}</span><span className="ap-office-comment-origin">{uiText("原文（含历史）")}</span></summary>
            <div className="ap-office-comment-body">{comment.body}</div>
          </details>)}
          <a className="ap-office-record-link ap-office-caption" href={taskHref} target="_blank" rel="noreferrer">{uiText("打开完整任务与审查记录 ↗")}</a>
        </div>
      </details>
    </> : <div className="ap-office-empty">{error ? uiText("暂时无法读取核查记录") : uiText("选择任务后在这里查看执行与审查情况。")}</div>}
    {error || stale ? <div className="ap-office-panel-body"><p className="ap-office-caption">{error ? uiText("读取失败：{{value0}}", { value0: String(error) }) : uiText("数据尚未更新，当前显示仅供参考。")}</p></div> : null}
  </aside>;
}
