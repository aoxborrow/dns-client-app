import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";

const NAMESERVERS = [
  { value: "8.8.8.8", label: "Google (8.8.8.8)" },
  // { value: "1.1.1.1", label: "Cloudflare (1.1.1.1)" },
  { value: "9.9.9.9", label: "Quad9 (9.9.9.9)" },
  { value: "208.67.222.222", label: "OpenDNS (208.67.222.222)" },
  { value: "authoritative", label: "Authoritative (Root Servers)" },
  { value: "custom", label: "Custom" },
];

const TRANSPORTS = [
  { value: "udp", label: "UDP", disabled: true },
  { value: "tcp", label: "TCP" },
  { value: "doh", label: "DoH (DNS over HTTPS)" },
];

const RECORD_TYPES = [
  { id: "A", label: "A", popular: true },
  { id: "AAAA", label: "AAAA", popular: true },
  { id: "CAA", label: "CAA", popular: true },
  { id: "CDNSKEY", label: "CDNSKEY", popular: false },
  { id: "CDS", label: "CDS", popular: false },
  { id: "CERT", label: "CERT", popular: false },
  { id: "CNAME", label: "CNAME", popular: true },
  { id: "DNAME", label: "DNAME", popular: false },
  { id: "DNSKEY", label: "DNSKEY", popular: false },
  { id: "DS", label: "DS", popular: true },
  { id: "HINFO", label: "HINFO", popular: false },
  { id: "HTTPS", label: "HTTPS", popular: false },
  { id: "KEY", label: "KEY", popular: false },
  { id: "LOC", label: "LOC", popular: false },
  { id: "MX", label: "MX", popular: true },
  { id: "NAPTR", label: "NAPTR", popular: false },
  { id: "NS", label: "NS", popular: true },
  { id: "NSEC", label: "NSEC", popular: false },
  { id: "NSEC3", label: "NSEC3", popular: false },
  { id: "NSEC3PARAM", label: "NSEC3PARAM", popular: false },
  { id: "OPENPGPKEY", label: "OPENPGPKEY", popular: false },
  { id: "PTR", label: "PTR", popular: false },
  { id: "RP", label: "RP", popular: false },
  { id: "RRSIG", label: "RRSIG", popular: false },
  { id: "SIG", label: "SIG", popular: false },
  { id: "SOA", label: "SOA", popular: true },
  { id: "SRV", label: "SRV", popular: false },
  { id: "SSHFP", label: "SSHFP", popular: false },
  { id: "SVCB", label: "SVCB", popular: false },
  { id: "TLSA", label: "TLSA", popular: false },
  { id: "TSIG", label: "TSIG", popular: false },
  { id: "TXT", label: "TXT", popular: true },
  { id: "URI", label: "URI", popular: false },
];

const EXAMPLE_DOMAINS = ["cloudflare.com", "wikipedia.org", "x.com"];

interface DnsLookupFormProps {
  onLookup: (
    domain: string,
    nameserver: string,
    recordTypes: string[],
    dnssec: boolean,
    transport: string
  ) => void;
  isLoading?: boolean;
}

export default function DnsLookupForm({ onLookup, isLoading = false }: DnsLookupFormProps) {
  const [domain, setDomain] = useState("");
  const [nameserver, setNameserver] = useState("8.8.8.8");
  const [customNameserver, setCustomNameserver] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    RECORD_TYPES.filter((t) => t.popular).map((t) => t.id)
  );
  const [dnssec, setDnssec] = useState(false);
  const [transport, setTransport] = useState("tcp");

  const isAuthoritative = nameserver === "authoritative";

  // Auto-switch from DoH to UDP when authoritative mode is selected
  useEffect(() => {
    if (isAuthoritative && transport === "doh") {
      setTransport("tcp");
    }
  }, [isAuthoritative, transport]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ns = nameserver === "custom" ? customNameserver : nameserver;
    if (domain && ns && selectedTypes.length > 0) {
      onLookup(domain, ns, selectedTypes, dnssec, transport);
    }
  };

  const handleExampleClick = (exampleDomain: string) => {
    setDomain(exampleDomain);
    const ns = nameserver === "custom" ? customNameserver : nameserver;
    if (ns && selectedTypes.length > 0) {
      onLookup(exampleDomain, ns, selectedTypes, dnssec, transport);
    }
  };

  const toggleRecordType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => {
    if (selectedTypes.length === RECORD_TYPES.length) {
      setSelectedTypes([]);
    } else {
      setSelectedTypes(RECORD_TYPES.map((t) => t.id));
    }
  };

  const isValidDomain = domain.length > 0 && domain.includes(".");
  const canSubmit = isValidDomain && selectedTypes.length > 0 && !isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="domain" className="text-sm font-medium">
          Domain Name
        </Label>
        <Input
          id="domain"
          type="text"
          placeholder="example.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          disabled={isLoading}
          className="font-mono text-base"
          data-testid="input-domain"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Examples:</span>
          {EXAMPLE_DOMAINS.map((example) => (
            <Badge
              key={example}
              variant="secondary"
              className="cursor-pointer hover-elevate active-elevate-2"
              onClick={() => handleExampleClick(example)}
              data-testid={`badge-example-${example}`}>
              {example}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nameserver" className="text-sm font-medium">
              DNS Server
            </Label>
            <Select value={nameserver} onValueChange={setNameserver} disabled={isLoading}>
              <SelectTrigger id="nameserver" data-testid="select-nameserver">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NAMESERVERS.map((ns) => (
                  <SelectItem key={ns.value} value={ns.value}>
                    {ns.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {nameserver === "custom" && (
              <Input
                type="text"
                placeholder="Enter custom nameserver IP"
                value={customNameserver}
                onChange={(e) => setCustomNameserver(e.target.value)}
                disabled={isLoading}
                className="mt-2 font-mono"
                data-testid="input-custom-nameserver"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="transport" className="text-sm font-medium">
              Transport Protocol
            </Label>
            <Select value={transport} onValueChange={setTransport} disabled={isLoading}>
              <SelectTrigger id="transport" data-testid="select-transport">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSPORTS.map((t) => (
                  <SelectItem
                    key={t.value}
                    value={t.value}
                    disabled={t.disabled || (isAuthoritative && t.value === "doh")}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAuthoritative && (
              <p className="text-xs text-muted-foreground">Root servers do not support DoH</p>
            )}
          </div>

          <div className="flex items-center justify-between p-4 border rounded-md bg-card">
            <div className="space-y-0.5">
              <Label htmlFor="dnssec" className="text-sm font-medium cursor-pointer">
                DNSSEC
              </Label>
              <p className="text-xs text-muted-foreground">
                Include DNSSEC records (DNSKEY, DS, RRSIG)
              </p>
            </div>
            <Switch
              id="dnssec"
              checked={dnssec}
              onCheckedChange={setDnssec}
              disabled={isLoading}
              data-testid="switch-dnssec"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Record Types</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={selectAll}
              disabled={isLoading}
              className="h-auto px-2 py-1 text-xs"
              data-testid="button-select-all">
              {selectedTypes.length === RECORD_TYPES.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-3 border rounded-md bg-card max-h-64 overflow-y-auto">
            {RECORD_TYPES.map((type) => (
              <div key={type.id} className="flex items-center space-x-2">
                <Checkbox
                  id={type.id}
                  checked={selectedTypes.includes(type.id)}
                  onCheckedChange={() => toggleRecordType(type.id)}
                  disabled={isLoading}
                  data-testid={`checkbox-${type.id.toLowerCase()}`}
                />
                <label htmlFor={type.id} className="text-xs font-mono cursor-pointer select-none">
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full md:w-auto"
        size="lg"
        data-testid="button-lookup">
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Looking up...
          </>
        ) : (
          <>
            <Search className="w-4 h-4 mr-2" />
            Lookup DNS Records
          </>
        )}
      </Button>
    </form>
  );
}
