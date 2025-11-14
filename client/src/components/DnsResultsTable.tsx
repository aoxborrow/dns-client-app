import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Server, Shield, Radio } from "lucide-react";

export interface DnsRecord {
  type: string;
  name: string;
  content: string;
  ttl?: number;
}

interface DnsResultsTableProps {
  records: DnsRecord[];
  queryTime?: number;
  server?: string;
  transport?: string;
  dnssec?: boolean;
}

export default function DnsResultsTable({ records, queryTime, server, transport, dnssec }: DnsResultsTableProps) {
  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Server className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No DNS records found</p>
            <p className="text-xs mt-1">Try a different query or record type</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-base">DNS Query Results</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Found {records.length} record{records.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {server && (
              <div className="flex items-center gap-1.5" data-testid="text-server">
                <Server className="w-3.5 h-3.5" />
                <span className="font-mono">{server}</span>
              </div>
            )}
            {transport && (
              <div className="flex items-center gap-1.5" data-testid="text-transport">
                <Radio className="w-3.5 h-3.5" />
                <span className="uppercase">{transport}</span>
              </div>
            )}
            {dnssec !== undefined && (
              <div className="flex items-center gap-1.5" data-testid="text-dnssec">
                <Shield className="w-3.5 h-3.5" />
                <span>DNSSEC: {dnssec ? "Yes" : "No"}</span>
              </div>
            )}
            {queryTime !== undefined && (
              <div className="flex items-center gap-1.5" data-testid="text-query-time">
                <Clock className="w-3.5 h-3.5" />
                <span>{queryTime}ms</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-semibold uppercase tracking-wide py-2 pl-6">Type</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide py-2">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide py-2">Content</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wide py-2 text-right pr-6">TTL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record, index) => (
                <TableRow key={index} className="hover-elevate" data-testid={`row-record-${index}`}>
                  <TableCell className="font-mono text-sm font-medium py-2 pl-6 whitespace-nowrap" data-testid={`text-type-${index}`}>
                    {record.type}
                  </TableCell>
                  <TableCell className="font-mono text-sm py-2 whitespace-nowrap" data-testid={`text-name-${index}`}>
                    {record.name}
                  </TableCell>
                  <TableCell className="font-mono text-sm py-2 break-all max-w-2xl" data-testid={`text-content-${index}`}>
                    {record.content}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right tabular-nums py-2 whitespace-nowrap pr-6" data-testid={`text-ttl-${index}`}>
                    {record.ttl?.toLocaleString() || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
