/** 从 Paperclip 的完整任务状态与关联运行派生；不使用角色名称猜测。 */
export type Run = { id: string; agentId: string; status: string; createdAt: string; startedAt?: string | null; finishedAt?: string | null; error?: string | null };
export type WorkflowIssue = {
  id: string; identifier: string | null; title: string; status: string; updatedAt: string;
  assigneeAgentId?: string | null; executionRunId?: string | null;
  executionState?: { status: string; currentStageType?: string | null; currentParticipant?: { agentId?: string | null } | null;
    returnAssignee?: { agentId?: string | null } | null; lastDecisionOutcome?: string | null; lastDecisionId?: string | null; changesRequestedCount?: number } | null;
};
export const phaseNames = { execution: '执行', review: '审查', rework: '返修', rereview: '复审', approved: '审查通过', completed: '已完成', blocked: '已阻塞', cancelled: '已取消', approval: '审批', unknown: '阶段未知' } as const;
export function deriveWorkflow(issue: WorkflowIssue, runs: Run[]) {
  const s = issue.executionState;
  let phase: keyof typeof phaseNames = 'unknown';
  if (issue.status === 'cancelled') phase = 'cancelled';
  else if (issue.status === 'blocked') phase = 'blocked';
  else if (issue.status === 'done') phase = s?.status === 'completed' && s.lastDecisionOutcome === 'approved' ? 'approved' : 'completed';
  else if (s?.status === 'changes_requested') phase = 'rework';
  else if (s?.status === 'pending' && s.currentStageType === 'review') phase = (s.changesRequestedCount ?? 0) > 0 || s.lastDecisionOutcome === 'changes_requested' ? 'rereview' : 'review';
  else if (s?.status === 'pending' && s.currentStageType === 'approval') phase = 'approval';
  else if (!s && ['todo', 'in_progress', 'backlog'].includes(issue.status)) phase = 'execution';
  const terminal = ['approved', 'completed', 'cancelled', 'blocked'].includes(phase);
  const actorId = terminal ? null : (phase === 'review' || phase === 'rereview' || phase === 'approval') ? s?.currentParticipant?.agentId ?? null : phase === 'rework' ? s?.returnAssignee?.agentId ?? issue.assigneeAgentId ?? null : phase === 'execution' ? issue.assigneeAgentId ?? null : null;
  const activeRun = actorId ? runs.find(r => r.agentId === actorId && r.status === 'running') ?? null : null;
  const queuedRun = actorId ? runs.find(r => r.agentId === actorId && r.status === 'queued') ?? null : null;
  const currentRun = runs.find(r => r.id === issue.executionRunId && r.agentId === actorId);
  const failed = currentRun && ['failed', 'timed_out'].includes(currentRun.status);
  const activity = terminal ? 'finished' : activeRun ? 'running' : queuedRun ? 'queued' : failed ? 'failed' : actorId ? 'waiting' : 'unknown';
  const label = activeRun ? `${phaseNames[phase]}中` : ['execution', 'review', 'rework', 'rereview', 'approval'].includes(phase) ? `待${phaseNames[phase]}` : phaseNames[phase];
  return { phase, label, actorId, activity, activeRunId: activeRun?.id ?? null, decision: s?.lastDecisionOutcome ?? null, decisionId: s?.lastDecisionId ?? null };
}
