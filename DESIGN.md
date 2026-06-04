# Design System: PriceCRE Admin (Blue-Adapted)

> 与价格 CRE 首页前端蓝色调（`#2563EB`）完全一致的后台设计系统。
> 字体策略：汉字使用 MiSans Medium (500) 和 Regular (400)，确保中文笔画清晰可读。

---

## 1. Visual Theme & Atmosphere

PriceCRE Admin 采用与首页一致的蓝色调金融美学。后台以纯白 (`#ffffff`) 为画布，深色文字 (`#1A1A2E`) 为标题色，首页蓝 (`#2563EB`) 作为品牌锚点和交互强调。蓝色传递出专业、可信赖和精确感，与「地产价值」品牌定位一致。

左侧导航栏使用深蓝色区域 (`#0f2b4a`)，形成前台与后台的视觉分野，与首页暗色模式导航暗区形成统一。

**核心特征：**
- MiSans Medium (500) 为标题和强文本，Regular (400) 用于正文和辅助文字
- Geist Mono (500) 用于数据数字和代码标签
- 中等线体汉字：中文笔画清晰，兼顾金融终端的精密感
- 简洁阴影——干净、清爽，与首页风格统一
- 保守圆角 (4px-8px)——无胶囊形，无锋利直角
- 蓝色 CTA + 幽灵按钮组合
- 深色文字 (`#1A1A2E`) 替代纯黑标题——与首页文字色系统一

---

## 2. Color Palette & Roles

### Primary
- **Pricecre Blue** (`#2563EB`): 主品牌色，CTA 背景，链接文字，交互高亮。与首页 `--accent` CSS 变量一致。
- **Deep Text** (`#1A1A2E`): 主标题色。与首页 `--text-strong` CSS 变量一致。
- **Pure White** (`#ffffff`): 页面背景，卡片表面，深色背景上的按钮文字。

### Brand & Dark
- **Sidebar Bg** (`#0f2b4a`): 深蓝色，用于侧边栏背景，与首页暗色主题呼应。
- **Sidebar Text** (`rgba(255,255,255,0.7)`): 侧边栏主要文字。
- **Sidebar Muted** (`rgba(255,255,255,0.4)`): 侧边栏次要文字。

### Interactive
- **Primary Blue** (`#2563EB`): 主链接色，激活态，选中元素。
- **Blue Hover** (`#1d4ed8`): 主元素悬停态深蓝色。
- **Blue Light** (`#93c5fd`): 用于 subdued hover 边框和空状态图标的柔和浅蓝色。
- **Blue Soft** (`rgba(37,99,235,0.08)`): 过滤标签和徽章背景。
- **Focus Ring** (`rgba(37,99,235,0.1)`): 输入框聚焦发光。

### Neutral Scale
- **Heading** (`#1A1A2E`): 主标题，导航文字，强标签。
- **Label** (`#374151`): 表单标签，次级标题。
- **Body** (`#64748d`): 次要文字，描述，说明。
- **Success Green** (`#059669`): 状态徽章，成功指示器。
- **Warning Amber** (`#D97706`): 警告和提示强调。

### Surface & Borders
- **Border Default** (`#e5edf5`): 标准边框色，用于卡片、分割线和容器。
- **Border Blue** (`#93c5fd`): 按钮和输入焦点/选中态边框。
- **Sidebar Active** (`rgba(37,99,235,0.25)`): 侧边栏激活项背景。
- **Sidebar Hover** (`rgba(255,255,255,0.06)`): 侧边栏悬停背景。

---

## 3. Typography Rules

### Font Family
- **Primary**: `MiSans`, fallback: `-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif`
- **Monospace**: `Geist Mono`, fallback: `SF Mono, ui-monospace, Consolas, monospace`
- **Numeric Display**: Monospace with `font-feature-settings: "tnum"` for tabular numbers

### Hierarchy (Admin Panel)

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Page Title | MiSans | 22px | 500 | 1.10 | -0.22px | Section headings |
| Section Heading | MiSans | 18px | 500 | 1.15 | -0.18px | Subsection titles |
| Card Title | MiSans | 16px | 500 | 1.20 | normal | Card headings |
| Body | MiSans | 14px | 400 | 1.50 | normal | Standard text |
| Button | MiSans | 14px | 500 | 1.00 | normal | Button text |
| Button Small | MiSans | 12px | 500 | 1.00 | normal | Compact buttons |
| Label | MiSans | 13px | 500 | 1.00 | normal | Form labels |
| Caption | MiSans | 12px | 400 | 1.40 | normal | Secondary descriptions |
| Caption Small | MiSans | 11px | 400 | 1.33 | normal | Timestamps, metadata |
| Stat Value | Geist Mono | 24px | 500 | 1.00 | -0.36px | Dashboard numbers, tabular nums |
| Stat Label | MiSans | 11px | 400 | 1.00 | 0.1px | Stat card labels |
| Badge Text | MiSans | 10px | 400 | 1.00 | normal | Status badges |
| Nav Link | MiSans | 14px | 400 | 1.00 | normal | Sidebar navigation |
| Nav Link Active | MiSans | 14px | 500 | 1.00 | normal | Active nav item |
| Sidebar Title | MiSans | 16px | 500 | 1.00 | normal | Sidebar brand name |
| Sidebar Caption | MiSans | 10px | 400 | 1.15 | 0.1px | Sidebar subtitle |
| Code Inline | Geist Mono | 12px | 500 | 1.50 | normal | Inline code, technical labels |
| Code Block | Geist Mono | 12px | 500 | 2.00 | normal | Code blocks |

### Principles
- **中等线体汉字**: MiSans Medium (500) 用于标题和强文本，Regular (400) 用于正文——确保中文笔画清晰、粗细均匀。
- **两者统一**: 系统使用两个 MiSans 权重——400 (正文/辅助) 和 500 (标题/按钮/标签)，与首页前端字重体系一致。
- **负字间距**: 标题按比例收紧: -0.22px at 22px, -0.18px at 18px, normal at 14px and below。
- **数字用 tnum**: 所有表格/财务数字显示使用 `font-feature-settings: "tnum"`。

---

## 4. Component Stylings

### Buttons

**Primary Blue**
- Background: `#2563EB`
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 4px
- Font: 14px MiSans weight 500
- Hover: `#1d4ed8` background
- Use: Primary CTA

**Ghost / Outlined**
- Background: transparent
- Text: `#2563EB`
- Padding: 8px 16px
- Radius: 4px
- Border: `1px solid #93c5fd`
- Font: 14px MiSans weight 500
- Hover: background `rgba(37,99,235,0.05)`
- Use: Secondary actions

**Danger**
- Background: transparent
- Text: `#dc2626`
- Padding: 6px 12px
- Radius: 4px
- Border: none
- Font: 12px MiSans weight 500
- Hover: background `rgba(220,38,38,0.05)`
- Use: Delete actions

**Neutral Ghost**
- Background: transparent
- Text: `#64748d`
- Padding: 6px 12px
- Radius: 4px
- Font: 12px MiSans weight 500
- Hover: background `rgba(0,0,0,0.04)`
- Use: Tertiary/muted actions

### Cards & Containers
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 6px (standard)
- Shadow: `rgba(23,23,23,0.06) 0px 3px 6px`
- Hover: border shifts to `#93c5fd`, shadow intensifies

### Dashboard Stats Card
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 6px
- Shadow: ambient level
- Hover: border shifts to `#93c5fd`

### Badges / Tags / Pills
**Success Badge**
- Background: `rgba(5,150,105,0.12)`
- Text: `#059669`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(5,150,105,0.25)`
- Font: 10px MiSans weight 400

**Neutral Badge**
- Background: `#f1f3f5`
- Text: `#64748d`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid #e5edf5`
- Font: 10px MiSans weight 400

**Blue Accent Badge**
- Background: `rgba(37,99,235,0.08)`
- Text: `#2563EB`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(37,99,235,0.2)`
- Font: 10px MiSans weight 400

**Danger Badge**
- Background: `rgba(220,38,38,0.08)`
- Text: `#dc2626`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(220,38,38,0.2)`
- Font: 10px MiSans weight 400

### Inputs & Forms
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 4px
- Padding: 8px 12px
- Focus: `1px solid #2563EB`, shadow `0 0 0 3px rgba(37,99,235,0.1)`
- Label: `#374151`, 13px MiSans weight 500
- Text: `#1A1A2E`, 14px MiSans weight 400
- Placeholder: `#64748d`

### Select
- Same as Input styling
- Custom chevron icon in blue (`#2563EB`)

### Sidebar Navigation
- Background: `#0f2b4a`
- Width: 220px
- Nav items: 14px MiSans weight 400, `rgba(255,255,255,0.7)` text
- Active item: `rgba(37,99,235,0.25)` background, icon color `#60a5fa`
- Hover: `rgba(255,255,255,0.06)` background
- Radius: 6px on items

### Data Tables
- Header: `#f8f9fb` background, 11px MiSans weight 500, `#374151` text
- Row: 1px `#e5edf5` bottom border
- Cell: 14px MiSans weight 400, `#1A1A2E` text, 12px 16px padding
- Hover row: `#f8f9fb` background
- Numeric cells: Geist Mono 14px weight 500, tnum

---

## 5. Layout Principles

### Spacing System
- Base unit: 4px
- Admin scale: 4, 8, 12, 16, 20, 24, 32, 40, 48
- Content area padding: 32px
- Card gap: 12px (compact) / 16px (standard)

### Grid & Container
- Admin content: max 1200px, centered with 32px padding
- Dashboard stats: 4-column grid (2-col tablet, 1-col mobile)
- Quick actions: 3-column grid (1-col mobile)
- Data tables: full-width with horizontal scroll on mobile

### Whitespace Philosophy
- **精密间距**: 每个间隙都是经过计算的字体选择，不是随意留白。
- **数据密集，界面慷慨**: 数据展示紧凑有序，但UI外壳周围空间充裕。像精心组织在精美框架中的电子表格。
- **Section 节奏**: 内容区域与侧边栏形成明暗交替，防止单调。

### Border Radius Scale
- Standard (4px): Buttons, inputs, badges
- Comfortable (6px): Cards, nav items, table containers
- Relaxed (8px): Featured/prominent elements

---

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow | Page background, inline text |
| Ambient (Level 1) | `rgba(23,23,23,0.06) 0px 3px 6px` | Subtle card lift |
| Elevated (Level 2) | `0 4px 16px rgba(0,0,0,0.06)` | Featured cards, dropdowns |
| Ring (Accessibility) | `2px solid #2563EB` outline | Keyboard focus |

**Shadow Philosophy**: 简洁干净，与首页前端风格统一。以微妙灰色阴影提供层级区分，不过度使用蓝色调多层阴影。

---

## 7. Do's and Don'ts

### Do
- Use MiSans weight 500 for all headings and strong text
- Use MiSans weight 400 for body text and auxiliary copy
- Use `#1A1A2E` (frontend `--text-strong`) for headings
- Keep border-radius between 4px-8px
- Use Geist Mono with `"tnum"` for all dashboard numbers
- Use `#2563EB` blue as primary CTA color (same as `--accent`)
- Sidebar dark (`#0f2b4a`), content area light (`#f8f9fb`)
- Align with frontend CSS variables where possible (`--text-strong`, `--text`, `--text-muted`)

### Don't
- Don't use weight 300 for MiSans Chinese text — too thin for readability
- Don't use large border-radius (12px+, pill shapes) on admin components
- Don't use pure black (`#000000`) for headings
- Don't add unnecessary hover animations — keep it precise
- Don't use the dark mode green accent (`#00C570`) in admin

---

## 8. Responsive Behavior

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <640px | Single column, sidebar collapses to top bar, reduced padding |
| Tablet | 640-1024px | Compact sidebar (icons only or collapsible), 2-col grids |
| Desktop | 1024-1280px | Full sidebar (220px), 3-col grids, standard padding |
| Large Desktop | >1280px | Centered content with max-width 1200px |

### Touch Targets
- Buttons: minimum 32px height (8px vertical padding × 2 + 16px text)
- Nav items: 36px minimum height
- Form inputs: 36px minimum height

### Collapsing Strategy
- Sidebar: 220px → collapsed icons (52px) → top bar on mobile
- Dashboard stats: 4-col → 2-col → 1-col
- Quick actions: 3-col → 1-col
- Data tables: horizontal scroll, sticky first column

---

## 9. Agent Prompt Guide

### Quick Color Reference
- Primary CTA: Pricecre Blue (`#2563EB`)
- CTA Hover: Blue Dark (`#1d4ed8`)
- Background: Pure White (`#ffffff`)
- Content Area Background: (`#f8f9fb`)
- Heading text: (`#1A1A2E`)
- Body text: Slate (`#64748d`)
- Label text: (`#374151`)
- Border: Soft Blue (`#e5edf5`)
- Sidebar: Dark Blue (`#0f2b4a`)
- Success: Green (`#059669`)
- Danger: Red (`#dc2626`)

### Example Component Prompts
- "Create an admin sidebar: 220px wide, #0f2b4a background. Brand name at top in white 16px MiSans weight 500. Nav links at 14px weight 400 in rgba(255,255,255,0.7) with 6px radius, active state with rgba(37,99,235,0.25) background, icon color #60a5fa."
- "Design a stats card: white background, 1px solid #e5edf5, 6px radius, ambient shadow. Stat value in 24px Geist Mono weight 500 color #1A1A2E with tnum. Label in 11px MiSans weight 400 color #64748d. Hover: border shifts to #93c5fd."
- "Build a data table: header row with #f8f9fb background, 11px MiSans weight 500 #374151. Rows with 1px #e5edf5 bottom border. Cell text 14px MiSans weight 400 #1A1A2E. Hover row #f8f9fb. Numeric columns use Geist Mono weight 500 with tnum."
- "Create a success badge: rgba(5,150,105,0.12) background, #059669 text, 4px radius, 1px 6px padding, 10px MiSans weight 400."

### Iteration Guide
1. Heading color is `#1A1A2E` (text-strong), body is `#64748d` (slate)
2. Weight 500 for headings/buttons/labels; 400 for body/caption/auxiliary
3. Border-radius stays in 4px-8px range
4. Use `"tnum"` for dashboard stats and financial numbers
5. Sidebar is dark (`#0f2b4a`), content area is light (`#ffffff` / `#f8f9fb`)
6. MiSans for text, Geist Mono for data numbers
7. Align with frontend CSS variable system (`--accent`, `--text-strong`, `--text`, `--text-muted`)
