// agent/platforms.md
// ============================================================
// PriceCRE Agent — 跨平台对接指南
//
// 使本 Agent 可被 OpenClaw / Hermes / Dify / Coze 等任何
// AI Agent 平台调用
// ============================================================

/*
╔═══════════════════════════════════════════════════════════╗
║          PriceCRE Agent v5.0 — 跨平台调用方案总览          ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  1. 启动 API 服务端:  npx tsx agent/server.ts             ║
║     └─ http://localhost:3456/api/agent/v1/*                ║
║                                                           ║
║  2. 启动 MCP Server:  npx tsx agent/mcp-server.ts          ║
║     └─ stdout MCP 协议 → 任何 MCP 兼容客户端              ║
║                                                           ║
║  3. 工具定义: agent/tools.ts 包含所有标准格式              ║
║     └─ OpenAI Function Calling / Claude Tool Use / MCP     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
*/

// ════════════════════════════════════════════════════════
// 1. OpenClaw 对接
// ════════════════════════════════════════════════════════
/*
OpenClaw 支持自定义 Tool/Action。配置方式：

### 方式 A: HTTP API 模式（推荐）
1. 启动 API 服务: npx tsx agent/server.ts
2. 在 OpenClaw 中注册自定义 Action：

```json
{
  "actions": [{
    "name": "pricecre_crawl",
    "url": "http://localhost:3456/api/agent/v1/crawl",
    "method": "POST",
    "headers": { "Content-Type": "application/json" },
    "body": {
      "city": "{{city}}",
      "platform": "{{platform}}",
      "propertyType": "{{propertyType}}",
      "maxResults": 30
    }
  }]
}
```

### 方式 B: Stdio MCP 模式
在 OpenClaw 配置中添加 MCP Server：

```json
{
  "mcpServers": {
    "pricecre": {
      "command": "npx",
      "args": ["tsx", "agent/mcp-server.ts"],
      "cwd": "/Users/stevenair/Desktop/Pricecre.WB",
      "env": {
        "AGENT_SYNC_TOKEN": "your-token"
      }
    }
  }
}
```

然后 OpenClaw 会自动发现 pricecre_crawl_properties / pricecre_run_pipeline / pricecre_get_status 三个工具。

*/

// ════════════════════════════════════════════════════════
// 2. Hermes 对接
// ════════════════════════════════════════════════════════
/*
Hermes 支持通过 MCP 或自定义 Plugin 调用外部工具。

### MCP 配置
在 Hermes 的 mcp.json 配置文件中：

```json
{
  "mcpServers": {
    "pricecre": {
      "command": "npx",
      "args": ["tsx", "agent/mcp-server.ts"],
      "cwd": "/Users/stevenair/Desktop/Pricecre.WB"
    }
  }
}
```

### HTTP API 配置
在 Hermes 中注册为自定义 Plugin：

```yaml
# hermes_tools.yaml
tools:
  - name: pricecre_crawl_properties
    description: 爬取商业地产租金数据
    endpoint: http://localhost:3456/api/agent/v1/crawl
    method: POST
    parameters:
      - name: city
        type: string
        required: true
        enum: [shanghai, beijing, shenzhen, guangzhou, hangzhou, chengdu, suzhou, changsha, xian]
      - name: platform
        type: string
        default: beike
```

*/

// ════════════════════════════════════════════════════════
// 3. Dify 对接
// ════════════════════════════════════════════════════════
/*
Dify 通过"自定义工具"对接外部 API。

### 配置步骤:
1. Dify → 工具 → 创建自定义工具 → OpenAPI/Swagger
2. 粘贴 OpenAPI 规范（见 agent/tools.ts 中的 openApiSpec 函数）
3. 或手动配置：

工具名称: PriceCRE 租金爬取
API端点: POST http://localhost:3456/api/agent/v1/crawl

参数:
| 参数名       | 类型   | 必填 | 说明         |
|-------------|--------|------|-------------|
| city        | string | ✅    | 城市英文名   |
| platform    | string | ❌    | 平台名       |
| propertyType| string | ❌    | 物业类型     |
| maxResults  | number | ❌    | 最大30       |

### 如果需要公网访问（Dify Cloud → 本地 Agent）:
使用 ngrok/Cloudflare Tunnel 暴露本地 3456 端口：
  ngrok http 3456
  # 然后在 Dify 中填入 ngrok 提供的 https URL
*/

// ════════════════════════════════════════════════════════
// 4. Coze（扣子）对接
// ════════════════════════════════════════════════════════
/*
Coze 通过"插件"系统对接外部 API。

### 配置步骤:
1. Coze → 插件 → 创建插件
2. 填入 OpenAPI/Swagger JSON（运行: npx tsx agent/tools.ts 生成）
3. 如果本地运行，可用 ngrok 暴露：
   ngrok http 3456
   然后将 ngrok URL 填入插件的服务器地址

### 插件 manifest 示例:
```json
{
  "openapi": "3.0.3",
  "info": { "title": "PriceCRE", "version": "5.0.0" },
  "servers": [{ "url": "https://your-ngrok-url.ngrok-free.app" }],
  "paths": {
    "/api/agent/v1/crawl": {
      "post": {
        "operationId": "crawlProperties",
        "summary": "爬取商业地产租金数据",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "city": { "type": "string" },
                  "platform": { "type": "string" }
                },
                "required": ["city"]
              }
            }
          }
        }
      }
    }
  }
}
```
*/

// ════════════════════════════════════════════════════════
// 5. LangChain / CrewAI 对接
// ════════════════════════════════════════════════════════
/*
使用 agent/tools.ts 中的 langchainTools 函数生成 LangChain 兼容工具。

```typescript
import { langchainTools } from "./agent/tools";

const tools = langchainTools("http://localhost:3456");

// 注册到 Agent
const agent = createOpenAIToolsAgent({
  llm,
  tools,
  prompt,
});
```

### CrewAI (Python) 对接:
```python
from crewai import Task, Crew

crawl_task = Task(
    description="爬取上海陆家嘴办公租金数据",
    expected_output="结构化租金JSON",
    tools=[{
        "name": "pricecre_crawl",
        "description": "爬取商业地产租金",
        "func": lambda **kwargs: requests.post(
            "http://localhost:3456/api/agent/v1/crawl",
            json=kwargs
        ).json()
    }]
)
```
*/

// ════════════════════════════════════════════════════════
// 6. Claude Desktop 对接（官方 MCP）
// ════════════════════════════════════════════════════════
/*
在 Claude Desktop 的配置文件中:
  macOS: ~/Library/Application Support/Claude/claude_desktop_config.json

```json
{
  "mcpServers": {
    "pricecre": {
      "command": "npx",
      "args": ["tsx", "agent/mcp-server.ts"],
      "cwd": "/Users/stevenair/Desktop/Pricecre.WB"
    }
  }
}
```

重启 Claude Desktop 后，输入提示词即可调用:
  "帮我爬取北京朝阳区的写字楼租金数据"
  Claude 会自动调用 pricecre_crawl_properties 工具。
*/

// ════════════════════════════════════════════════════════
// 7. Cursor / Windsurf 对接
// ════════════════════════════════════════════════════════
/*
在 .cursor/mcp.json 或项目级配置中添加:

```json
{
  "mcpServers": {
    "pricecre": {
      "command": "npx",
      "args": ["tsx", "agent/mcp-server.ts"],
      "cwd": "/Users/stevenair/Desktop/Pricecre.WB"
    }
  }
}
```
*/

// ════════════════════════════════════════════════════════
// 8. 通用 HTTP 调用（curl / Postman / 任何语言）
// ════════════════════════════════════════════════════════
/*
```bash
# 1. 启动服务
npx tsx agent/server.ts &

# 2. 检查状态
curl http://localhost:3456/api/agent/v1/status

# 3. 爬取上海贝壳数据
curl -X POST http://localhost:3456/api/agent/v1/crawl \
  -H "Content-Type: application/json" \
  -d '{"city":"shanghai","platform":"beike","propertyType":"OFFICE","district":"lujiazui","maxResults":10}'

# 4. 全管线 dry-run
curl -X POST http://localhost:3456/api/agent/v1/pipeline \
  -H "Content-Type: application/json" \
  -d '{"city":"shanghai","platform":"beike","limit":5}'
```

Python 示例:
```python
import requests

resp = requests.post(
    "http://localhost:3456/api/agent/v1/crawl",
    json={"city": "shanghai", "platform": "beike", "maxResults": 20}
)
data = resp.json()
for item in data.get("preview", []):
    print(f"{item['projectName']}: {item['faceRent']}")
```
*/

// ════════════════════════════════════════════════════════
// 附录: 快速启动流程
// ════════════════════════════════════════════════════════
/*
1. 启动 API 服务（基础）:
   npx tsx agent/server.ts
   → 所有平台通过 HTTP 调用 localhost:3456

2. 启动 MCP 服务（高级）:
   npx tsx agent/mcp-server.ts
   → 任何 MCP 兼容 AI 客户端自动发现工具

3. 生产部署（公网可达）:
   ngrok http 3456
   → 获得公网 URL: https://xxxx.ngrok-free.app
   → 填入任何 AI Agent 平台的 API 配置

4. 作为 Vercel API 路由部署:
   将 agent/server.ts 逻辑移到 app/api/agent/v1/crawl/route.ts
   即可作为 Next.js 项目的一部分部署到 Vercel
*/
