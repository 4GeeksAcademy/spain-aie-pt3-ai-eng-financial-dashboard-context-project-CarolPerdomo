import type {
  BusinessType,
  Category,
  FinancialMovement,
  OperationType,
} from "./financial-types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const OPERATION_TYPES: readonly OperationType[] = ["income", "outcome"];
const CATEGORIES: readonly Category[] = [
  "suppliers",
  "sales",
  "operational",
  "administrative",
  "others",
];
const BUSINESS_TYPES: readonly BusinessType[] = ["B2B", "B2C"];

function isOneOf<const Values extends readonly string[]>(
  value: unknown,
  values: Values,
): value is Values[number] {
  return typeof value === "string" && values.includes(value);
}

function isISODate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function isFinancialMovement(value: unknown): value is FinancialMovement {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const movement = value as Record<string, unknown>;
  return (
    isISODate(movement.create_date) &&
    typeof movement.amount === "number" &&
    Number.isFinite(movement.amount) &&
    isOneOf(movement.operation_type, OPERATION_TYPES) &&
    isOneOf(movement.category, CATEGORIES) &&
    isOneOf(movement.business_type, BUSINESS_TYPES)
  );
}

export async function fetchFinancialData(): Promise<FinancialMovement[]> {
  const response = await fetch(`${API_BASE_URL}/api/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch financial data: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new TypeError("Invalid financial metrics response");
  }

  const movements: FinancialMovement[] = [];
  for (const item of payload) {
    if (!isFinancialMovement(item)) {
      throw new TypeError("Invalid financial metrics response");
    }
    movements.push(item);
  }

  return movements;
}