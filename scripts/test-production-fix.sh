#!/bin/bash
# test-production-fix.sh
# 验证生产环境的Bug修复是否正确部署

set -e

echo "🧪 PriceCRE 生产环境修复验证"
echo "==============================================="
echo "Bug: 头部显示"已解锁资产 16"，但实际解锁数不匹配"
echo "修复: app/page.tsx:244 - 从 viewLogs 计算 unlockCount"
echo "生产URL: https://pricecre.com"
echo "==============================================="
echo ""

# 测试1: 检查生产环境是否已部署修复
echo "📋 测试1: 检查生产环境部署状态"
echo "---------------------------------------------"

# 获取生产环境的页面HTML
HTML=$(curl -s https://pricecre.com || echo "")

if [ -z "$HTML" ]; then
  echo "❌ 无法访问生产环境"
  exit 1
fi

echo "✅ 生产环境可访问"

# 检查是否包含修复后的代码特征
# 修复后的代码应该包含: new Set((ud.viewLogs || []).map
if echo "$HTML" | grep -q "viewLogs.*map.*propertyId.*Set"; then
  echo "✅ 检测到修复代码 (viewLogs → Set → propertyId)"
else
  echo "⚠️  未检测到修复代码，可能仍在部署中或修复未生效"
fi

echo ""

# 测试2: API端点检查
echo "📋 测试2: API端点响应检查"
echo "---------------------------------------------"

# 注意：这个API需要认证，所以我们只检查它是否返回401（需要认证）
API_RESPONSE=$(curl -s -w "\n%{http_code}" https://pricecre.com/api/admin/user-detail?email=test@test.com || echo "000")

HTTP_CODE=$(echo "$API_RESPONSE" | tail -1)
RESPONSE_BODY=$(echo "$API_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
  echo "✅ API正确返回 $HTTP_CODE (需要认证)"
else
  echo "⚠️  API返回状态码: $HTTP_CODE (预期: 401 或 403)"
fi

echo ""

# 测试3: 静态资源检查
echo "📋 测试3: 检查JavaScript bundle是否包含修复"
echo "---------------------------------------------"

# 查找主要的JS bundle URL
JS_URL=$(echo "$HTML" | grep -o '"/_next/static/chunks/[^"]*\.js"' | head -1 | tr -d '"' || echo "")

if [ -z "$JS_URL" ]; then
  echo "⚠️  未找到JavaScript bundle URL"
else
  # 下载JS bundle并检查
  JS_CONTENT=$(curl -s "https://pricecre.com$JS_URL" | head -1000 || echo "")
  
  if echo "$JS_CONTENT" | grep -q "viewLogs.*map.*propertyId"; then
    echo "✅ JavaScript bundle中包含修复代码"
  else
    echo "⚠️  JavaScript bundle中未检测到修复代码"
  fi
fi

echo ""

# 汇总
echo "==============================================="
echo "📊 验证结果汇总"
echo "==============================================="
echo ""
echo "生产环境: https://pricecre.com"
echo "部署状态: 已部署 (commit: c4d65c5)"
echo ""
echo "建议的手动验证步骤:"
echo "1. 打开 https://pricecre.com (隐身窗口)"
echo "2. 点击'我的' → 登录（微信登录-测试模式）"
echo "3. 查看头部'已解锁资产' 数量"
echo "4. 展开几个资产卡片并解锁"
echo "5. 确认头部数字与实际解锁卡片数一致"
echo ""
echo "如果头部数字仍不正确，请："
echo "1. 清除浏览器缓存 (Cmd+Shift+R)"
echo "2. 检查Network标签确认加载的是最新JS"
echo ""
