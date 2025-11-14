import { useState, useEffect } from "react";
import DnsLookupForm from "@/components/DnsLookupForm";
import DnsResultsTable, { DnsRecord } from "@/components/DnsResultsTable";
import RawJsonViewer from "@/components/RawJsonViewer";
import { Card, CardContent } from "@/components/ui/card";
import { SiGithub } from "react-icons/si";

interface DnsApiResponse {
  records: DnsRecord[];
  queryTime: number;
  server: string;
  rawData: any;
}

function App() {
  const [results, setResults] = useState<DnsRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryInfo, setQueryInfo] = useState<{
    server?: string;
    time?: number;
    transport?: string;
    dnssec?: boolean;
  }>({});
  const [rawData, setRawData] = useState<any>(null);

  useEffect(() => {
    if (error) {
      window.alert(`DNS Lookup Failed: ${error}`);
      setError(null);
    }
  }, [error]);

  const handleLookup = async (
    domain: string,
    nameserver: string,
    recordTypes: string[],
    dnssec: boolean,
    transport: string
  ) => {
    setIsLoading(true);
    setError(null);
    setQueryInfo((prev) => ({ ...prev, transport, dnssec }));

    try {
      const response = await fetch("/api/dns/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain, nameserver, recordTypes, dnssec, transport }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "DNS lookup failed");
      }

      const data: DnsApiResponse = await response.json();
      setResults(data.records);
      setQueryInfo((prev) => ({ ...prev, server: data.server, time: data.queryTime }));
      setRawData(data.rawData);
    } catch (err: any) {
      console.error("DNS lookup error:", err);
      setError(err.message || "Failed to perform DNS lookup. Please try again.");
      setResults(null);
      setQueryInfo({});
      setRawData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <a
              href="https://github.com/aoxborrow/dns-client"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2 w-full sm:w-auto"
              data-testid="link-github">
              <SiGithub className="w-5 h-5" />
              <h1 className="text-2xl font-semibold underline">aoxborrow/dns-client</h1>
            </a>
            <a
              href="https://dns.tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover-elevate active-elevate-2 px-2 py-1 rounded-md -ml-2 sm:ml-0 w-full sm:w-auto"
              data-testid="link-dns-tools">
              Made by <span className="underline font-bold">dns.tools</span>
            </a>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <DnsLookupForm onLookup={handleLookup} isLoading={isLoading} />
          </CardContent>
        </Card>

        {results !== null && (
          <div className="space-y-4">
            {rawData && <RawJsonViewer data={rawData} />}
            <DnsResultsTable
              records={results}
              queryTime={queryInfo.time}
              server={queryInfo.server}
              transport={queryInfo.transport}
              dnssec={queryInfo.dnssec}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
