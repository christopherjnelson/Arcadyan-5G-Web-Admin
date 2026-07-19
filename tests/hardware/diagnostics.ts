import type {
  BrowserContext,
  ConsoleMessage,
  Page,
  Request,
  Response,
  TestInfo,
} from "@playwright/test";

type JsonShape =
  | "null"
  | "string"
  | "number"
  | "boolean"
  | { array: JsonShape[] | "empty" }
  | { object: Record<string, JsonShape> };

export interface NetworkObservation {
  method: string;
  path: string;
  status?: number;
  contentType?: string;
  durationMs?: number;
  responseShape?: JsonShape;
  error?: string;
}

export interface BrowserDiagnostics {
  console: Array<{ type: string; text: string }>;
  network: NetworkObservation[];
  blockedMutations: string[];
}

export function describeJsonShape(value: unknown): JsonShape {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    const shapes = value.map(describeJsonShape);
    const uniqueShapes = [
      ...new Map(
        shapes.map((shape) => [JSON.stringify(shape), shape]),
      ).values(),
    ];
    return {
      array: value.length === 0 ? "empty" : uniqueShapes,
    };
  }
  if (typeof value === "object") {
    return {
      object: Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(
          ([childKey, child]) => [childKey, describeJsonShape(child)],
        ),
      ),
    };
  }
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "string";
}

function safePath(rawUrl: string): string {
  const url = new URL(rawUrl);
  const query = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    query.set(key, key === "get" || key === "set" ? value : "[redacted]");
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return `${url.pathname}${suffix}`;
}

function safeConsoleMessage(message: ConsoleMessage): string {
  const location = message.location();
  const source = location.url ? safePath(location.url) : "browser";
  // Console text may contain response bodies or identifiers. Record only a
  // bounded classification, never the raw message.
  return `${source}: ${message.type()} message (${message.text().length} chars)`;
}

export function isAllowedMethodAndPath(
  method: string,
  rawUrl: string,
): boolean {
  if (method === "GET") return true;
  const url = new URL(rawUrl);
  return (
    method === "POST" && url.pathname === "/api/auth/login" && url.search === ""
  );
}

function isAllowedRequest(request: Request): boolean {
  return isAllowedMethodAndPath(request.method(), request.url());
}

export async function installReadOnlyDiagnostics(
  context: BrowserContext,
  page: Page,
): Promise<BrowserDiagnostics> {
  const diagnostics: BrowserDiagnostics = {
    console: [],
    network: [],
    blockedMutations: [],
  };
  const startedAt = new WeakMap<Request, number>();
  const blockedRequests = new WeakSet<Request>();

  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!isAllowedRequest(request)) {
      const label = `${request.method()} ${safePath(request.url())}`;
      diagnostics.blockedMutations.push(label);
      blockedRequests.add(request);
      await route.abort("blockedbyclient");
      return;
    }
    startedAt.set(request, Date.now());
    await route.continue();
  });

  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      diagnostics.console.push({
        type: message.type(),
        text: safeConsoleMessage(message),
      });
    }
  });

  page.on("requestfailed", (request) => {
    if (blockedRequests.has(request)) {
      return;
    }
    diagnostics.network.push({
      method: request.method(),
      path: safePath(request.url()),
      durationMs: Date.now() - (startedAt.get(request) ?? Date.now()),
      error: request.failure()?.errorText ?? "request failed",
    });
  });

  page.on("response", async (response: Response) => {
    const request = response.request();
    const observation: NetworkObservation = {
      method: request.method(),
      path: safePath(response.url()),
      status: response.status(),
      contentType: response.headers()["content-type"] ?? "missing",
      durationMs: Date.now() - (startedAt.get(request) ?? Date.now()),
    };

    if (request.method() === "GET" && response.url().includes("/api/")) {
      try {
        observation.responseShape = describeJsonShape(await response.json());
      } catch {
        observation.error = "response was not parseable JSON";
      }
    }
    diagnostics.network.push(observation);
  });

  return diagnostics;
}

export async function attachDiagnostics(
  diagnostics: BrowserDiagnostics,
  testInfo: TestInfo,
): Promise<void> {
  await testInfo.attach("sanitized-browser-diagnostics", {
    body: Buffer.from(JSON.stringify(diagnostics, null, 2)),
    contentType: "application/json",
  });
}
