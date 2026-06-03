import { NextRequest, NextResponse } from "next/server";
import { Prisma, PrismaClient, PropertyType } from "@prisma/client";

const prisma = new PrismaClient();

type AgentPropertyType = "OFFICE" | "SHOPS" | "INDUSTRIAL";

interface AgentPayloadItem {
  projectName: string;
  city: string;
  district: string;
  rawAddress: string;
  propertyType: AgentPropertyType;
  faceRent: number;
  dataSource: string;
  dynamicIndicators: Record<string, unknown>;
  agentTimestamp: string;
  idempotencyKey: string;
}

interface BulkUpsertRequestBody {
  items: AgentPayloadItem[];
}

const isPropertyType = (value: string): value is AgentPropertyType => {
  return value === "OFFICE" || value === "SHOPS" || value === "INDUSTRIAL";
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidAgentPayloadItem = (value: unknown): value is AgentPayloadItem => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isNonEmptyString(candidate.projectName) &&
    isNonEmptyString(candidate.city) &&
    isNonEmptyString(candidate.district) &&
    isNonEmptyString(candidate.rawAddress) &&
    isNonEmptyString(candidate.propertyType) &&
    isPropertyType(candidate.propertyType) &&
    typeof candidate.faceRent === "number" &&
    Number.isFinite(candidate.faceRent) &&
    isNonEmptyString(candidate.dataSource) &&
    typeof candidate.dynamicIndicators === "object" &&
    candidate.dynamicIndicators !== null &&
    !Array.isArray(candidate.dynamicIndicators) &&
    isNonEmptyString(candidate.agentTimestamp) &&
    isNonEmptyString(candidate.idempotencyKey)
  );
};

const unauthorizedResponse = () => {
  return NextResponse.json(
    {
      success: false,
      error: "UNAUTHORIZED_AGENT_ACCESS",
    },
    {
      status: 401,
    }
  );
};

export async function POST(request: NextRequest) {
  const bearerHeader = request.headers.get("authorization");
  const expectedToken = process.env.AGENT_SYNC_TOKEN;

  if (!expectedToken || !bearerHeader || bearerHeader !== `Bearer ${expectedToken}`) {
    return unauthorizedResponse();
  }

  let body: BulkUpsertRequestBody;

  try {
    body = (await request.json()) as BulkUpsertRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_JSON_PAYLOAD",
      },
      {
        status: 400,
      }
    );
  }

  if (!body || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      {
        success: false,
        error: "EMPTY_AGENT_BATCH",
      },
      {
        status: 400,
      }
    );
  }

  const invalidItemIndex = body.items.findIndex((item) => !isValidAgentPayloadItem(item));

  if (invalidItemIndex !== -1) {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_AGENT_BATCH_ITEM",
        invalidItemIndex,
      },
      {
        status: 400,
      }
    );
  }

  const upsertedIds = await prisma.$transaction(
    body.items.map((item) => {
      const normalizedTimestamp = new Date(item.agentTimestamp);
      const agentUpdatedAt = Number.isNaN(normalizedTimestamp.getTime()) ? new Date() : normalizedTimestamp;
      const dynamicIndicators = item.dynamicIndicators as Prisma.InputJsonValue;

      return prisma.commercialProperty.upsert({
        where: {
          projectName_rawAddress: {
            projectName: item.projectName.trim(),
            rawAddress: item.rawAddress.trim(),
          },
        },
        update: {
          city: item.city.trim(),
          district: item.district.trim(),
          propertyType: item.propertyType as PropertyType,
          faceRent: item.faceRent,
          dataSource: item.dataSource.trim(),
          dynamicIndicators,
          agentUpdatedAt,
        },
        create: {
          projectName: item.projectName.trim(),
          city: item.city.trim(),
          district: item.district.trim(),
          rawAddress: item.rawAddress.trim(),
          propertyType: item.propertyType as PropertyType,
          faceRent: item.faceRent,
          dataSource: item.dataSource.trim(),
          dynamicIndicators,
          agentUpdatedAt,
        },
        select: {
          id: true,
        },
      });
    })
  );

  return NextResponse.json(
    {
      success: true,
      received: body.items.length,
      upserted: upsertedIds.length,
      ids: upsertedIds.map((item) => item.id),
    },
    {
      status: 200,
    }
  );
}
