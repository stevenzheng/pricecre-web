// scripts/verify-unlock-count-fix.ts
// 验证 "已解锁资产" 显示错误的Bug修复

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 测试1: 静态代码验证 - 确认Bug已修复
 * 检查 app/page.tsx 中是否还有 viewCount 误用的代码
 */
function testStaticCodeCheck(): boolean {
  console.log('\n📋 测试1: 静态代码检查');
  console.log('='.repeat(50));
  
  const pageSize = join(process.cwd(), 'app/page.tsx');
  const content = readFileSync(pageSize, 'utf-8');
  
  // 检查是否还有错误的 viewCount 赋值给 unlockCount
  const bugPattern = /unlockCount:\s*ud\.viewCount/;
  const hasBug = bugPattern.test(content);
  
  if (hasBug) {
    console.log('❌ Bug仍然存在: unlockCount 被错误地赋值为 ud.viewCount');
    return false;
  }
  
  // 检查是否正确使用了 unlockCount
  const fixPattern = /unlockCount:\s*ud\.unlockCount/;
  const hasFix = fixPattern.test(content);
  
  if (!hasFix) {
    console.log('❌ 修复不存在: 未找到 ud.unlockCount 的使用');
    return false;
  }
  
  console.log('✅ 静态代码检查通过');
  console.log('   - 未检测到 viewCount 误用');
  console.log('   - 检测到正确的 unlockCount 使用');
  return true;
}

/**
 * 测试2: API响应结构验证
 * 检查 /api/admin/user-detail 返回的数据结构
 */
async function testApiResponseStructure(): Promise<boolean> {
  console.log('\n📋 测试2: API响应结构验证');
  console.log('='.repeat(50));
  
  try {
    // 注意：这个API需要认证，所以我们只检查代码结构
    const apiPath = join(process.cwd(), 'app/api/admin/user-detail/route.ts');
    const content = readFileSync(apiPath, 'utf-8');
    
    // 检查API是否返回 unlockCount 字段
    if (!content.includes('unlockCount')) {
      console.log('❌ API未返回 unlockCount 字段');
      return false;
    }
    
    console.log('✅ API响应结构验证通过');
    console.log('   - API代码中包含 unlockCount 字段');
    return true;
  } catch (error: any) {
    console.log('⚠️ 无法读取API文件:', error.message);
    return false;
  }
}

/**
 * 测试3: 组件渲染逻辑验证
 * 检查头部统计栏是否正确显示 unlockCount
 */
function testComponentRenderLogic(): boolean {
  console.log('\n📋 测试3: 组件渲染逻辑验证');
  console.log('='.repeat(50));
  
  const pageSize = join(process.cwd(), 'app/page.tsx');
  const content = readFileSync(pageSize, 'utf-8');
  
  // 检查头部统计栏是否使用 creditStats.unlockCount
  const headerPattern = /creditStats\.unlockCount/;
  const hasHeaderUsage = headerPattern.test(content);
  
  if (!hasHeaderUsage) {
    console.log('❌ 头部统计栏未使用 creditStats.unlockCount');
    return false;
  }
  
  console.log('✅ 组件渲染逻辑验证通过');
  console.log('   - 头部统计栏使用 creditStats.unlockCount');
  return true;
}

/**
 * 主测试函数
 */
async function main() {
  console.log('🧪 PriceCRE Bug修复验证测试');
  console.log('='.repeat(60));
  console.log('Bug: 头部显示"已解锁资产 16"，但实际解锁数不匹配');
  console.log('修复: app/page.tsx:244 - viewCount → unlockCount');
  console.log('='.repeat(60));
  
  const results: boolean[] = [];
  
  // 运行测试
  results.push(testStaticCodeCheck());
  results.push(await testApiResponseStructure());
  results.push(testComponentRenderLogic());
  
  // 汇总结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 测试结果汇总');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`通过: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('✅ 所有测试通过 - Bug修复验证成功！');
    process.exit(0);
  } else {
    console.log('❌ 部分测试失败 - 请检查修复是否正确');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});
