# PriceCRE 代码审查标准与流程

**版本**: v1.0  
**生效日期**: 2026-06-07  
**维护者**: PriceCRE Team

---

## 一、代码审查标准 (Code Review Standards)

### 1.1 审查维度与优先级

#### 🔴 P0 - 阻断性要求 (Blocking)
**必须修复后才能合并**，否则不能上线：

1. **安全漏洞**
   - SQL注入、XSS、CSRF、未授权访问
   - 敏感数据泄露（API密钥、密码明文）
   - 权限绕过（如 save-report API 未鉴权）

2. **数据完整性风险**
   - 数据库事务缺失导致数据不一致
   - 并发问题（竞态条件、丢失更新）
   - 错误被静默忽略导致数据损坏

3. **关键功能缺陷**
   - 核心业务流程崩溃
   - 支付/扣款逻辑错误
   - 用户数据丢失

#### 🟡 P1 - 建议性要求 (Suggested)
**应该修复**，可先上线但需创建跟进任务：

1. **代码质量**
   - 重复代码、过长函数（>100行）
   - 复杂度过高的函数（圈复杂度>10）
   - 魔法数字、硬编码字符串

2. **性能问题**
   - N+1查询、缺少索引
   - 大文件/大对象内存占用过高
   - 不必要的全表扫描

3. **可维护性**
   - 缺少类型定义（any类型滥用）
   - 函数命名不清晰
   - 注释缺失或过期

#### 💭 P2 - 建议性优化 (Nit)
**可以稍后优化**，不阻塞上线：

1. **代码风格**
   - 格式化不一致（应有ESLint/Prettier自动处理）
   - 变量命名风格差异

2. **文档**
   - 缺少JSDoc注释
   - README过时

---

### 1.2 审查检查清单 (Review Checklist)

#### 后端API审查要点

```markdown
### 安全审查
- [ ] 所有API端点都有鉴权检查（NextAuth session或API Token）
- [ ] 输入验证：参数类型、范围、格式检查
- [ ] SQL注入防护：使用Prisma参数化查询，不拼接字符串
- [ ] 错误响应：不泄露敏感信息（stack trace、内部路径）
- [ ] 权限检查：用户只能访问自己的数据

### 业务逻辑审查
- [ ] 边界条件处理：空值、零值、最大值
- [ ] 并发安全：多个请求同时修改同一数据
- [ ] 事务完整性：多步操作失败时的回滚
- [ ] 幂等性：重复调用不会产生副作用

### 性能审查
- [ ] 数据库查询：避免N+1，检查索引
- [ ] 响应时间：API是否在500ms内返回
- [ ] 内存使用：大数组/对象是否分页处理
```

#### 前端组件审查要点

```markdown
### 安全审查
- [ ] XSS防护：用户输入正确转义（React自动转义JSX）
- [ ] 敏感数据：不在客户端存储密码、token
- [ ] URL参数：不直接使用window.location without validation

### 状态管理审查
- [ ] 状态一致性：Server state vs Client state同步逻辑
- [ ] 竞态条件：多个异步请求同时更新状态
- [ ] 内存泄漏：useEffect清理函数、事件监听器移除

### UI/UX审查
- [ ] 加载状态：异步操作有loading提示
- [ ] 错误处理：API失败有用户友好提示
- [ ] 响应式：移动端和桌面端都可用
```

---

## 二、代码审查流程 (Code Review Process)

### 2.1 流程概览

```
开发者提交PR
    ↓
CI自动检查（ESLint、TypeScript、单元测试）
    ↓
分配Reviewer（至少1人，建议2人）
    ↓
Reviewer审查代码（24小时内完成）
    ↓
审查意见分类：
  - 🔴 阻断性问题 → 开发者修复 → 重新审查
  - 🟡 建议性问题 → 创建跟进任务或立即修复
  - 💭 Nit → 记录但不阻塞
    ↓
所有🔴问题解决 → Approve → 合并到主分支
```

---

### 2.2 角色与职责

#### 开发者 (Developer)
- **提交前自查**：使用Checklist自查代码质量
- **写清楚PR描述**：说明改了什么、为什么改、如何测试
- **回应审查意见**：24小时内回应，讨论不同方案
- **修复问题**：按优先级修复，更新PR

#### 审查者 (Reviewer)
- **及时审查**：24小时内完成首次审查
- **提供具体反馈**：指出问题+原因+建议方案
- **区分优先级**：明确标记🔴/🟡/💭
- **教学而非指责**：解释"为什么"，帮助开发者成长

#### 团队Leader
- **最终决策**：当开发者和审查者无法达成一致时仲裁
- **流程优化**：定期回顾审查效率，调整标准

---

### 2.3 PR提交规范

#### PR标题格式
```
[模块] 简短描述 (#Issue号)
例: [Auth] 修复未登录用户可访问API的漏洞 (#1)
```

#### PR描述模板
见 `.github/pull_request_template.md`

---

### 2.4 审查意见格式

**标准格式**：

```
### 🔴 [优先级] [分类] 问题标题
**文件**: `path/to/file.ts:行号`  
**代码**:
```typescript
// 有问题的代码
```

**问题**:  
- 具体说明哪里有问题
- 可能导致什么后果

**风险**: 高危/中危/低危 - 具体风险描述

**建议修复**:
```typescript
// 修复后的代码
```
```

**示例**（好的审查意见）：
```
### 🔴 [P0-Security] API未鉴权，任何人可写入数据
**文件**: `app/api/ai/save-report/route.ts:5`

**问题**:  
- POST /api/ai/save-report 没有检查用户登录状态
- 攻击者可伪造email参数，写入任意报告到数据库
- 可能导致存储攻击（数据库爆满）

**风险**: 高危 - 未授权数据写入

**建议修复**:
```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```
```

---

## 三、工具与自动化

### 3.1 推荐的审查工具链

| 工具 | 用途 | 配置建议 |
|------|------|---------|
| **GitHub PR** | 代码对比、审查意见 | 开启"Require review"分支保护 |
| **ESLint** | 代码风格、常见错误 | 集成到CI，失败则阻断合并 |
| **TypeScript** | 类型检查 | `strict: true`，0 any容忍度 |
| **Jest** | 单元测试 | 覆盖率阈值>60% |
| **SonarQube** | 代码质量、安全漏洞 | 检测复杂度、重复代码 |

### 3.2 CI/CD集成

```yaml
# .github/workflows/pr-check.yml
name: PR Check
on: [pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run lint        # ESLint检查
      - run: npm run type-check  # TypeScript检查
      - run: npm run test        # 单元测试
      - run: npm run build       # 构建检查
```

---

## 四、审查效率提升建议

### 4.1 Small PR原则
- **PR大小**: 单次审查不超过500行代码
- **聚焦单一改动**: 一个PR只做一件事（修复Bug OR 新增功能 OR 重构）
- **拆分大型改动**: 重构+新功能应该分两个PR

### 4.2 审查时间分配
- **首次快速浏览** (5分钟): 了解改动范围和意图
- **深度审查** (15-30分钟): 逐文件检查关键逻辑
- **测试验证** (10分钟): 拉取代码手动测试核心流程

### 4.3 常见审查反模式（避免）
❌ **风格警察**: 纠结于缩进、命名风格等可自动化问题  
❌ **完美主义**: 要求开发者一次性解决所有技术问题  
❌ **被动攻击**: "这代码真烂" → 应该具体说明问题  
❌ **批准即忘**: Approve后不再关注是否真正修复  

---

## 五、实施计划

### 第一阶段 (本周): 建立基础
- [ ] 收集团队反馈，调整本文档标准
- [ ] 在GitHub开启分支保护（main分支需要PR审查）
- [ ] 配置ESLint + TypeScript严格模式

### 第二阶段 (下周): 工具落地
- [ ] 搭建CI流水线（lint + test + build）
- [ ] 创建PR模板和Checklist
- [ ] 团队培训：如何写好的审查意见

### 第三阶段 (本月): 持续改进
- [ ] 每周回顾：审查效率指标（平均审查时间、PR大小）
- [ ] 月度总结：常见错误模式，更新审查标准
- [ ] 引入自动化工具（SonarQube或类似）

---

## 附录: 审查意见示例对比

### ✅ 好的审查意见
```
🔴 Security: API未鉴权，任何人可写入数据
文件: app/api/ai/save-report/route.ts:5

问题: 
- POST /api/ai/save-report 没有检查用户登录状态
- 攻击者可伪造email参数，写入任意报告到数据库
- 可能导致存储攻击（数据库爆满）

风险: 高危 - 未授权数据写入

建议修复:
```typescript
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```
```

### ❌ 不好的审查意见
```
这个API没加鉴权，有问题，加上吧。
```
（太模糊，没说明严重程度和具体修复方案）

---

**文档维护**: 本文档应每季度回顾一次，根据团队反馈和实际案例更新。  
**反馈渠道**: 有任何建议请在GitHub Discussions提出或联系 @stevenzheng
