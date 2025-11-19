import type { ExecutionContext } from "@cloudflare/workers-types";
import { z, ZodError } from "zod";
import {
  DnsClient,
  flattenRecords,
  type DnsAnswer,
  type DnsQueryFlag,
  type FlatDnsRecord,
  type RecordType,
} from "@aoxborrow/dns-client";

// global Buffer polyfill
import { Buffer as BufferPolyfill } from "buffer";
if (typeof (globalThis as any).Buffer === "undefined") {
  (globalThis as any).Buffer = BufferPolyfill;
}

// Add base64url encoding support to Buffer (needed for DoH)
const originalToString = BufferPolyfill.prototype.toString;
BufferPolyfill.prototype.toString = function (
  encoding?: any,
  start?: number,
  end?: number
): string {
  if (encoding === "base64url") {
    const base64 = originalToString.call(this, "base64", start, end);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }
  return originalToString.call(this, encoding, start, end);
};

export interface Env {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
}

// Schema
const dnsQuerySchema = z.object({
  domain: z.string().min(1),
  nameserver: z.string().min(1),
  recordTypes: z.array(z.string()).min(1),
  dnssec: z.boolean().default(false),
  transport: z.enum(["tcp", "doh"]).default("tcp"),
});

type DnsQuery = z.infer<typeof dnsQuerySchema>;

// DNS Client
const DOH_SERVERS: Record<string, string> = {
  // "1.1.1.1": "https://cloudflare-dns.com/dns-query",
  "8.8.8.8": "https://dns.google/dns-query",
  "9.9.9.9": "https://dns.quad9.net/dns-query",
  "208.67.222.222": "https://doh.opendns.com/dns-query",
};

type SupportedTransport = "tcp" | "doh";

interface LookupResult {
  records: FlatDnsRecord[];
  queryTime: number;
  server: string;
  rawData: DnsAnswer[];
}

async function performLookup(query: DnsQuery): Promise<LookupResult> {
  const { domain, nameserver, recordTypes, dnssec, transport } = query;
  const isAuthoritative = nameserver === "authoritative";

  // Build DNS query flags
  const flags = dnssec
    ? ((isAuthoritative ? ["DO"] : ["RD", "DO"]) as DnsQueryFlag[])
    : ((isAuthoritative ? [] : ["RD"]) as DnsQueryFlag[]);

  // Resolve server
  let server: string | undefined;
  if (!isAuthoritative) {
    if (transport === "doh") {
      // For DoH, only use known DoH servers or if the nameserver is already a URL
      server = DOH_SERVERS[nameserver] || (nameserver.startsWith("http") ? nameserver : undefined);
    } else {
      server = nameserver;
    }
  }

  const client = new DnsClient({
    authoritative: isAuthoritative,
    timeout: 10_000,
    retries: 2,
    transport: transport as SupportedTransport,
    flags,
    ...(server && { server }),
  });

  const typesToQuery = (
    dnssec ? [...recordTypes, "DNSKEY", "DS", "RRSIG"] : recordTypes
  ) as RecordType[];

  const startTime = Date.now();
  const answers = await client.query({ query: domain, types: typesToQuery });
  const queryTime = Date.now() - startTime;

  // Check for errors in answers
  const errorAnswer = answers.find((answer) => answer.error);
  if (errorAnswer?.error) {
    throw errorAnswer.error;
  }

  return {
    records: answers.flatMap((answer) => flattenRecords(answer.records)),
    queryTime,
    server: isAuthoritative ? "Root Servers (authoritative)" : nameserver,
    rawData: answers,
  };
}

// Worker fetch handler
export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle DNS API
    if (url.pathname === "/api/dns/lookup") {
      if (request.method === "OPTIONS") return new Response(null, { status: 204 });

      if (request.method === "POST") {
        try {
          const payload = await request.json();
          const validated = dnsQuerySchema.parse(payload);
          const lookupResult = await performLookup(validated);
          console.log(`${request.method} ${url.pathname} 200`);
          return Response.json(lookupResult);
        } catch (error) {
          console.error("DNS lookup error:", error);

          if (error instanceof ZodError) {
            console.log(`${request.method} ${url.pathname} 400`);
            return Response.json(
              { error: "Validation error", message: "Invalid request parameters." },
              { status: 400 }
            );
          }

          const message = error instanceof Error ? error.message : "An unexpected error occurred";
          console.log(`${request.method} ${url.pathname} 500`);
          return Response.json({ error: "DNS lookup failed", message }, { status: 500 });
        }
      }

      return new Response(null, { status: 405 });
    }

    // Serve static assets
    if (!env.ASSETS) return new Response("Assets not configured", { status: 500 });

    const assetResponse = await env.ASSETS.fetch(request);
    console.log(`${request.method} ${url.pathname} ${assetResponse.status}`);
    return assetResponse;
  },
};
