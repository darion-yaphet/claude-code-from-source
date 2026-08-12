# Claude Code From Source（中文译本）

从源码出发，拆解 Claude Code 的生产级智能体架构。

本仓库是 [Claude Code from Source](https://claude-code-from-source.com/) 的**非官方中文翻译**。原文共 18 章（含结语），这里已整理完整译本；交互图表等仍以原站为准：

**原文：** https://claude-code-from-source.com/

Claude Code 是 Anthropic 对「智能体式命令行工具」的生产级实现：将近两千个 TypeScript 文件组成的单体应用，把终端变成由 Claude 驱动的完整开发环境。它已经交付给数十万名开发者使用，其中每一个架构决策都会产生真实世界的后果。

本书采用事后回顾式的拆解方式。六个核心抽象并不是项目开始时就在白板上提前设计好的——它们是在向大量用户交付生产级智能体的过程中，在各种现实压力之下逐渐形成的。

## 你会学到什么

- Claude Code 如何用六个抽象统一整个系统
- 启动流水线如何把复杂初始化压进约 300ms 的感知预算
- 为什么状态要拆成 Bootstrap State 与 AppState 双层架构
- API 层如何在多提供商、提示词缓存与流式故障检测之间取平衡
- 智能体循环、工具流水线与并发执行如何协作
- 子智能体、Fork / Swarm、记忆、Skills / Hooks 如何扩展系统
- 终端 UI、MCP、远程控制与性能工程中的关键取舍

## 阅读路径

| 章节 | 主题 |
|------|------|
| [第一章](chapter-01/README.md) | AI 智能体的架构：六个抽象与黄金路径 |
| [第二章](chapter-02/README.md) | 快速启动：引导流水线与信任边界 |
| [第三章](chapter-03/README.md) | 状态：双层架构与粘性锁存器 |
| [第四章](chapter-04/README.md) | 与 Claude 通信：API 层与提示词缓存 |
| [第五章](chapter-05/README.md) | 智能体循环 |
| [第六章](chapter-06/README.md) | 工具：从定义到执行 |
| [第七章](chapter-07/README.md) | 并发工具执行 |
| [第八章](chapter-08/README.md) | 创建子智能体 |
| [第九章](chapter-09/README.md) | Fork Agent 与提示词缓存 |
| [第十章](chapter-10/README.md) | 任务、协调与 Swarm |
| [第十一章](chapter-11/README.md) | 记忆：跨会话学习 |
| [第十二章](chapter-12/README.md) | 扩展性：Skills 与 Hooks |
| [第十三章](chapter-13/README.md) | 终端 UI |
| [第十四章](chapter-14/README.md) | 输入与交互 |
| [第十五章](chapter-15/README.md) | MCP：通用工具协议 |
| [第十六章](chapter-16/README.md) | 远程控制与云端执行 |
| [第十七章](chapter-17/README.md) | 性能：每一毫秒与 Token |
| [结语](chapter-18/README.md) | 五个架构赌注 |

建议按章节顺序阅读。第 1 章建立心智模型，后续每一章都是对「黄金路径」中某一环节的放大观察。

## 在线阅读

https://darion-yaphet.github.io/claude-code-from-source/

## 本地预览

```bash
npm install
npm run serve
```

浏览器打开提示的本地地址即可阅读。生成静态站点：

```bash
npm run build
```

输出目录为 `_book/`。推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。

## 说明与致谢

- 原文项目：[Claude Code from Source](https://claude-code-from-source.com/)，版权与内容归属原作者；原文仓库见 [alejandrobalderas/claude-code-from-source](https://github.com/alejandrobalderas/claude-code-from-source)。
- 本仓库为学习用途的**非官方中文翻译**，**不代表原作者或 Anthropic**；如原文有更新，以原站为准。
- 许可与使用限制见 [LICENSE](LICENSE)（译文整理部分采用 CC BY-NC-SA 4.0；原文版权仍归原作者）。
- 各章文首提供原文链接；文中标注的交互图、动画请到原站查看完整交互版。
- 使用 [HonKit](https://github.com/honkit/honkit)（经典 GitBook 的活跃维护分支）构建文档站点。
