// Mock "twilio"
export default function Twilio(_sid: string, _token: string) {
  return {
    messages: {
      create: async (_opts: any) => ({ sid: "test-sms-123" }),
    },
  };
}
