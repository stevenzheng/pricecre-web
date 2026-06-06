# Design System: PriceCRE Admin (Vercel-Adapted)

> 完全对标 Vercel Console / Geist Design System 的设计语言与交互模型。
> Vercel Console 的特征：极致克制、黑白为主、Geist 字体、锐利边角、慷慨留白、强调色如标点般使用。

---

## 1. Visual Theme & Atmosphere

PriceCRE 后台采用 Vercel Console 的开发者工具美学——冷静、精确、以数据为中心。这种设计哲学依赖黑白灰的高对比度系统和 Geist 字体的精确排版建立信息层级，强调色仅用于链接和 CTA。

- **纯白内容区** (`#FAFAFA` → `#FFFFFF`)：明亮、专业，适合长时间数据工作。
- **极简边框** (`#E5E5E5`)：几乎不可见的边界线，不增加视觉重量。
- **Geist 字体**：Sans 用于 UI，Mono 用于数据，自带 `-0.04em` 紧凑字间距。
- **黑色文字** (`#171717`)：接近纯黑，高对比度确保数据可读性。

**核心理念**：Vercel Console 把"管理"当成"开发"——界面是工具，不是装饰。每个像素都为数据服务，不靠装饰靠结构。

---

## 2. Color Palette

| Token | Hex | Role |
|-------|-----|------|
| `black` | `#000000` | 暗色模式背景 |
| `gray-950` | `#0A0A0A` | 最深灰 |
| `gray-900` | `#171717` | 主文字、标题 |
| `gray-800` | `#262626` | 次要深色 |
| `gray-700` | `#404040` | 段落文字 |
| `gray-600` | `#525252` | 辅助文字 |
| `gray-500` | `#737373` | 描述文字 |
| `gray-400` | `#A3A3A3` | 占位符、禁用态 |
| `gray-300` | `#D4D4D4` | 边框（强调） |
| `gray-200` | `#E5E5E5` | 默认边框、分割线 |
| `gray-100` | `#F7F7F7` | 浅灰背景、悬停态 |
| `white` | `#FFFFFF` | 卡片背景、页面背景 |
| `accent` | `#0070F3` | 链接、主按钮、选中态 — 如标点般克制使用 |
| `accent-hover` | `#005AC8` | 按钮/链接悬停 |
| `accent-soft` | `rgba(0,112,243,0.06)` | 选中背景 |
| `accent-border` | `rgba(0,112,243,0.2)` | 选中边框 |
| `success` | `#0070F3` | 成功状态（与 accent 同色） |
| `success-soft` | `rgba(0,112,243,0.06)` | 成功徽章背景 |
| `error` | `#EE0000` | 错误、删除操作 |
| `error-soft` | `rgba(238,0,0,0.06)` | 错误徽章背景 |
| `warning` | `#F5A623` | 警告状态 |
| `warning-soft` | `rgba(245,166,35,0.08)` | 警告徽章背景 |
| `border-light` | `#E5E5E5` | 卡片边框、表格分割线 |
| `border-input` | `#D4D4D4` | 输入框边框 |
| `border-focus` | `#0070F3` | 焦点边框 |
| `shadow-none` | `none` | 默认无阴影 |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | 极微阴影（卡片） |
| `shadow-md` | `0 2px 8px rgba(0,0,0,0.06)` | 浮层阴影 |

---

## 3. Typography

### Font Stack
- **Sans**: `'Geist Sans', 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- **Mono**: `'Geist Mono', 'SF Mono', 'SFMono-Regular', 'Cascadia Code', ui-monospace, monospace`
- **Data numerals**: Always `font-variant-numeric: tabular-nums` for alignment

### Hierarchy

| Role | Size | Weight | Line | Letter | Color | Notes |
|------|------|--------|------|--------|-------|-------|
| Page Title | 24px | 600 | 1.15 | -0.04em | `#171717` | 页面主标题 |
| Section Title | 16px | 600 | 1.25 | -0.02em | `#171717` | 分区标题 |
| Card Title | 14px | 600 | 1.3 | -0.01em | `#171717` | 卡片内标题 |
| Body | 14px | 400 | 1.5 | -0.01em | `#404040` | 正文 |
| Body Secondary | 14px | 400 | 1.5 | -0.01em | `#737373` | 辅助文字 |
| Button | 14px | 500 | 1.0 | -0.01em | 白/蓝 | 按钮文字 |
| Button Small | 13px | 500 | 1.0 | -0.01em | 可变 | 紧凑按钮 |
| Label | 12px | 500 | 1.0 | 0 | `#737373` | 表单标签、栏目标题 |
| Caption | 12px | 400 | 1.4 | 0 | `#737373` | 说明文字 |
| Stat Value | 32px | 600 | 1.0 | -0.04em | `#171717` | 仪表盘数字 (tabular-nums) |
| Stat Label | 12px | 500 | 1.0 | 0 | `#737373` | 数字标签 |
| Badge | 11px | 500 | 1.0 | 0 | 可变 | 状态徽章 |
| Nav Item | 14px | 500 | 1.0 | -0.01em | `#525252` | 侧边栏导航 |
| Nav Active | 14px | 600 | 1.0 | -0.01em | `#171717` | 激活导航项 |
| Code/API | 13px | 500 | 1.6 | 0 | `#171717` | 代码块 (Geist Mono) |

### Principles
- **紧凑间距**: Geist 自带 `-0.04em` 到 `-0.01em` 字间距，让文本更"设计感"。
- **高对比度**: 主文字 `#171717` 在白色背景上，符合 WCAG AAA 标准。
- **权重极简**: 仅用 400/500/600 三种字重，不引入 300 以下的轻字重。
- **数字 tabular-nums**: 所有仪表盘数值使用 Geist Mono 的等宽数字特性。

---

## 4. Component Stylings

### Sidebar
- Background: `#FAFAFA`
- Width: 240px
- Border-right: `1px solid #E5E5E5`
- Brand section: top, with logo + product name
- Nav items: 14px/500 Geist Sans, `#525252`, 8px 12px padding, 6px radius
- Nav hover: background `#F7F7F7`, color `#171717`
- Nav active: background `rgba(0,112,243,0.06)`, color `#171717`, font-weight 600
- Nav icons: 18px, `#737373` / `#171717` active
- Footer: user section at bottom, subtle divider

### Top Header (Mobile / Tablet alternative)
- Background: `#FFFFFF`
- Height: 48px
- Border-bottom: `1px solid #E5E5E5`
- Contains: hamburger menu + page title + actions

### Buttons

**Primary (Blue)**
- Background: `#0070F3`, text: `#FFFFFF`
- Padding: 8px 16px, radius: 6px
- Font: 14px Geist Sans weight 500
- Hover: `#005AC8`
- Use: Primary CTA, form submit — **sparingly, like punctuation**

**Secondary (Outline)**
- Background: `#FFFFFF`, text: `#171717`
- Padding: 7px 15px, radius: 6px
- Border: `1px solid #D4D4D4`
- Font: 14px Geist Sans weight 500
- Hover: background `#F7F7F7`, border `#A3A3A3`
- Use: Secondary actions, cancel

**Ghost (Text-only)**
- Background: transparent, text: `#525252`
- Padding: 6px 12px, radius: 6px
- Font: 13px Geist Sans weight 500
- Hover: background `#F7F7F7`, color `#171717`
- Use: Tertiary actions, table row actions

**Danger**
- Background: transparent, text: `#EE0000`
- Padding: 6px 12px, radius: 6px
- Font: 13px Geist Sans weight 500
- Hover: background `rgba(238,0,0,0.04)`
- Use: Delete, destructive actions

### Cards
- Background: `#FFFFFF`
- Border: `1px solid #E5E5E5`
- Radius: 6px (Dashboard) / 8px (larger cards)
- Shadow: `0 1px 2px rgba(0,0,0,0.04)` — minimal
- Padding: 20px (content cards) / 24px (form cards)
- Hover: border shifts to `#D4D4D4`

### Dashboard Stat Cards
- Background: `#FFFFFF`
- Border: `1px solid #E5E5E5`
- Radius: 6px, padding: 20px 24px
- Stat value: 32px/600 Geist Sans, `#171717`, tabular-nums, `-0.04em`
- Stat label: 12px/500 Geist Sans, `#737373`
- No hover effect (stat cards are static)

### Badges / Tags

**Status Badge Base**
- Padding: 2px 8px, radius: 4px (pill: 9999px)
- Font: 11px Geist Sans weight 500

**Active/Success**
- Background: `rgba(0,112,243,0.06)`, text: `#0070F3`
- Use: Active, Success

**Neutral**
- Background: `#F7F7F7`, text: `#737373`
- Use: Draft, Archived, Disabled

**Error**
- Background: `rgba(238,0,0,0.06)`, text: `#EE0000`
- Use: Failed, Rejected, Error

**Warning**
- Background: `rgba(245,166,35,0.08)`, text: `#B5791A`
- Use: Warning, Pending

### Status Dot
- Size: 6px, border-radius: 50%
- Success: `#0070F3`
- Error: `#EE0000`
- Neutral: `#A3A3A3`
- Warning: `#F5A623`

### Inputs & Forms
- Background: `#FFFFFF`
- Border: `1px solid #D4D4D4`, radius: 6px
- Padding: 8px 12px
- Font: 14px Geist Sans weight 400, text `#171717`
- Placeholder: `#A3A3A3`
- Focus: border `#0070F3`, subtle ring `0 0 0 2px rgba(0,112,243,0.15)`
- Label: 12px/500 Geist Sans, `#737373`

### Select
- Same as input styling
- Custom chevron matching `#A3A3A3`
- Focus: border `#0070F3`

### Data Table
- Container: `#FFFFFF` card with border
- Header: 12px/500 Geist Sans, `#737373`, no uppercase
- Header bg: transparent, bottom border `1px solid #E5E5E5`
- Header padding: 10px 16px
- Cell: 14px/400 Geist Sans, `#404040`, padding 12px 16px
- Row border: `1px solid #E5E5E5`
- Row hover: background `#F7F7F7`
- Numeric cells: Geist Mono 13px/500, tabular-nums, right-aligned

### Empty State
- Centered, padding 64px 24px
- Title: 16px/600 Geist Sans, `#171717`
- Description: 14px/400 Geist Sans, `#737373`
- Action button below description

### Toast / Notification
- Background: `#FFFFFF`, border: `1px solid #E5E5E5`
- Radius: 8px, padding: 12px 16px
- Font: 14px/400 Geist Sans, `#171717`
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`
- Auto-dismiss 3s
- Position: bottom-right

### Filter Tabs / Pills
- Container: inline-flex, gap 0
- Tab: 14px/500 Geist Sans, padding 8px 16px
- Inactive: text `#737373`, background transparent, bottom border transparent
- Hover: color `#171717`
- Active: text `#171717`, bottom border `2px solid #171717`

### Pagination
- Container: flex, centered, gap 4px
- Button: 32px × 32px, radius 6px
- Active: background `#171717`, text `#FFFFFF`
- Inactive: text `#525252`, hover background `#F7F7F7`
- Disabled: opacity 0.3

### Skeleton Loading
- Background: `linear-gradient(90deg, #F7F7F7 25%, #E5E5E5 50%, #F7F7F7 75%)`
- Animation: shimmer 1.5s ease-in-out infinite
- Radius: 6px

---

## 5. Layout Principles

### Spacing
- Base unit: 4px
- Content padding: 32px 40px (desktop)
- Section gap: 24px
- Card gap: 12px (compact grid) / 16px (standard grid)

### Grid
- Content area: fluid, no max-width
- Dashboard stats: 4-column → 2-col tablet → 1-col mobile
- Form: 2-column grid for field pairs

### Vercel Console Layout Signature
```
+-------------------+----------------------------------------+
|                   |                                        |
|   Sidebar         |   Top Bar (optional)                   |
|   240px           |   ------------------------------------|
|   #FAFAFA         |   Content Area                        |
|                   |   #FFFFFF                              |
|   - Brand         |                                        |
|   - Navigation    |   [Page Title]                         |
|   - User          |                                        |
|                   |   [Stats Grid]                         |
|                   |                                        |
|                   |   [Content / Table]                    |
|                   |                                        |
+-------------------+----------------------------------------+
```

### Border Radius
- Buttons, inputs, badges: 6px
- Cards, panels: 6-8px
- Pills: 9999px
- No radius: 0px for edge-to-edge tables

### Focus Ring
- `0 0 0 2px rgba(0,112,243,0.15)` — subtle blue glow
- High contrast for keyboard accessibility

---

## 6. Depth & Elevation

Vercel Console uses minimal to zero elevation. The main depth cue is border contrast and spacing.

| Level | Treatment | Use |
|-------|-----------|-----|
| Base | No shadow, `#FFFFFF` bg | Content background |
| Surface | `1px solid #E5E5E5` + `0 1px 2px rgba(0,0,0,0.04)` | Cards, tables |
| Elevated | `1px solid #E5E5E5` + `0 2px 8px rgba(0,0,0,0.06)` | Modals, dropdowns, toast |
| Focus | `0 0 0 2px rgba(0,112,243,0.15)` | Input focus, keyboard nav |

---

## 7. Do's and Don'ts

### Do
- Use `#171717` for primary text — black enough for readability, not #000
- Use Geist Sans with weight 600 for headings, 500 for UI, 400 for body
- Use Geist Mono for all numeric data, code, and identifiers
- Keep sidebar light (`#FAFAFA`), content white (`#FFFFFF`)
- Use borders as the primary visual separator, not shadows
- Give generous whitespace — 32px+ content padding
- Use `-0.04em` letter-spacing on headings and stat values
- Use blue (`#0070F3`) like punctuation — only where it carries meaning

### Don't
- Don't use gradients in the admin UI
- Don't use decorative icons or illustrations
- Don't use pure black (#000) for text on white
- Don't use more than 3 font weights (400, 500, 600)
- Don't use large border-radius (>8px) in admin
- Don't layer multiple shadows
- Don't use uppercase labels (Vercel uses sentence case)
- Don't over-use the accent color — it's not a decoration

---

## 8. Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| < 1024px | Sidebar collapses to icon-only (60px), content padding reduces to 24px |
| < 640px | Sidebar becomes top bar, single column, padding 16px |

---

## 9. Agent Prompt Guide

### Quick Reference
- Sidebar bg: `#FAFAFA`
- Content bg: `#FFFFFF`
- Card bg: `#FFFFFF`
- Primary text: `#171717`
- Secondary text: `#525252`
- Tertiary text: `#737373`
- Accent: `#0070F3` — use sparingly
- Error: `#EE0000`
- Warning: `#F5A623`
- Border: `#E5E5E5`
- Card shadow: `0 1px 2px rgba(0,0,0,0.04)`
- Font: Geist Sans, weights 400/500/600
- Mono: Geist Mono for data
- Letter-spacing: `-0.04em` (headings), `-0.01em` (body)
- Border-radius: 6px (default), 4px (compact), 8px (cards)

### Architecture
- Shell: layout.tsx with `vl-*` CSS classes
- Data fetching: SWR (unchanged)
- Mutations: optimistic update + rollback (unchanged)
- Panel switching: Next.js App Router (unchanged)
