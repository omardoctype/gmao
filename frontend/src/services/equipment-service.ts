import { apiDeleteData, apiGetData, apiPostData, apiPutData } from "@/services/api";
import type { PageQueryParams, PagedResponse } from "@/types/api";
import type { Equipment, EquipmentPayload } from "@/types/equipment";

const EQUIPMENTS_API_BASE = "/api/equipments";

export type EquipmentOption = {
  id?: number;
  code: string;
  name: string;
};

export interface EquipmentListParams extends PageQueryParams {
  search?: string;
  name?: string;
  category?: string;
  status?: Equipment["status"];
  criticality?: Equipment["criticality"];
}

export function getEquipments(params?: EquipmentListParams): Promise<PagedResponse<Equipment>> {
  return apiGetData<PagedResponse<Equipment>>(EQUIPMENTS_API_BASE, { params });
}

export async function getEquipmentOptions(size = 200): Promise<Equipment[]> {
  const response = await getEquipments({ page: 0, size, sort: "name,asc" });
  return response.content;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function getTextField(record: UnknownRecord, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

function getOptionalId(record: UnknownRecord): number | undefined {
  const value = record.id;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function extractEquipmentItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!isRecord(payload)) {
    return [];
  }

  for (const key of ["content", "data", "items", "results"]) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value;
    }

    if (isRecord(value)) {
      const nestedItems = extractEquipmentItems(value);
      if (nestedItems.length > 0) {
        return nestedItems;
      }
    }
  }

  return [];
}

function toEquipmentOption(value: unknown): EquipmentOption | null {
  if (!isRecord(value)) {
    return null;
  }

  const code = getTextField(value, ["code", "equipmentCode"]);
  const name = getTextField(value, ["name", "equipmentName", "label", "designation"]);

  if (!code || !name) {
    return null;
  }

  return {
    id: getOptionalId(value),
    code,
    name,
  };
}

export async function getEquipmentSelectOptions(size = 200): Promise<EquipmentOption[]> {
  const response = await apiGetData<unknown>(EQUIPMENTS_API_BASE, {
    params: { page: 0, size, sort: "name,asc" },
  });

  return extractEquipmentItems(response).map(toEquipmentOption).filter((option): option is EquipmentOption => option !== null);
}

export function getEquipmentById(id: number): Promise<Equipment> {
  return apiGetData<Equipment>(`${EQUIPMENTS_API_BASE}/${id}`);
}

export function createEquipment(payload: EquipmentPayload): Promise<Equipment> {
  return apiPostData<Equipment, EquipmentPayload>(EQUIPMENTS_API_BASE, payload);
}

export function updateEquipment(id: number, payload: EquipmentPayload): Promise<Equipment> {
  return apiPutData<Equipment, EquipmentPayload>(`${EQUIPMENTS_API_BASE}/${id}`, payload);
}

export function deleteEquipment(id: number): Promise<null> {
  return apiDeleteData<null>(`${EQUIPMENTS_API_BASE}/${id}`);
}
