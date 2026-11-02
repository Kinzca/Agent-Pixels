/** 仅作用于插件自己的元素；颜色、字号与原生 Paperclip 主题共用。 */
export const OFFICE_STYLES = `
.ap-office-nav{display:flex;align-items:center;gap:10px;margin:0 8px;padding:6px 8px;border-radius:8px;color:color-mix(in srgb,var(--foreground) 80%,transparent);font-family:inherit;font-size:var(--text-compact,13px);font-weight:500;line-height:20px;text-decoration:none;transition:background-color .15s,color .15s}
.ap-office-nav:hover,.ap-office-nav[aria-current="page"]{background:var(--sidebar-accent,var(--accent));color:var(--sidebar-accent-foreground,var(--foreground))}
.ap-office-nav svg{display:block;width:16px;height:16px;flex:0 0 16px}
.ap-office-nav:focus-visible,.ap-office :is(button,a,select,summary):focus-visible{outline:2px solid var(--ring,var(--foreground));outline-offset:3px}
.ap-office{container-type:inline-size;min-width:0;min-height:100%;padding:24px;color:var(--foreground);background:var(--background);font-family:inherit;font-size:var(--text-compact,13px);line-height:1.5}
.ap-office *{box-sizing:border-box}
.ap-office h1,.ap-office h2,.ap-office p{margin:0}
.ap-office-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;margin-bottom:22px}
.ap-office-title-row{display:flex;align-items:center;gap:10px}
.ap-office h1{font-size:22px;font-weight:600;letter-spacing:-.025em;line-height:1.3}
.ap-office-brand{padding:2px 7px;border:1px solid var(--border);border-radius:5px;font-size:11px;color:var(--muted-foreground);white-space:nowrap}
.ap-office-subtitle{margin-top:6px!important;color:var(--muted-foreground);font-size:13px}
.ap-office-sync{display:flex;align-items:center;justify-content:flex-end;gap:7px;flex-wrap:wrap;color:var(--muted-foreground);font-size:12px;font-variant-numeric:tabular-nums;text-align:right;min-width:125px;padding-top:4px}
.ap-office-dot{width:6px;height:6px;flex:0 0 6px;border-radius:50%;background:currentColor}
.ap-office-sync[data-tone="ok"] .ap-office-dot{color:var(--success,#2f9d72)}
.ap-office-sync[data-tone="warning"] .ap-office-dot{color:var(--warning,#c58b2b)}
.ap-office-sync time{display:block;width:100%;font-size:11px;color:var(--muted-foreground)}
.ap-office-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-bottom:18px}
.ap-office-task-picker{display:flex;align-items:center;gap:10px;min-width:0;flex:1}
.ap-office-field-label{color:var(--muted-foreground);white-space:nowrap;font-size:12px}
.ap-office-select{width:min(100%,440px);min-width:0;height:34px;padding:0 30px 0 10px;border:1px solid var(--border);border-radius:6px;color:var(--foreground);background:var(--background);font:inherit;cursor:pointer}
.ap-office-workspace{display:grid;grid-template-columns:minmax(0,1fr);gap:20px;align-items:start}
.ap-office-scene{min-width:0;overflow:hidden;border:1px solid var(--border);border-radius:10px;background:var(--card,var(--background))}
.ap-office-scene-head{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border-bottom:1px solid var(--border)}
.ap-office-scene-name{display:flex;align-items:center;gap:8px;font-weight:500;white-space:nowrap}
.ap-office-scene-name svg{width:16px;height:16px;color:var(--muted-foreground)}
.ap-office-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.ap-office-segments{display:flex;align-items:center;gap:2px;padding:3px;border-radius:7px;background:var(--muted)}
.ap-office button{font:inherit;cursor:pointer}
.ap-office-segments button{border:0;border-radius:4px;background:transparent;color:var(--muted-foreground);padding:4px 8px;white-space:nowrap;font-size:12px}
.ap-office-segments button[aria-pressed="true"]{background:var(--background);color:var(--foreground);box-shadow:0 1px 3px rgb(0 0 0/.08)}
.ap-office-quiet-button{border:1px solid var(--border);border-radius:6px;color:var(--foreground);background:transparent;padding:5px 9px;white-space:nowrap;font-size:12px!important}
.ap-office-quiet-button:hover{background:var(--accent,var(--muted))}
.ap-office-quiet-button[aria-pressed="true"]{background:var(--accent,var(--muted))}
.ap-office-camera{position:relative;height:clamp(380px,calc(100vh - 260px),700px);min-width:0;overflow:hidden;background:var(--muted)}
.ap-office-scene-foot{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid var(--border);font-size:11px;color:var(--muted-foreground)}
.ap-office-inspector{min-width:0;border:1px solid var(--border);border-radius:10px;background:var(--card,var(--background));overflow:hidden}
.ap-office-panel-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border)}
.ap-office-panel-head h2{font-size:13px;font-weight:600}
.ap-office-task-ref,.ap-office-record-link{color:var(--foreground);text-decoration:none}
.ap-office-task-ref:hover,.ap-office-record-link:hover{text-decoration:underline}
.ap-office-task-ref{font-size:12px;color:var(--muted-foreground);white-space:nowrap}
.ap-office-panel-body{padding:16px}
.ap-office-task-title{font-size:13px;font-weight:500;line-height:1.6;overflow-wrap:anywhere;margin-bottom:16px!important}
.ap-office-state-line{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}
.ap-office-state-label{font-size:20px;font-weight:600;letter-spacing:-.025em}
.ap-office-badge{display:inline-flex;align-items:center;gap:5px;border:1px solid var(--border);border-radius:5px;padding:2px 7px;color:var(--muted-foreground);font-size:11px;white-space:nowrap}
.ap-office-badge[data-tone="success"]{color:var(--success,#2f9d72);border-color:color-mix(in srgb,currentColor 24%,transparent);background:color-mix(in srgb,currentColor 6%,transparent)}
.ap-office-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin-bottom:18px}
.ap-office-stage{padding:6px 2px;border-radius:5px;background:var(--muted);color:var(--muted-foreground);text-align:center;font-size:11px}
.ap-office-stage[aria-current="step"]{background:var(--foreground);color:var(--background);font-weight:500}
.ap-office-facts{display:grid;gap:9px;margin:0}
.ap-office-facts div{display:flex;justify-content:space-between;align-items:baseline;gap:16px}
.ap-office-facts dt{color:var(--muted-foreground);font-size:12px}
.ap-office-facts dd{margin:0;font-size:12px;text-align:right;overflow-wrap:anywhere}
.ap-office-divider{border:0;border-top:1px solid var(--border);margin:16px 0}
.ap-office-section-title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:12px;font-weight:500}
.ap-office-section-title span{font-size:11px;font-weight:400;color:var(--muted-foreground)}
.ap-office-agent{display:flex;align-items:center;gap:10px;padding:9px 0}
.ap-office-agent+.ap-office-agent{border-top:1px solid var(--border)}
.ap-office-avatar{display:grid;place-items:center;flex:0 0 28px;width:28px;height:28px;border:1px solid var(--border);border-radius:7px;background:var(--muted);font-size:11px;color:var(--muted-foreground)}
.ap-office-agent-name{font-size:12px;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
.ap-office-agent-state{font-size:11px;color:var(--muted-foreground);text-align:right;max-width:45%}
.ap-office-records{border-top:1px solid var(--border)}
.ap-office-records>summary{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:13px 16px;cursor:pointer;font-size:12px;font-weight:500;list-style:none}
.ap-office-records>summary::-webkit-details-marker{display:none}
.ap-office-records>summary::after{content:'+';color:var(--muted-foreground);font-size:16px;font-weight:400}
.ap-office-records[open]>summary::after{content:'−'}
.ap-office-record-content{padding:0 16px 16px}
.ap-office-caption{font-size:11px;color:var(--muted-foreground);line-height:1.7}
.ap-office-runs{list-style:none;margin:10px 0 16px;padding:0}
.ap-office-run{padding:10px 0;border-bottom:1px solid var(--border)}
.ap-office-run-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:12px}
.ap-office-run-time{margin-top:3px;color:var(--muted-foreground);font-size:11px;font-variant-numeric:tabular-nums}
.ap-office-run-error{margin-top:4px;color:var(--muted-foreground);font-size:11px;overflow-wrap:anywhere}
.ap-office-comment{padding:10px 0;border-top:1px solid var(--border)}
.ap-office-comment summary{cursor:pointer;font-size:12px}
.ap-office-comment-title{display:block;margin-top:4px;color:var(--muted-foreground);font-size:11px;overflow-wrap:anywhere}
.ap-office-comment-body{margin-top:10px;white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px;line-height:1.8}
.ap-office-empty{padding:24px 16px;color:var(--muted-foreground);font-size:12px}
.ap-office-notice{margin-bottom:16px;padding:10px 12px;border:1px solid var(--border);border-radius:6px;color:var(--muted-foreground);background:var(--muted);font-size:12px}
.ap-office-character-grid{display:grid;grid-template-columns:180px minmax(0,1fr);gap:16px;align-items:start}
@container (min-width:960px){.ap-office-workspace{grid-template-columns:minmax(0,1fr) 320px}.ap-office-inspector{position:sticky;top:16px;max-height:calc(100vh - 110px);overflow:auto;scrollbar-width:thin}}
@container (max-width:560px){.ap-office-heading{gap:12px}.ap-office-brand{display:none}.ap-office h1{font-size:20px}.ap-office-task-picker{align-items:flex-start;flex-direction:column;gap:6px}.ap-office-select{width:100%}.ap-office-character-grid{grid-template-columns:1fr}.ap-office-camera{height:430px}.ap-office-scene-head{align-items:flex-start}.ap-office-controls{gap:6px}}
`;
