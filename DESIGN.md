# Design System: PriceCRE Admin (Stripe-Adapted)

> 基于 Stripe 设计体系，为商业地产租金情报站后台定制的设计系统。
> 原文参考: https://stripe.com — 金融科技设计的黄金标准。

---

## 1. Visual Theme & Atmosphere

PriceCRE Admin 采用 Stripe 标志性的精密金融美学——既技术又奢华，既精确又温暖。后台以纯白 (`#ffffff`) 为画布，深海军蓝 (`#061b31`) 为标题色，标志性紫色 (`#533afd`) 同时作为品牌锚点和交互强调。这不是企业软件中常见的那种冰冷紫色，而是一种浓郁饱和的紫罗兰色，传递出自信和高端感。

左侧导航栏使用深色品牌区域 (`#1c1e54`)，形成前台与后台的视觉分野。蓝色调多层阴影系统 (`rgba(50,50,93,0.25)` combined with `rgba(0,0,0,0.1)`) 创造出冷却大气般的纵深感——仿佛元素悬浮在暮光之中。

**核心特征：**
- MiSans Light (300) 为标题签字，Regular (400) 用于交互元素
- Geist Mono (500) 用于数据数字和代码标签
- 轻量字重作为品牌签名——用轻盈感表达权威
- 蓝色调多层阴影——高亮感带品牌色温
- 保守圆角 (4px-8px)——无胶囊形，无锋利直角
- 紫色 CTA + 幽灵按钮组合
- 深海军蓝 (`#061b31`) 替代纯黑标题——温暖、高端、金融级

---

## 2. Color Palette & Roles

### Primary
- **Pricecre Purple** (`#533afd`): 主品牌色，CTA 背景，链接文字，交互高亮。饱满的蓝紫色，锚定整个系统。
- **Deep Navy** (`#061b31`): 主标题色。不是黑色也不是灰色——一种非常深的蓝色，为文字增添温度和深度。
- **Pure White** (`#ffffff`): 页面背景，卡片表面，深色背景上的按钮文字。

### Brand & Dark
- **Brand Dark** (`#1c1e54`): 深靛蓝色，用于侧边栏背景、暗色沉浸区。
- **Sidebar Surface** (`#232659`): 侧边栏次级面板，比 Brand Dark 略亮。
- **Dark Navy** (`#0d253d`): 最深的中性色——近乎黑色但有蓝色底调。

### Interactive
- **Primary Purple** (`#533afd`): 主链接色，激活态，选中元素。
- **Purple Hover** (`#4434d4`): 主元素悬停态深紫色。
- **Purple Deep** (`#2e2b8c`): 图标悬停态深紫色。
- **Purple Light** (`#b9b9f9`): 用于 subdued hover 背景的柔和薰衣草色。
- **Purple Mid** (`#665efd`): 范围选择器和输入高亮色。

### Neutral Scale
- **Heading** (`#061b31`): 主标题，导航文字，强标签。
- **Label** (`#273951`): 表单标签，次级标题。
- **Body** (`#64748d`): 次要文字，描述，说明。
- **Success Green** (`#15be53`): 状态徽章，成功指示器。
- **Success Text** (`#108c3d`): 成功徽章文字色。
- **Warning Amber** (`#9b6829`): 警告和提示强调。

### Surface & Borders
- **Border Default** (`#e5edf5`): 标准边框色，用于卡片、分割线和容器。
- **Border Purple** (`#b9b9f9`): 按钮和输入的激活/选中态边框。
- **Border Soft Purple** (`#d6d9fc`): 次级元素的微妙紫色边框。
- **Border Dashed** (`#362baa`): 放置区和占位元素的虚线边框。

### Shadow Colors
- **Shadow Blue** (`rgba(50,50,93,0.25)`): 标志性蓝色调主阴影色。
- **Shadow Dark Blue** (`rgba(3,3,39,0.25)`): 高亮元素的更深蓝色阴影。
- **Shadow Black** (`rgba(0,0,0,0.1)`): 深度强化的次级阴影层。
- **Shadow Ambient** (`rgba(23,23,23,0.08)`): 微妙高亮的柔和环境阴影。
- **Shadow Soft** (`rgba(23,23,23,0.06)`): 轻微抬升的最小阴影。

### Admin-Specific Colors
- **Sidebar Bg** (`#1c1e54`): 导航侧边栏背景。
- **Sidebar Text** (`rgba(255,255,255,0.7)`): 侧边栏主要文字。
- **Sidebar Muted** (`rgba(255,255,255,0.4)`): 侧边栏次要文字。
- **Sidebar Active** (`rgba(83,58,253,0.2)`): 侧边栏激活项背景。
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
| Page Title | MiSans | 22px | 300 | 1.10 | -0.22px | Section headings |
| Section Heading | MiSans | 18px | 300 | 1.15 | -0.18px | Subsection titles |
| Card Title | MiSans | 16px | 300 | 1.20 | normal | Card headings |
| Body | MiSans | 14px | 300 | 1.50 | normal | Standard text |
| Button | MiSans | 14px | 400 | 1.00 | normal | Button text |
| Button Small | MiSans | 12px | 400 | 1.00 | normal | Compact buttons |
| Label | MiSans | 13px | 400 | 1.00 | normal | Form labels |
| Caption | MiSans | 12px | 300 | 1.40 | normal | Secondary descriptions |
| Caption Small | MiSans | 11px | 300 | 1.33 | normal | Timestamps, metadata |
| Stat Value | Geist Mono | 24px | 500 | 1.00 | -0.36px | Dashboard numbers, tabular nums |
| Stat Label | MiSans | 11px | 300 | 1.00 | 0.1px | Stat card labels |
| Badge Text | MiSans | 10px | 300 | 1.00 | normal | Status badges |
| Nav Link | MiSans | 14px | 300 | 1.00 | normal | Sidebar navigation |
| Nav Link Active | MiSans | 14px | 400 | 1.00 | normal | Active nav item |
| Sidebar Title | MiSans | 16px | 400 | 1.00 | normal | Sidebar brand name |
| Sidebar Caption | MiSans | 10px | 300 | 1.15 | 0.1px | Sidebar subtitle |
| Code Inline | Geist Mono | 12px | 500 | 1.50 | normal | Inline code, technical labels |
| Code Block | Geist Mono | 12px | 500 | 2.00 | normal | Code blocks |

### Principles
- **轻量即签名**: Weight 300 在标题处的使用是 Stripe 最独特的字体选择。用轻盈感代替重量感来表达权威。
- **四分之一权重**: 系统只使用两个 MiSans 权重——300 (内容/标题) 和 400 (UI/按钮)，绝不使用 600+。
- **负字间距**: 标题按比例收紧: -0.22px at 22px, -0.18px at 18px, normal at 14px and below。
- **数字用 tnum**: 所有表格/财务数字显示使用 `font-feature-settings: "tnum"`。

---

## 4. Component Stylings

### Buttons

**Primary Purple**
- Background: `#533afd`
- Text: `#ffffff`
- Padding: 8px 16px
- Radius: 4px
- Font: 14px MiSans weight 400
- Hover: `#4434d4` background
- Use: Primary CTA

**Ghost / Outlined**
- Background: transparent
- Text: `#533afd`
- Padding: 8px 16px
- Radius: 4px
- Border: `1px solid #b9b9f9`
- Font: 14px MiSans weight 400
- Hover: background `rgba(83,58,253,0.05)`
- Use: Secondary actions

**Danger**
- Background: transparent
- Text: `#dc2626`
- Padding: 6px 12px
- Radius: 4px
- Border: none
- Font: 12px MiSans weight 400
- Hover: background `rgba(220,38,38,0.05)`
- Use: Delete actions

**Neutral Ghost**
- Background: transparent
- Text: `#64748d`
- Padding: 6px 12px
- Radius: 4px
- Font: 12px MiSans weight 400
- Hover: background `rgba(0,0,0,0.04)`
- Use: Tertiary/muted actions

### Cards & Containers
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 6px (standard)
- Shadow (standard): `rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px`
- Shadow (ambient): `rgba(23,23,23,0.08) 0px 15px 35px 0px`
- Hover: shadow intensifies or border shifts to purple

### Dashboard Stats Card
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 6px
- Shadow: ambient level
- Hover: border shifts to `#b9b9f9`, shadow intensifies

### Badges / Tags / Pills
**Success Badge**
- Background: `rgba(21,190,83,0.2)`
- Text: `#108c3d`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(21,190,83,0.4)`
- Font: 10px MiSans weight 300

**Neutral Badge**
- Background: `#f1f3f5`
- Text: `#64748d`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid #e5edf5`
- Font: 10px MiSans weight 300

**Purple Accent Badge**
- Background: `rgba(83,58,253,0.08)`
- Text: `#533afd`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(83,58,253,0.2)`
- Font: 10px MiSans weight 300

**Danger Badge**
- Background: `rgba(220,38,38,0.08)`
- Text: `#dc2626`
- Padding: 1px 6px
- Radius: 4px
- Border: `1px solid rgba(220,38,38,0.2)`
- Font: 10px MiSans weight 300

### Inputs & Forms
- Background: `#ffffff`
- Border: `1px solid #e5edf5`
- Radius: 4px
- Padding: 8px 12px
- Focus: `1px solid #533afd`, shadow `0 0 0 3px rgba(83,58,253,0.1)`
- Label: `#273951`, 13px MiSans weight 400
- Text: `#061b31`, 14px MiSans weight 300
- Placeholder: `#64748d`

### Select
- Same as Input styling
- Custom chevron icon in purple (`#533afd`)

### Sidebar Navigation
- Background: `#1c1e54`
- Width: 220px
- Nav items: 14px MiSans weight 300, `rgba(255,255,255,0.7)` text
- Active item: `rgba(83,58,253,0.2)` background with left border accent `#533afd`
- Hover: `rgba(255,255,255,0.06)` background
- Radius: 6px on items
- Bottom section: darker border top separator

### Data Tables
- Header: `#f8f9fb` background, 11px MiSans weight 400, `#273951` text
- Row: 1px `#e5edf5` bottom border
- Cell: 14px MiSans weight 300, `#061b31` text, 12px 16px padding
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
| Standard (Level 2) | `rgba(23,23,23,0.08) 0px 15px 35px` | Content cards |
| Elevated (Level 3) | `rgba(50,50,93,0.25) 0px 30px 45px -30px, rgba(0,0,0,0.1) 0px 18px 36px -18px` | Featured cards, dropdowns |
| Deep (Level 4) | `rgba(3,3,39,0.25) 0px 14px 21px -14px, rgba(0,0,0,0.1) 0px 8px 17px -8px` | Modals, floating panels |
| Ring (Accessibility) | `2px solid #533afd` outline | Keyboard focus |

**Shadow Philosophy**: 蓝色调多层阴影是 Stripe 的视觉DNA。主阴影色 (`rgba(50,50,93,0.25)`) 是深蓝灰色，呼应品牌的深海色系。与纯黑第二层结合，创造出视差般的深度感。

---

## 7. Do's and Don'ts

### Do
- Use MiSans weight 300 for all headings and body text
- Use MiSans weight 400 only for buttons, labels, and navigation
- Apply blue-tinted shadows for elevated elements
- Use `#061b31` (deep navy) for headings, never `#000000`
- Keep border-radius between 4px-8px
- Use Geist Mono with `"tnum"` for all dashboard numbers
- Layer shadows: blue-tinted far + neutral close
- Use `#533afd` purple as primary CTA color
- Sidebar always dark (`#1c1e54`)

### Don't
- Don't use weight 500-700 for MiSans body/headings
- Don't use large border-radius (12px+, pill shapes) on admin components
- Don't use neutral gray/black shadows — always tint blue
- Don't use pure black (`#000000`) for headings
- Don't use the green accent (`#00C570`) from the frontend theme in admin
- Don't add unnecessary hover animations — keep it precise

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
- Primary CTA: Pricecre Purple (`#533afd`)
- CTA Hover: Purple Dark (`#4434d4`)
- Background: Pure White (`#ffffff`)
- Content Area Background: (`#f8f9fb`)
- Heading text: Deep Navy (`#061b31`)
- Body text: Slate (`#64748d`)
- Label text: Dark Slate (`#273951`)
- Border: Soft Blue (`#e5edf5`)
- Sidebar: Brand Dark (`#1c1e54`)
- Success: Green (`#15be53`)
- Danger: Red (`#dc2626`)

### Example Component Prompts
- "Create an admin sidebar: 220px wide, #1c1e54 background. Brand name at top in white 16px MiSans weight 400. Nav links at 14px weight 300 in rgba(255,255,255,0.7) with 6px radius, active state with rgba(83,58,253,0.2) background and 2px #533afd left border."
- "Design a stats card: white background, 1px solid #e5edf5, 6px radius, ambient shadow. Stat value in 24px Geist Mono weight 500 color #061b31 with tnum. Label in 11px MiSans weight 300 color #64748d. Hover: border shifts to #b9b9f9."
- "Build a data table: header row with #f8f9fb background, 11px MiSans weight 400 #273951. Rows with 1px #e5edf5 bottom border. Cell text 14px MiSans weight 300 #061b31. Hover row #f8f9fb. Numeric columns use Geist Mono weight 500 with tnum."
- "Create a success badge: rgba(21,190,83,0.2) background, #108c3d text, 4px radius, 1px 6px padding, 10px MiSans weight 300."

### Iteration Guide
1. Heading color is always `#061b31` (deep navy), body is `#64748d` (slate)
2. Weight 300 is the default; use 400 only for buttons/labels/navigation
3. Shadow formula: `rgba(50,50,93,0.25) Y1 B1 -S1, rgba(0,0,0,0.1) Y2 B2 -S2`
4. Border-radius stays in 4px-8px range
5. Use `"tnum"` for dashboard stats and financial numbers
6. Sidebar is dark (`#1c1e54`), content area is light (`#ffffff` / `#f8f9fb`)
7. MiSans for text, Geist Mono for data numbers
