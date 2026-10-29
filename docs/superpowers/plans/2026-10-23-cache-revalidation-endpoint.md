# 内容缓存刷新接口 Implementation Plan

> **For agentic workers:** Required execution path is inline in this task; do not delegate.

**Goal:** 为 Directus 内容保存事件提供受密钥保护、按集合刷新 Next 数据缓存的接口。

**Architecture:** 复用现有 `cacheTags.ts` 集合映射；`POST /api/revalidate` 只接受白名单集合，校验服务端密钥后调用 `revalidateTag`。这一步先交付可验证的接口，Directus Flow 的自动触发另行接线和验收。

**Tech Stack:** Next.js 15 Route Handler、Node.js 验证脚本。

**Spec:** `docs/AI-项目总况.md` §7、§13；PRD v3.2 内容更新要求。

## Global Constraints

- 不把密钥写入仓库或响应。
- 未配置密钥时接口必须拒绝请求。
- 未知集合不能刷新任意标签。
- 本地开发的 `no-store` 不代表生产缓存闭环已验收。

## Tasks

- [x] 写接口验证：无密钥、错误密钥、未知集合被拒；合法集合返回对应标签。
- [x] 运行验证，确认失败原因是接口尚未实现。
- [x] 实现 Route Handler 与环境变量说明。
- [x] 复跑验证、类型检查和现有缓存映射检查。
- [x] 在项目总况写明完成范围与尚未接线的 Directus Flow。

## Follow-up: Directus save trigger

- [x] 写 Flow 配置验证，并确认当前环境因未安装 Flow 而失败。
- [x] 以可复跑脚本安装非阻塞的 Directus 保存事件 Flow，密钥从 Directus 环境白名单读取，不写进 Flow 配置。
- [x] 以一次无内容变化的后台保存验证 Flow：保存成功，Flow 触发，但 Directus 拒绝 localhost 请求；Flow 已停用。
- [x] 在项目总况记录当前状态与后续接线要求；生产模式端到端仍待验收。
- [x] 2026-10-26：改用 `cms/extensions/revalidate-hook` 完成保存触发（Flow 请求操作无法访问 localhost）。本地保存 200 且 Next `/api/revalidate` 200；Flow 保持停用。`next start` 页面体感仍待验收。
