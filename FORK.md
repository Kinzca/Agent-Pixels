# Agent Pixels 流程核查版

基于 [gcampton/Agent-Pixels](https://github.com/gcampton/Agent-Pixels)。保留原作者、素材和像素办公室；本 fork 增加 Paperclip 任务流程核查。插件标识沿用兼容副本的 `agent-pixels.compat`，页面路由为 `/<公司前缀>/agent-pixels-compat`，可与 `agent-pixels.camera` 原版并存。

## 当前行为

- 页面可见时每 2.5 秒读取一次状态；请求未结束时不启动下一次读取。隐藏页面暂停轮询，恢复可见时立即检查。通过宿主 SDK 保留公司上下文、权限与过期响应隔离。
- 自动跟随最近有更新的进行中任务，也可以选择最近 20 个任务中的指定任务。
- 使用任务详情的 `executionState`、当前参与者和关联运行，区分执行、审查、返修和复审。角色名称不参与判断。
- “待审查 / 等待启动”与“审查中”分别展示。仅有成功运行不足以宣告审查通过；任务完成且最终审查决策为批准时才显示“审查通过”。
- 像素人物和文字卡片随状态刷新；审查人物使用阅读动画，执行与返修使用工作动画。动画只表达阶段活动，不声称读取到了具体编辑器或工具调用。
- 展示最后读取时间；超过 12 秒未获得新快照会提示数据过期。错误提示与陈旧数据不能作为实时执行证据。
- 展开“真实运行与提交记录”可查看运行时间、原始状态、最近 12 条真实评论和审查报告，并进入 Paperclip 原始任务、运行记录。停止的运行不自动判成任务失败。

## 保留并泛化的兼容修复

1. worker 使用当前宿主 SDK 打包，保留 invocation scope 的正式传递机制，不关闭宿主权限检查。
2. UI 在 blob 模块环境下读取原生 UI 注册表，使用安装 UUID 构造素材地址；不硬编码某台机器的 UUID。

新增的读取权限为 `issues.read`、`issues.orchestration.read`、`issue.comments.read`。本插件没有创建任务、批准审查、唤醒 Agent 或修改 Agent 的权限。自动交接由 Paperclip 的执行策略与调度器负责；插件只读展示，不能修复宿主调度故障。

## 构建

使用 Node.js 24 和项目现有的 pnpm 依赖锁，或 npm 安装开发依赖。准备与运行实例匹配的 Paperclip SDK：

```sh
pnpm install --frozen-lockfile
export PAPERCLIP_SDK_DIST=/path/to/paperclip/node_modules/@paperclipai/plugin-sdk/dist
pnpm typecheck
pnpm test
pnpm build
```

环境变量也可指向 Paperclip 源码构建出的 `packages/plugins/sdk/dist`。构建脚本与类型检查共用同一个 SDK 解析器；没有宿主 SDK 时会明确失败。开发测试需 Node.js 24；worker 构建目标保留 node20。无需在公开源码中填 API Key 或本机路径。

在 Paperclip 原生插件管理页面安装此仓库目录（须先构建）；保留 `package.json` 和 `dist/`。新增只读权限须通过宿主的正常管理操作登记。部分宿主版本的 upgrade 会直接拒绝权限增加且不提供审批入口；本地已安装兼容副本可先备份，再使用保留数据的卸载与重新安装，不要 purge。是否保留安装标识由宿主版本决定，操作后应核查。

## 状态与范围

`test/workflow.test.mjs` 覆盖真实负责人运行、交接等待、初审、返修、复审、最终批准、未知状态、审批、排队及取消等边界。类型检查、构建与实际宿主验收是不同层次，不应互相替代。

当前版本只突出任务当前阶段，不根据运行次数编造历史阶段。历史过程通过真实评论、审查报告和运行记录核查；需要逐次决策时间轴时，应扩展宿主正式只读决策接口。最近任务/评论有数量上限，不提供全公司无限历史查询。多人并行阶段、复杂审批链及远程部署尚需单独验收。
