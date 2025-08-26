// Mock "resend"
export class Resend {
  constructor(_key: string) {}
  emails = {
    send: async (_opts: any) => ({ data: { id: "test-email-123" }, error: null }),
  };
}
export default { Resend };
