# Design System: PriceCRE Admin (Ghost-Adapted)

> 完全对标 Ghost CMS Admin 的设计语言与交互模型。
> Ghost Admin 的特征：极暗侧边栏 + 浅灰内容区 + 米白卡片 + 精确排版 + 毫秒级客户端面板切换。

---

## 1. Visual Theme & Atmosphere

PriceCRE 后台采用 Ghost Admin 的编辑型 CMS 美学——冷静、克制、以内容为中心。Ghost Admin 不是仪表盘，它是出版工具。这种设计哲学决定了它不依赖花哨的阴影或渐变，而是用高对比度的色彩系统和精确排版建立信息层级。

- **极暗侧边栏** (`#15171A`)：接近纯黑但不刺眼，为内容区创造干净的心理分隔。
- **浅灰内容区** (`#F0F0F1`)：比纯白柔和，减少长时间操作的视觉疲劳。
- **米白卡片** (`#FFFFFF`)：在浅灰背景上自然抬升，形成清晰的操作面。
- **精确排版**：Inter 字体 + 严格控制的行高和字间距，不靠装饰靠比例。

**核心理念**：Ghost Admin 把"管理"当成"编辑"——每一个后台操作都是内容生产流程的一环。交互节奏快、确认少、乐观更新。

---

## 2. Color Palette

| Token | Hex | Role |
|-------|-----|------|
| `black` | `#15171A` | 侧边栏背景、主标题文字 |
| `white` | `#FFFFFF` | 卡片背景、按钮区域 |
| `bg-content` | `#F0F0F1` | 内容区域背景 |
| `bg-hover` | `#F5F6F7` | 表格行悬停、鼠标经过态 |
| `bg-sidebar-hover` | `#1E2026` | 侧边栏项目悬停 |
| `text-primary` | `#15171A` | 主文字、标题 |
| `text-secondary` | `#738A94` | 辅助文字、描述、标签 |
| `text-tertiary` | `#A5B4BF` | 占位符、非活跃文字 |
| `text-sidebar` | `#738A94` | 侧边栏导航文字 |
| `text-sidebar-active` | `#FFFFFF` | 侧边栏激活项文字 |
| `accent` | `#3EB0EF` | 主交互色、链接、CTA 按钮背景 |
| `accent-hover` | `#33A1DE` | 按钮悬停态 |
| `accent-soft` | `rgba(62,176,239,0.08)` | 过滤标签、选中背景 |
| `accent-border` | `rgba(62,176,239,0.3)` | 选中态边框 |
| `success` | `#30CF43` | 成功状态、Ghost 标志绿 |
| `success-text` | `#1A9E2F` | 成功文字色 |
| `success-soft` | `rgba(48,207,67,0.1)` | 成功徽章背景 |
| `error` | `#E64C4C` | 错误、删除操作 |
| `error-soft` | `rgba(230,76,76,0.08)` | 错误徽章背景 |
| `warning` | `#F0A830` | 警告状态 |
| `warning-soft` | `rgba(240,168,48,0.08)` | 警告徽章背景 |
| `border` | `#E5E7EB` | 卡片边框、分割线、输入框边框 |
| `border-dark` | `#D1D5DB` | 加深边框（焦点态） |
| `shadow-card` | `0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)` | 卡片阴影 |
| `shadow-elevated` | `0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)` | 弹窗/浮层阴影 |

---

## 3. Typography

### Font Stack
- **UI**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- **Mono**: `"JetBrains Mono", "SF Mono", "Cascadia Code", ui-monospace, monospace`
- **Data numerals**: Always `"tnum"` feature for tabular alignment

### Hierarchy

| Role | Size | Weight | Line | Color | Notes |
|------|------|--------|------|-------|-------|
| Page Title | 22px | 600 | 1.15 | `#15171A` | 页面主标题 |
| Section Title | 15px | 600 | 1.25 | `#15171A` | 分区标题 |
| Card Title | 14px | 600 | 1.3 | `#15171A` | 卡片内标题 |
| Body | 14px | 400 | 1.5 | `#15171A` | 正文 |
| Body Secondary | 13px | 400 | 1.5 | `#738A94` | 辅助文字 |
| Button | 14px | 500 | 1.0 | 白/蓝 | 按钮文字 |
| Button Small | 13px | 500 | 1.0 | 可变 | 紧凑按钮 |
| Label | 12px | 600 | 1.0 | `#738A94` | 表单标签、栏目标题 |
| Caption | 12px | 400 | 1.4 | `#738A94` | 说明文字 |
| Stat Value | 28px | 600 | 1.0 | `#15171A` | 仪表盘数字 (tnum) |
| Stat Label | 11px | 500 | 1.0 | `#738A94` | 数字标签 |
| Badge | 10px | 500 | 1.0 | 可变 | 状态徽章 |
| Nav Item | 14px | 500 | 1.0 | `#738A94` | 侧边栏导航 |
| Nav Active | 14px | 600 | 1.0 | `#FFFFFF` | 激活导航项 |
| Code/API | 12px | 500 | 1.6 | `#15171A` | 代码块 (JetBrains Mono) |

### Principles
- **高对比度**: 主文字 `#15171A` 在白色/浅灰上，清晰锐利。
- **权重精准**: 600 用于标题/激活态，500 用于按钮/导航/徽章，400 用于正文。
- **中文适配**: PingFang SC + Microsoft YaHei 作为中文字体 fallback，确保汉字笔画清晰。
- **数字 tnum**: 所有仪表盘数值和表格数字使用 `font-feature-settings: "tnum"`。

---

## 4. Component Stylings

### Sidebar
- Background: `#15171A`
- Width: 240px
- User section: top, with avatar placeholder
- Nav items: 14px/500 Inter, `#738A94`, 8px 16px padding, 6px radius
- Nav hover: background `#1E2026`
- Nav active: background `rgba(62,176,239,0.15)`, left 3px `#3EB0EF` accent bar, text `#FFFFFF`
- Nav icons: 20px, `#738A94` / `#FFFFFF` active
- Footer: Ghost version + link to frontend, bottom of sidebar

### Buttons

**Primary (Blue)**
- Background: `#3EB0EF`, text: `#FFFFFF`
- Padding: 8px 20px, radius: 6px
- Font: 14px Inter weight 500
- Hover: `#33A1DE`
- Use: Primary CTA, form submit

**Ghost (hollow/outlined)**
- Background: transparent, text: `#3EB0EF`
- Padding: 7px 19px, radius: 6px
- Border: `1px solid #D1D5DB`
- Font: 14px Inter weight 500
- Hover: background `rgba(62,176,239,0.04)`, border `#3EB0EF`
- Use: Secondary actions

**Danger/Text Button**
- Background: transparent, text: `#E64C4C`
- Padding: 6px 12px, radius: 6px
- Font: 13px Inter weight 500
- Hover: background `rgba(230,76,76,0.04)`
- Use: Delete, destructive actions

### Cards
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`
- Radius: 8px
- Shadow: `0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)`
- Padding: 20px (content cards) / 24px (form cards)
- Hover: border shifts to `#D1D5DB`

### Dashboard Stat Cards
- Background: `#FFFFFF`
- No border (background is `#F0F0F1` providing contrast automatically)
- Radius: 8px, padding: 20px 24px
- Shadow: card shadow
- Stat value: 28px/600 Inter, `#15171A`, tnum
- Stat label: 11px/500 Inter, `#738A94`, uppercase tracking

### Badges / Tags

**Status Badge Base**
- Padding: 2px 8px, radius: 4px
- Font: 10px Inter weight 600, uppercase tracking 0.5px

**Active/Success**
- Background: `rgba(48,207,67,0.1)`, text: `#1A9E2F`
- Use: Enabled, Success, Active

**Accent**
- Background: `rgba(62,176,239,0.08)`, text: `#2090CC`
- Use: In Progress, Selected

**Neutral**
- Background: `#F0F0F1`, text: `#738A94`
- Use: Disabled, Archived, Draft

**Error**
- Background: `rgba(230,76,76,0.08)`, text: `#E64C4C`
- Use: Failed, Rejected, Error

### Inputs & Forms
- Background: `#FFFFFF`
- Border: `1px solid #E5E7EB`, radius: 6px
- Padding: 8px 12px
- Font: 14px Inter weight 400, text `#15171A`
- Placeholder: `#A5B4BF`
- Focus: border `#3EB0EF`, no shadow ring
- Label: 12px/600 Inter, `#738A94`, uppercase tracking 0.3px

### Select
- Same as input styling
- Custom chevron icon matching `#738A94`
- Focus: border `#3EB0EF`

### Data Table
- Container: `#FFFFFF` card with border/radius/shadow
- Header: 12px/600 Inter, `#738A94`, uppercase tracking 0.3px
- Header bg: transparent, bottom border `1px solid #E5E7EB`
- Cell: 14px/400 Inter, `#15171A`, padding 12px 16px
- Row: bottom border `1px solid #E5E7EB`
- Row hover: background `#F5F6F7`
- Row last: no bottom border
- Numeric cells: JetBrains Mono 13px/500, tnum, right-aligned

### Empty State
- Centered, padding 80px 24px
- Icon: 48px, color `#738A94`, opacity 0.4
- Title: 16px/600 Inter, `#15171A`
- Description: 14px/400 Inter, `#738A94`

### Toast / Notification
- Background: `#FFFFFF`, border: `1px solid #E5E7EB`
- Radius: 8px, padding: 12px 16px
- Font: 13px/400 Inter, `#15171A`
- Shadow: elevated
- Auto-dismiss 3s

### Filter Tabs / Pills
- Container: inline-flex, gap 4px
- Tab: 12px/500 Inter, padding 4px 10px, radius 4px
- Inactive: text `#738A94`, background transparent
- Hover: background `#F5F6F7`
- Active: background `rgba(62,176,239,0.1)`, text `#3EB0EF`

---

## 5. Layout Principles

### Spacing
- Base unit: 4px
- Content padding: 40px 48px
- Section gap: 32px
- Card gap: 12px (compact grid) / 16px (standard grid)

### Grid
- Content area: centered, max 1280px
- Dashboard: 4-column grid → 2-col tablet → 1-col mobile
- Form: 2-column grid for field pairs

### Ghost Admin Layout Signature
```
+-------------------+----------------------------------------+
|                   |                                        |
|   Sidebar         |   Content Area                        |
|   240px           |                                        |
|   #15171A         |   #F0F0F1                              |
|                   |                                        |
|   - Brand         |   [Page Title]                         |
|   - Navigation    |   [Description]                        |
|   - Footer        |                                        |
|                   |   [Stats Grid]                         |
|                   |                                        |
|                   |   [Content / Table]                    |
|                   |                                        |
+-------------------+----------------------------------------+
```

### Border Radius
- Buttons, inputs, badges: 6px (slightly rounded)
- Cards, panels: 8px
- Checkboxes, radios: 3px (sharp)

---

## 6. Depth & Elevation

Ghost Admin uses minimal elevation. The main depth cue is color contrast, not shadow.

| Level | Treatment | Use |
|-------|-----------|-----|
| Base | No shadow, `#F0F0F1` bg | Content background |
| Surface | `0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)` | Cards, tables |
| Elevated | `0 0 0 1px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.08)` | Modals, dropdowns, toast |
| Focus Ring | `2px solid #3EB0EF`, `outline-offset: 1px` | Keyboard accessibility |

---

## 7. Do's and Don'ts

### Do
- Use `#15171A` for primary text — it's near-black but not #000
- Use Inter with weight 600 for headings, 500 for UI, 400 for body
- Keep sidebar dark (`#15171A`), content light (`#F0F0F1`)
- Use minimal shadows — rely on color contrast for depth
- Label filter states clearly with count badges
- Provide empty states with actionable CTA

### Don't
- Don't use pure black (#000) or pure white text on light
- Don't use neon/bright colors outside of accent/success/error
- Don't use weight 300 or below — Ghost Admin text is always readable
- Don't add unnecessary hover animations
- Don't use large border-radius (>8px)
- Don't layer multiple shadows

---

## 8. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 900px | Sidebar collapses to top bar, content fills full width |
| < 600px | Single column, reduced padding (16px), simplified tables |

---

## 9. Agent Prompt Guide

### Quick Reference
- Sidebar bg: `#15171A`
- Content bg: `#F0F0F1`
- Card bg: `#FFFFFF`
- Primary text: `#15171A`
- Secondary text: `#738A94`
- Accent: `#3EB0EF`
- Success: `#30CF43`
- Error: `#E64C4C`
- Border: `#E5E7EB`
- Card shadow: `0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)`
- Font: Inter, weights 400/500/600
- Mono: JetBrains Mono for data

### Architecture
- Panel switcher: `useState` in layout, not Next.js pages
- Data fetching: `useSWR` with kv cache
- Mutations: optimistic update + background sync + rollback on failure
- Code splitting: `React.lazy` per panel
