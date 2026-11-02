import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import React, { act } from 'react';
import { create } from 'react-test-renderer';

// 使用真实 React 执行组件 effect；替换美术素材和动画时钟，精确记录清屏与循环重启。
const cache = path.resolve('node_modules/.cache/agent-pixels');
await mkdir(cache, { recursive: true });
const dir = await mkdtemp(path.join(cache, 'canvas-test-'));
const mocks = {
  '../office/types.js': 'export const TILE_SIZE = 16;',
  '../office/engine/officeState.js': `export class OfficeState {
    constructor() { this.characters = new Map(); this.seats = new Map(); globalThis.__pixelProbe.office = this; }
    addAgent(id, palette) { if (!this.characters.has(id)) this.characters.set(id, {id,palette,x:10,y:20}); }
    setAgentActive(id, active) { this.characters.get(id).isActive = active; }
    setAgentTool(id, tool) { this.characters.get(id).currentTool = tool; }
    removeAgent(id) { this.characters.delete(id); }
    getLayout() { return {cols:40,rows:30}; }
    update() {}
  }`,
  '../office/engine/gameLoop.js': `export function startGameLoop(canvas, callbacks) {
    const p = globalThis.__pixelProbe; p.starts++; p.callbacks = callbacks;
    return () => { p.stops++; };
  }`,
  '../office/engine/renderer.js': `export function renderFrame(...args) {
    globalThis.__pixelProbe.pan = args.slice(7,9); return {offsetX:0,offsetY:0};
  }`,
  './pixelAssets.js': `export async function loadPixelAssets() {
    return {layouts:{combined:{}},cameraBounds:{office:{cols:20,rows:15,col:0,row:0},boardroomKitchen:{cols:20,rows:15,col:20,row:15},overflowOffice:{cols:20,rows:15,col:40,row:30}}};
  }`,
};
await build({ entryPoints: ['src/ui/PixelOfficeCanvas.tsx'], outfile: path.join(dir, 'component.mjs'), bundle:true, platform:'node', format:'esm', jsx:'automatic', external:['react','react/jsx-runtime'], plugins:[{
  name:'canvas-fixtures', setup(b) {
    b.onResolve({filter:/.*/}, a => a.path in mocks ? {path:a.path,namespace:'fixture'} : undefined);
    b.onLoad({filter:/.*/,namespace:'fixture'}, a => ({contents:mocks[a.path],loader:'js'}));
  },
}] });
const { PixelOfficeCanvas } = await import(pathToFileURL(path.join(dir, 'component.mjs')).href);
const agent = {id:'executor',name:'执行者',status:'idle',activityKind:'idle',workflowLabel:'空闲',characterIndex:3};
async function fixture(run) {
  const previous = { window:globalThis.window, ResizeObserver:globalThis.ResizeObserver, act:globalThis.IS_REACT_ACT_ENVIRONMENT };
  const p = globalThis.__pixelProbe = {starts:0,stops:0,clears:0,disconnects:0,labels:[]};
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  globalThis.window = {devicePixelRatio:1};
  globalThis.ResizeObserver = class {
    constructor(callback) { p.resize=callback; }
    observe() { p.resize(); }
    disconnect() { p.disconnects++; }
  };
  let width=300, height=150;
  const canvas = {style:{}};
  Object.defineProperties(canvas,{width:{get:()=>width,set:v=>{width=v;p.clears++;}},height:{get:()=>height,set:v=>{height=v;p.clears++;}}});
  const rect = {width:640,height:400};
  const wrap = {getBoundingClientRect:()=>rect};
  const ctx = {save(){},restore(){},strokeText(){},fillText(text){p.labels.push(text);}};
  let renderer;
  const update = async props => { await act(async()=>renderer.update(React.createElement(PixelOfficeCanvas,props))); };
  try {
    await act(async()=>{renderer=create(React.createElement(PixelOfficeCanvas,{camera:'office',agents:[{...agent}]}),{createNodeMock:element=>element.type==='canvas'?canvas:wrap});});
    await run({p,canvas,rect,ctx,update});
  } finally {
    if (renderer) await act(async()=>renderer.unmount());
    globalThis.window=previous.window;globalThis.ResizeObserver=previous.ResizeObserver;globalThis.IS_REACT_ACT_ENVIRONMENT=previous.act;
    delete globalThis.__pixelProbe;
  }
}
try {
  test('连续 20 次新快照不重启动画、不清空画布',()=>fixture(async({p,update})=>{
    const clears=p.clears;
    for(let n=0;n<20;n++) await update({camera:'office',agents:[{...agent}]});
    assert.equal(p.starts,1);assert.equal(p.stops,0);assert.equal(p.clears,clears);
  }));
  test('阶段和人物变化即时生效，同时保留原人物位置',()=>fixture(async({p,update,ctx})=>{
    const character=[...p.office.characters.values()][0]; character.x=123;
    await update({camera:'office',agents:[{...agent,status:'running',activityKind:'research',workflowLabel:'复审中',characterIndex:5}]});
    p.callbacks.render(ctx);
    assert.ok(p.labels.some(text=>text.includes('复审中')));assert.equal(character.x,123);assert.equal(character.palette,5);assert.equal(character.currentTool,'Read');assert.equal(p.starts,1);
    await update({camera:'office',agents:[]});assert.equal(p.office.characters.size,0);
  }));
  test('切换摄像机更新视角，不重启动画或清屏',()=>fixture(async({p,update,ctx})=>{
    p.callbacks.render(ctx);const old=[...p.pan];const clears=p.clears;
    await update({camera:'boardroomKitchen',agents:[{...agent}]});p.callbacks.render(ctx);
    assert.notDeepEqual(p.pan,old);assert.equal(p.starts,1);assert.equal(p.clears,clears);
  }));
  test('相同尺寸通知不清屏，真实尺寸变化才调整画布',()=>fixture(async({p,rect,canvas})=>{
    const clears=p.clears;for(let n=0;n<10;n++)p.resize();assert.equal(p.clears,clears);
    rect.width=800;p.resize();assert.equal(canvas.width,800);assert.equal(p.clears,clears+1);
  }));
} finally {
  // node:test 在当前模块求值后执行注册的测试；通过 after 清理构建缓存。
  const { after } = await import('node:test');
  after(()=>rm(dir,{recursive:true,force:true}));
}
