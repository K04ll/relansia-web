// Helpers si tu veux tester des handlers "purs" (pas besoin de serveur)
export function mockRequest(init?: RequestInit, url = "http://localhost/api") {
  return new Request(url, { method: "GET", ...init });
}
