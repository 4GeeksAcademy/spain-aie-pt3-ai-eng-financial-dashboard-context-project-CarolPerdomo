import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchFinancialData } from "./financial-api";

const validMovement = {
  create_date: "2024-01-10",
  amount: 1000,
  operation_type: "income",
  category: "sales",
  business_type: "B2B",
};

function mockMetricsResponse(payload: unknown): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchFinancialData", () => {
  it("returns valid /api/metrics movements", async () => {
    mockMetricsResponse([validMovement]);

    await expect(fetchFinancialData()).resolves.toEqual([validMovement]);
  });

  it.each([
    ["a non-array payload", { movements: [validMovement] }],
    ["a missing required field", [{
      create_date: validMovement.create_date,
      operation_type: validMovement.operation_type,
      category: validMovement.category,
      business_type: validMovement.business_type,
    }]],
    ["a null amount", [{ ...validMovement, amount: null }]],
    ["an unsupported operation type", [{ ...validMovement, operation_type: "refund" }]],
    ["an unsupported category", [{ ...validMovement, category: "travel" }]],
    ["an unsupported business type", [{ ...validMovement, business_type: "B2G" }]],
    ["an invalid calendar date", [{ ...validMovement, create_date: "2024-02-30" }]],
  ])("rejects %s", async (_description, payload) => {
    mockMetricsResponse(payload);

    await expect(fetchFinancialData()).rejects.toThrow(
      "Invalid financial metrics response",
    );
  });
});