// lib/property-constants.ts
// Lightweight shared types & constants extracted from mock-data.ts.
//
// WHY: components only need `Property` / `cityList` / `propertyTypeLabels`,
// but importing them from mock-data.ts dragged the ~380KB `mockProperties`
// array into the bundle. Keeping these here lets components import the small
// stuff without pulling in the heavy dataset. The big `mockProperties` array
// stays in mock-data.ts and is now loaded via dynamic import() only where used.
import { PropertyType, DynamicIndicators } from "@/types/indicators";

export interface Property {
  id: string;
  projectName: string;
  city: string;
  district: string;
  rawAddress: string;
  propertyType: PropertyType;
  faceRent: number;
  dataSource: string;
  isUnlocked: boolean;
  area: number;
  updatedAt: string;
  dynamicIndicators: DynamicIndicators;
}

export const cityList: string[] = ["上海", "北京", "广州", "成都", "杭州", "深圳", "苏州", "西安", "长沙"];

export const propertyTypeLabels: Record<PropertyType, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };
