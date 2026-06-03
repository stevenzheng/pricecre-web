# 技术架构与强类型契约文档 (ARCH.md)
# 版本：v3.7.0-PRO (一期租金大闭环、高性能防线与 Agent 批量幂等并网大合流)

## 1. 技术栈选型
- **前端框架**：Next.js 14 (App Router) + React + TypeScript。
- **UI 与样式规范**：Tailwind CSS + Shadcn/UI (仅处理 Dialog 弹窗与 Select 下拉)。全部使用 Tailwind 原子类强制还原 BitMart 金融终端美学。
- **状态管理**：Zustand (用于客户端全局缓存城市、用户额度状态)。
- **全栈连接器时序规则**：
  - **客户端运行 (`"use client"`)**：处理动态交互与视觉呈现（如 useReducer 状态流转、useMemo 算力算力缓存、自适应布局）。
  - **服务端运行 (`"use server"`)**：处理核心数据流控与资产安全防线（Server Action）。在同一次数据库事务（`$transaction`）中直接读取核心数据，物理打码重写未解锁字段为 `null`，一次性返回给前端，消除二次往返延迟。

## 2. 生产环境持久化数据底座 (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN_DATA
  ADMIN_FINANCE
  SUPER_ADMIN
}

enum PropertyType {
  OFFICE
  SHOPS
  INDUSTRIAL
}

model User {
  id                String        @id @default(uuid())
  email             String?       @unique
  phone             String?       @unique
  wechatOpenId      String?       @unique
  password          String?       
  role              Role          @default(USER) 
  vipLevel          Int           @default(0) 
  vipExpireTime     DateTime?     
  purchasedViewCount Int          @default(0)    
  referralViewCount Int           @default(3)    
  myReferralCode    String        @unique 
  createdAt         DateTime      @default(now())
  orders            Order[]
  viewLogs          UserViewLog[]
}

model FieldMetadata {
  id            String       @id @default(uuid())
  fieldKey      String       
  fieldName     String       
  fieldType     String       
  moduleType    PropertyType 
  isDisplayed   Boolean      @default(true)  
  isLocked      Boolean      @default(true)  
  sortOrder     Int          @default(0)     
  updatedAt     DateTime     @updatedAt

  @@unique([fieldKey, moduleType]) 
}

model Referral {
  id            String   @id @default(uuid())
  referrerId    String   
  refereeId     String   @unique 
  rewardGranted Boolean  @default(false) 
  createdAt     DateTime @default(now())
}

model Order {
  id            String    @id @default(uuid())
  orderNo       String    @unique 
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  productType   Int       
  amount        Decimal   @db.Decimal(10, 2)
  paymentMethod String    
  status        Int       @default(0) 
  tradeNo       String?   
  paidAt        DateTime?
  createdAt     DateTime  @default(now())
}

model UserViewLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId  String   
  viewedAt    DateTime @default(now())

  @@unique([userId, propertyId]) 
  @@index([userId, propertyId, viewedAt])
}

model CommercialProperty {
  id                 String       @id @default(uuid())
  projectName        String   
  city               String
  district           String
  rawAddress         String
  propertyType       PropertyType 
  faceRent           Decimal      @db.Decimal(10, 2) 
  dataSource         String   
  dynamicIndicators  Json         
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  agentUpdatedAt     DateTime     @default(now()) 

  @@unique([projectName, rawAddress]) 
}
```

## 3. 动态指标 JSONB 终极强类型数据契约 (`/types/indicators.ts`)
```typescript
export interface DynamicIndicatorsContract {
  netEffectiveRent?: number;       
  capRate?: number;                
  priceToRentRatio?: number;       
  wale?: number;                   
  retentionRate?: number;          
  tenantConcentration?: number;    
  netAbsorption?: number;          
  reversionRate?: number;          
  spaceUtilization?: number;       
  salesEfficiency?: number;        
  rentToSalesRatio?: number;       
  footfallTicketSize?: string;     
  esgCertification?: string;       
  landFloorPrice?: number;         
  capexIntensity?: number;         
  npiMargin?: number;              
  collectionRate?: number;         
  compTxPrice?: number;            
  noiCagr3Y?: number;              
  submarketVacancy?: number;       
  policyIncentiveLevel?: number;   
  yieldSpread?: number;            
  kolBuzzIndex?: number;            
  negativeSentimentRate?: number;   
  employeeHappinessScore?: number;  
  electricityOutputRatio?: number;  
  taxCovenantRate?: number;         
  loadingDockRatio?: number;        
  anchorDependency?: number;        
  merchantChurnRate?: number;       
  netCorporateMigration?: number;   
  hqSupplyChainRatio?: number;      
  corporateInquiryIndex?: number;    
  firstStoreRatio?: number;         
  openToCloseRatio?: number;        
  culturalRadianceLevel?: number;   
  footfallPulseRate?: number;       
  culturalPremiumScore?: number;    
  pmOperatorTier?: number;          
  facilitySlaRating?: number;       
  maintenanceScore?: number;        
  ltvRatio?: number;                
  debtYield?: number;               
  cashOnCashReturn?: number;        
  projectedIrr5Y?: number;          
  tradeAreaPopulation?: number;     
  demographicPremiumScore?: number; 
}
```
