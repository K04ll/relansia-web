import { vi } from "vitest";
import { createMockClient } from "./__mocks__/supabaseAdmin.mock";

vi.mock("@/lib/supabaseAdmin", () => {
  const client = createMockClient();
  return {
    createClient: () => client,
    // expose pour inspection côté tests
    __mock: client
  };
});
