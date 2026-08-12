# 结语：五个架构赌注

> 原文：[Ch 18. Epilogue — What We Learned](https://claude-code-from-source.com/ch18-epilogue/)

Claude Code 并不是唯一的 Agentic System，也不是第一个。

但它做出了五个非常鲜明的架构选择，让自己与大量 Agent Framework 区分开来。

在研究了接近两千个文件、走完十七章之后，这五个赌注值得单独拿出来重新审视。

---

## 赌注一：用 Generator Loop，而不是 Callback

大多数 Agent Framework 给开发者的，是一条 Pipeline：

```text
定义工具
→ 注册 Handler
→ 交给 Framework 编排
```

开发者负责写 Callback。

什么时候调用这些 Callback，则由 Framework 决定。

Claude Code 反过来做。

核心：

```text
query()
```

是一个 Async Generator。

开发者自己掌握 Loop。

基本流程是：

```text
模型开始 Streaming Response
    ↓
Generator 产出 Tool Call
    ↓
Caller 执行 Tool
    ↓
把 Tool Result 追加回 Conversation
    ↓
Generator 继续下一轮
```

整个系统几乎所有交互都穿过同一个 Function。

一条 Data Flow。

一个控制中心。

Generator 的 Return Type 通过：

```text
10 种 Terminal State
+
7 种 Continuation State
```

编码了所有可能的退出与继续方式。

可以说：

> **这个 Loop 本身就是系统。**

---

## 为什么敢让一个函数长到 1,700 行

这里的架构赌注是：

> 一个虽然很长、但控制流完整可见的 Generator Function，比一个分散在几十个文件里的 Callback Graph 更容易理解。

从源码结构来看，这个赌注成功了。

当你想知道：

> 为什么 Session 结束？

你只需要看：

```text
query()
```

当你想增加一种新的 Terminal State：

1. 给 Discriminated Union 增加一个 Variant；
2. Type System 会强迫所有相关代码做 Exhaustive Handling。

如果使用 Callback Architecture：

- Logic 会分散在几十个 File；
- Callback 之间的顺序关系可能是隐式的；
- Debug 时必须重新拼出控制流。

而 Generator 让控制流本身就是代码结构。

---

# 赌注二：File-based Memory，而不是 Database

第 11 章已经详细讨论过 Memory。

但这个选择的架构意义，比 Memory System 本身更大。

Claude Code 没有使用：

- SQLite；
- Vector Database；
- Cloud Memory Service。

而是使用：

> 普通 Markdown 文件。

这是一次：

> **Transparency over Capability**

的下注。

---

## Database 能提供什么

数据库当然能提供更强能力：

- 更复杂 Query；
- 更快 Lookup；
- Transaction；
- Index；
- Structured Schema。

普通文件几乎没有这些优势。

但 File 提供了一件更加重要的东西：

> **Trust。**

---

## “我到底记住了什么”应该是可观察的

用户可以直接打开：

```text
~/.claude/projects/myapp/memory/MEMORY.md
```

在 Vim 里看到：

> Agent 到底记住了自己什么。

这种关系，与用户只能问：

```text
你记住了什么？
```

然后相信模型回答完整，是完全不同的。

File-based Design 让 Agent Knowledge State 成为：

> **Externally Observable State。**

不是 Agent 自己描述自己的 Memory。

而是人类可以直接检查实际存储内容。

这可能比 Query Performance 更重要。

---

## Retrieval Intelligence 弥补 Storage Simplicity

底层 Storage 很简单。

召回则由 LLM 负责。

Sonnet Side Query 会从 Memory Manifest 中选择最多 5 个当前相关 Memory。

这可以比单纯 Embedding Similarity 更精准。

而且不需要：

- Embedding Pipeline；
- Vector Store；
- Index Infrastructure。

也就是：

> 简单存储 + 智能召回。

---

# 赌注三：Self-describing Tool，而不是 Central Orchestrator

很多 智能体 Framework 使用中央 Tool Registry。

开发者在某个统一 Config 中描述：

- Tool Name；
- Schema；
- Description；
- Handler。

然后 Framework 再把它们展示给模型。

Claude Code 中，每一个 Tool 自己描述自己。

一个 `Tool` Object 会携带：

- Name；
- Description；
- Input Schema；
- Prompt Contribution；
- Concurrency Safety Flag；
- Execution Logic。

Tool System 的职责不是：

> 替 Tool 描述 Tool。

而是：

> **允许 Tool 自己描述自己。**

---

## 为什么这让 Extensibility 更自然

MCP Tool 是最典型的例子。

第 15 章中，MCP Tool 最终会被包装成标准：

```text
Tool
```

Object。

从那一刻开始，模型根本不需要知道：

> 这是 Built-in Tool，还是 MCP Tool。

后续统一进入同一套 Pipeline：

```text
Permission Check
→ Concurrent Execution
→ Result Budgeting
→ Hook Interception
```

不需要再维护两套行为系统。

---

# 赌注四：使用 Fork Agent 共享 Prompt Cache

第 9 章讲过 Fork Agent。

它会继承父智能体的完整 Conversation Context，并最大限度共享父请求的 Prompt Cache。

这不是一个小优化。

它是一项真正的架构赌注：

> Prompt Cache 带来的经济收益，值得为此承担 Fork Lifecycle 的复杂性。

---

## Alternative：Fresh Agent + Conversation Summary

更简单的方式是：

```text
创建新 Agent
+
给它一份 Conversation Summary
```

实现明显更容易。

但每个 Fresh Agent 都需要重新处理自己的 Context。

输入成本全部重新支付。

Fork Agent 则能够共享 Parent Cached Prefix。

如果 Cached Input Token 可以获得约：

```text
90% discount
```

那么很多原本“不值得 Spawn Agent”的小任务，开始变得经济可行。

例如：

- Memory Extraction；
- Code Review；
- Verification Pass；
- Background Analysis。

---

## Background Memory Extraction 为什么能频繁运行

第 11 章的 Background Memory Extraction Agent 几乎可以在每次 Query Loop 之后运行。

它之所以不会变得极度昂贵，就是因为：

> 它能够共享 Parent Prompt Cache。

如果每次都启动一个完全 Fresh Agent，这个 Safety Net 的 API Cost 很可能高到无法接受。

---

# 赌注五：Hooks，而不是 Plugins

大多数 Extensibility System 使用 Plugin。

Plugin 通常：

- 注册能力；
- 在 Host Process 中运行；
- 直接调用 Host API。

Claude Code 更强调：

> Hooks。

Hook 是在 Lifecycle Point 运行的外部 Process，通过：

```text
stdin
stdout
exit code
```

与 Host 通信。

---

## 这次赌注的核心是 Process Isolation

Plugin Crash 可能拖垮 Host。

Hook Crash 只会杀掉自己的 Process。

Plugin Memory Leak 会进入 Host Heap。

Hook Process 结束后，Memory 自然释放。

Plugin 需要一套必须长期维护 Version Compatibility 的 API Surface。

Hook 只需要：

```text
stdin
stdout
exit code
```

这种协议从 1971 年以来就非常稳定。

---

## 代价是真实存在的

Spawn Process 每次都要花几毫秒。

明显比 In-process Callback 更贵。

第 12 章专门为 Internal Callback 做了：

```text
约 -70% overhead
```

Fast Path。

这说明系统自己也非常清楚 Process Boundary 的成本。

但对于外部 Hook：

- User Script；
- Team Linter；
- Enterprise Policy Server；

Isolation 的收益通常值得。

一个 Enterprise 可以部署 Hook-based Policy Enforcement，而不用担心一段错误脚本把整个 Claude Code Session Crash 掉。

---

# 什么可以迁移，什么不应该照搬

Claude Code 中不是所有模式都适合所有 Agent。

有些设计来自它自己的：

- 用户规模；
- 性能目标；
- Terminal 产品形态；
- 部署复杂度。

因此应该区分：

> 通用架构经验

和：

> Claude Code 规模下才值得的工程投资。

---

# 适用于几乎所有 Agent 的模式

## Generator Loop

任何需要：

- Streaming Response；
- Tool Call；
- 多种停止原因；
- Recovery；

的 Agent，都可以受益于：

> Explicit Loop，而不是隐藏 Callback。

尤其是 Discriminated Union Return Type。

它把：

> “Agent 为什么停了？”

从模糊 Runtime Behavior 变成 Typed State。

---

## File-based Memory + LLM Recall

实现细节可以变化，但原则很通用：

> Simple Storage + Intelligent Retrieval。

第 11 章中的四类 Memory：

```text
user
feedback
project
reference
```

以及那个最重要的判断：

> 这条知识能否从项目当前状态重新推导？

都是可以直接复用的 Memory Design Heuristic。

---

## Remote Execution 中分离 Read / Write

如果：

```text
Read = 高频 Streaming
Write = 低频 RPC
```

分开 Transport 通常是正确选择。

这与具体使用：

- SSE；
- WebSocket；
- HTTP；

无关。

---

## Search 中的 Bitmap Pre-filter

对大型 File Index，26-bit Letter Bitmap 非常划算。

成本：

```text
4 bytes / entry
```

查询时只需要一次 Integer Comparison，就能提前排除大量不可能 Match 的 Candidate。

Cost / Benefit Ratio 极高。

---

## Prompt Cache Stability 应该是架构问题

如果使用的 LLM API 支持 Prompt Cache，那么：

```text
Stable Content First
Volatile Content Last
```

不能只被视为一个 Performance Trick。

它会直接决定：

> 整个产品的 Token Cost Structure。

因此应该在 Architecture 阶段设计，而不是上线后再修。

---

# 更偏 Claude Code 规模的模式

## Forked Terminal Renderer

Claude Code Fork Ink，并重新实现：

- Packed Typed Array；
- Pool-based Interning；
- Cell-level Diff。

原因是：

> 它真的需要在 Terminal 中 60fps Streaming。

多数 Agent 的 UI 是：

- Browser；
- Simple Log；
- IDE Surface。

没有同样的 Terminal Rendering Requirement。

这项工程投资只有在 Terminal 是 Primary UI 时才值得。

---

## 50+ Startup Profiling Checkpoint

对于拥有大量用户的产品：

```text
0.5% sampling
```

都能产生显著数据。

小型 Agent 项目不需要复制同样规模的 Profiling Infrastructure。

简单 Timing 往往够用。

---

## 八种 MCP Transport

Claude Code 需要支持：

- stdio；
- SSE；
- HTTP；
- WebSocket；
- SDK；
- 两种 IDE Transport；
- Claude.ai Proxy。

这是因为它必须覆盖几乎所有 Deployment Topology。

多数 Agent 可能只需要：

```text
stdio
+
HTTP
```

就够。

---

## Hook Snapshot Security Model

在 Startup 时 Freeze Hook Config，并拒绝隐式重新读取，是针对一个非常具体的 Threat Model：

> Agent 进入任意不可信 Repository，而 Repository 可能在用户接受 Trust 之后修改 `.claude/` Config。

如果 Agent 永远只运行在完全可信环境，Hook Management 可以简单很多。

---

# 复杂度的代价

接近两千个文件。

它到底买来了什么？

又付出了什么？

单纯 File Count 并不是很好的 Complexity Metric。

因为大量文件其实属于：

- Test Infrastructure；
- Type Definition；
- Config Schema；
- Forked Ink Renderer。

真正高密度 Behavioral Complexity 集中在少数文件：

```text
query.ts   ~1,700 lines
hooks.ts   ~4,900 lines
REPL.tsx   ~5,000 lines
Memory Prompt Builder
```

---

# 三种复杂度来源

## 1. Protocol Diversity

Claude Code 同时支持：

- 5 类 Terminal Keyboard Protocol；
- 8 种 MCP Transport；
- 4 种 Remote Execution Topology；
- 7 类 Configuration Scope。

这种复杂度有很强的环境属性。

每增加一个 Protocol，Codebase 大致线性增加。

不是指数爆炸。

但累积起来仍然非常可观。

按照 Brooks 的说法，这更接近：

> Accidental Complexity。

因为它来自环境碎片化，而不是 Agent 问题本身。

---

## 2. Performance Optimization

例如：

- Pool-based Rendering；
- Bitmap Search Pre-filter；
- Sticky Cache Latch；
- Speculative Tool Execution。

这些都增加了 Code Complexity。

换来的则是：

> 可测量的 Performance Gain。

这些复杂度之所以能够被接受，是因为：

> 每次优化之前都有 Profiling Data 证明瓶颈真实存在。

真正的风险是：

> 优化不断叠加后，Hot Path 会越来越难修改。

性能工程永远有这个债务。

---

## 3. Behavioral Tuning

还有一类复杂度并不主要存在于 Code 中。

而存在于 Prompt。

例如：

- Memory Write Instruction；
- Staleness Warning；
- Verification Protocol；
- “Ignore Memory” Anti-pattern Instruction。

这种复杂度属于：

> Prompt Complexity。

它的维护方式与代码完全不同。

当 Model Version 改变时，以前通过 Eval 微调出来的 Prompt Phrase 可能需要重新调整。

---

## Eval Infrastructure 是防线

源码中经常出现：

- Eval Case Number；
- Before / After Score；
- Regression Note。

这套 Eval Infrastructure 是 Behavioral Regression 的主要防线。

但它本身也意味着持续投入。

---

# 新工程师真正需要理解的，不只是代码

维护这种系统时，新 Engineer 不只要理解：

```text
代码怎么走。
```

还要理解：

- 为什么某句 Prompt 要写成这个措辞；
- 哪次 Production Incident 导致某个 Security Check；
- 哪份 Performance Profile 导致某个奇怪 Fast Path；
- 哪个 Eval Case 证明某个 Behavior 是必要的。

代码注释可能非常完整。

但：

> 接近两千个文件里的“完整注释”，本身也是阅读成本。

---

# Agentic System 正在走向哪里

从 Claude Code 的设计中，可以看出至少四个趋势。

---

# 趋势一：MCP 成为通用协议

第 15 章把 Claude Code 描述成非常完整的 MCP Client。

但真正重要的不是：

> Claude Code 自己实现得多完整。

而是：

> **MCP 这类标准协议已经存在。**

标准化 Tool Discovery 与 Invocation 意味着：

> 为一个 智能体 写的 Tool，可以被所有支持 MCP 的 Agent 使用。

例如：

```text
Postgres MCP Server
```

只要实现一次。

理论上所有支持 MCP 的 Agent 都能接入。

Tool Integration Investment 开始具有 Portability。

---

## 给 Agent Builder 的结论

如果你还在设计自己的：

```text
Custom Tool Protocol
```

很可能应该重新考虑。

MCP 已经足够好。

而且生态优势会随着时间不断复利。

更合理的选择通常是：

1. 实现 MCP Client；
2. 参与 Spec；
3. 让标准通过社区反馈继续演化。

---

# 趋势二：Multi-Agent Coordination

Claude Code 已经具备：

- Sub-agent；
- Task Coordination；
- Fork Agent。

这些是 Multi-Agent Pattern 的早期实现。

它们解决：

- Cache Sharing；
- Parallel Exploration；
- Structured Verification。

但它们也暴露一个最根本问题：

> Coordination Overhead。

---

## Multi-Agent 本身不是免费能力

Agent 之间每一条 Message 都消耗 Token。

每一个 Fork 都增加 Conversation Branch。

Parent 最终还必须：

> Reconcile Result。

Task State Machine 中：

```text
queued
running
completed
failed
cancelled
```

这些都是 Coordination Machinery。

它们增加 System Complexity，但并没有直接提高单 Agent Intelligence。

---

## 一个可能出现的反向趋势

随着单 Agent 变得越来越强，压力可能从：

> 怎么协调更多 智能体？

转向：

> 能不能让一个 智能体 强到不需要协调？

现实很可能是两者长期共存。

### Simple Task

Single Agent。

### 真正 Parallel / Wide Task

Multi-Agent。

真正的 Engineering Challenge 是：

> 把 Coordination Overhead 降低到足够低，让 Multi-Agent 只在真正适合并行时出现。

---

# 趋势三：Persistent Memory

Claude Code 当前 Memory System 可以看作：

> Persistent Agent Memory 的 Version 1。

现在已经包括：

- File-based Storage；
- 4-type Taxonomy；
- LLM Recall；
- Staleness；
- KAIROS Long-running Mode。

但这显然还不是终点。

---

## 未来 Memory 可能增加什么

### Structured Retrieval

现在 Recall 的是：

```text
Whole File
```

未来可能召回：

```text
Specific Fact
```

### Cross-project Transfer Learning

有些 User Preference 应该全局共享。

有些 Project Convention 则只能局部生效。

未来需要更精细 Scope。

### Collaborative Memory

Team Memory 已经是第一步。

但当前：

- Sync；
- Conflict Resolution；
- Access Control；

都还比较简单。

---

## File-based Memory 能扩展到多大？

当前规模：

```text
~200 Memories / Project
```

工作良好。

但如果变成：

```text
2,000 Memories / Project
```

问题会出现：

- Sonnet Side-query Manifest 太大；
- Consolidation Cost 太高；
- `MEMORY.md` 超出 Cap。

所以：

> Files-over-databases 这项架构赌注，真正的压力测试还在后面。

---

# 趋势四：Autonomous Operation

KAIROS Mode、Background Memory Extraction、Auto-dream Consolidation、Speculative Tool Execution，其实都指向同一个方向：

> Agent 开始在用户没有明确要求时做“有用的后台工作”。

例如：

- 用户没说 `/remember`，Agent 仍会自动记住；
- 用户睡觉时，Agent Consolidate 自己的 Memory；
- Model Response 还没结束，下一步 Tool 已经开始执行。

---

## 未来 Agent 会更 Proactive

未来 Agent 可能会：

- 注意到用户没有明确说出的 Pattern；
- 主动提出 Correction；
- 主动维护自己的 Knowledge；
- 不依赖显式 `/remember` Command。

Claude Code 当前的 Memory Safety Net 与 Prompt-engineered Save Heuristic，可以看作这种未来的 Prototype。

---

# Autonomous Operation 的真正约束是 Trust

Agent 越主动，用户就越需要相信：

> 自己不盯着它时，它也不会乱来。

因此这些看起来有些“保守”的设计：

- File-based Memory；
- Observable Hook；
- Staleness Warning；
- Permission Dialog；

其实都在解决同一个问题：

> Trust 不能假设，只能积累。

走向更 Autonomous Agent 的路径，很可能同时也是：

> 走向更 Transparent Agent 的路径。

---

# 结语

十七章。

六个核心抽象。

中心是一条 Generator Loop。

Tool 向外扩展能力。

Memory 向过去延伸。

Hook 守住执行边界。

Rendering Engine 把一切翻译成 Terminal 上的字符。

MCP 再把系统连接到 Codebase 之外的世界。

但 Claude Code 最深层的模式，并不是其中任何一项具体技术。

真正反复出现的是：

> **把复杂度推向边界。**

---

## Rendering Boundary

Rendering System 把复杂度集中在：

- Pool；
- Diff。

进入 Pipeline 内部之后，很多操作只剩：

```text
Integer Compare。
```

---

## Input Boundary

Input System 把复杂度集中在：

- Tokenizer；
- Keybinding Resolver。

进入 Handler 以后，只剩：

```text
Typed Action。
```

---

## Memory Boundary

Memory System 把复杂度集中在：

- Write Protocol；
- Recall Selector。

进入 Conversation 后，只剩：

```text
Context。
```

---

## Agent Loop Boundary

Agent Loop 把复杂度集中在：

- Terminal State；
- Tool System。

进入 Loop 内部之后，核心流程几乎只是：

```text
stream
→ collect
→ execute
→ append
→ repeat
```

---

# 每一道边界都在吸收 Chaos，输出 Order

```text
Raw Bytes
→ ParsedKey

Markdown Files
→ Recalled Memories

MCP JSON-RPC
→ Tool Objects

Hook Exit Code
→ Permission Decisions
```

边界外的世界很乱：

- 五种 Keyboard Protocol；
- 不稳定 OAuth Server；
- 过期 Memory；
- 不可信 Repository Hook。

边界内则尽量保持：

- Typed；
- Bounded；
- Exhaustively Handled。

---

# 真正可迁移的最后一课

如果你正在构建自己的 Agentic System，最值得带走的并不是：

- Pool-based Rendering；
- KAIROS；
- 8 种 MCP Transport。

你可能根本不需要这些。

真正应该带走的是：

> **先定义边界。**

然后：

> **把复杂性吸收到边界。**

最后：

> **让边界之间的内部世界保持干净。**

困难的 Engineering 应该集中在 Edge。

舒服、可推理、可测试的 Engineering 应该存在于 Interior。

换句话说：

> 为一个“愉快的内部世界”设计系统，把复杂度预算花在边缘。

---

# 收尾

源码已经开放。

地图也已经摆在手里。

接下来最好的事情，不再是读别人怎么解释。

而是：

> **直接去读源码。**
