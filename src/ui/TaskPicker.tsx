import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import type { WorkflowSnapshot } from './WorkflowPanel.js';

type Task = WorkflowSnapshot['tasks'][number];
const statusNames: Record<string, string> = {
  backlog: '待安排', todo: '待执行', in_progress: '进行中', in_review: '审查阶段',
  blocked: '已阻塞', done: '已完成', cancelled: '已取消',
};
function PickerIcon({ kind }: { kind: 'search' | 'follow' | 'task' | 'check' | 'chevron' }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'search' ? <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></> : null}
    {kind === 'follow' ? <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></> : null}
    {kind === 'task' ? <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></> : null}
    {kind === 'check' ? <path d="m5 12 4 4L19 6" /> : null}
    {kind === 'chevron' ? <path d="m8 10 4 4 4-4" /> : null}
  </svg>;
}

export function WorkflowTaskPicker({ data, issueId, onSelect }: {
  data: WorkflowSnapshot | null; issueId: string; onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeKey, setActiveKey] = useState(issueId);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const uid = useId();
  const panelId = `${uid}-panel`;
  const listId = `${uid}-list`;
  const tasks = data?.tasks ?? [];
  const selected = tasks.find(task => task.id === issueId) ?? (data?.selected?.id === issueId ? data.selected : null);
  const matches = (task: Task, text: string) => `${task.identifier ?? ''} ${task.title}`.toLocaleLowerCase().includes(text.trim().toLocaleLowerCase());
  const visible = tasks.filter(task => matches(task, query));
  // 自动跟随始终固定在首项；仅提交选择后才切换核查任务。
  const keys = ['', ...visible.map(task => task.id)];
  const activeIndex = Math.max(0, keys.indexOf(activeKey));
  const activeOptionId = `${uid}-option-${activeIndex}`;

  function show() {
    setQuery('');
    setActiveKey(issueId);
    setOpen(true);
  }
  function choose(id: string) {
    setOpen(false);
    onSelect(id);
    triggerRef.current?.focus();
  }
  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault(); event.stopPropagation();
      setOpen(false); triggerRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveKey(keys[(activeIndex + direction + keys.length) % keys.length]);
    } else if (event.key === 'Enter') {
      event.preventDefault(); choose(keys[activeIndex]);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const item = document.getElementById(activeOptionId);
    const list = listRef.current;
    if (!item || !list) return;
    const itemRect = item.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (itemRect.top < listRect.top) list.scrollTop -= listRect.top - itemRect.top;
    else if (itemRect.bottom > listRect.bottom) list.scrollTop += itemRect.bottom - listRect.bottom;
  }, [open, activeOptionId, query]);

  const optionProps = (id: string, index: number) => ({
    id: `${uid}-option-${index}`,
    role: 'option' as const,
    'aria-selected': issueId === id,
    'data-active': activeIndex === index,
    tabIndex: -1,
    onMouseEnter: () => setActiveKey(id),
    onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
    onClick: () => choose(id),
  });

  return <div className="ap-office-task-picker">
    <span className="ap-office-field-label" id={`${uid}-label`}>核查任务</span>
    <div className="ap-office-picker" ref={wrapperRef}>
      <button ref={triggerRef} type="button" className="ap-office-picker-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? panelId : undefined} aria-labelledby={`${uid}-label ${uid}-value`}
        onClick={() => open ? setOpen(false) : show()}
        onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); show(); } }}>
        <span className="ap-office-picker-symbol"><PickerIcon kind={issueId ? 'task' : 'follow'} /></span>
        <span className="ap-office-picker-value" id={`${uid}-value`}>
          {issueId ? <><span className="ap-office-picker-id">{selected?.identifier ?? '指定任务'}</span><span className="ap-office-picker-current-title">{selected?.title ?? '正在读取任务…'}</span></> : <><span>自动跟随</span><span className="ap-office-picker-trigger-hint">进行中的任务优先</span></>}
        </span>
        <span className="ap-office-picker-chevron"><PickerIcon kind="chevron" /></span>
      </button>
      {open ? <div id={panelId} className="ap-office-picker-panel" role="dialog" aria-label="选择核查任务" onKeyDown={handleKey}>
        <div className="ap-office-picker-search">
          <PickerIcon kind="search" />
          <input ref={searchRef} value={query} onChange={event => {
            const text = event.target.value;
            setQuery(text); setActiveKey(text.trim() ? tasks.find(task => matches(task, text))?.id ?? '' : issueId);
          }} placeholder="搜索任务编号或标题…" aria-label="搜索任务" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls={listId} aria-activedescendant={activeOptionId} autoComplete="off" />
          <kbd>Esc</kbd>
        </div>
        <div className="ap-office-picker-list" id={listId} role="listbox" aria-label="任务选项" ref={listRef}>
          <button type="button" className="ap-office-picker-option ap-office-picker-follow" {...optionProps('', 0)}>
            <span className="ap-office-picker-symbol"><PickerIcon kind="follow" /></span>
            <span className="ap-office-picker-copy"><span className="ap-office-picker-option-title">自动跟随</span><span className="ap-office-picker-description">优先显示进行中的任务，空闲时显示最近任务</span></span>
            <span className="ap-office-picker-check">{!issueId ? <PickerIcon kind="check" /> : null}</span>
          </button>
          <div className="ap-office-picker-section" role="presentation">最近任务<span>{visible.length}</span></div>
          {visible.map((task, index) => <button type="button" key={task.id} className="ap-office-picker-option" {...optionProps(task.id, index + 1)}>
            <span className="ap-office-picker-copy">
              <span className="ap-office-picker-task-meta"><span className="ap-office-picker-id">{task.identifier ?? '任务'}</span><span className="ap-office-picker-task-status" data-status={task.status}>{statusNames[task.status] ?? task.status}</span></span>
              <span className="ap-office-picker-task-title" title={task.title}>{task.title}</span>
            </span>
            <span className="ap-office-picker-check">{issueId === task.id ? <PickerIcon kind="check" /> : null}</span>
          </button>)}
          {!visible.length ? <div className="ap-office-picker-empty">{query.trim() ? '没有找到匹配的任务' : '暂时没有可选择的任务'}</div> : null}
        </div>
        <div className="ap-office-picker-footer"><span>↑ ↓ 移动 · Enter 选择</span><span>选中后固定核查该任务</span></div>
      </div> : null}
    </div>
  </div>;
}
