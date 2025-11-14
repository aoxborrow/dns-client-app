import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RawJsonViewerProps {
  data: any;
}

export default function RawJsonViewer({ data }: RawJsonViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  return (
    <Card className="overflow-hidden bg-black dark:bg-black">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            className="justify-start h-auto p-0 hover-elevate text-green-400 dark:text-green-400"
            data-testid="button-toggle-raw-json">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2" />
            )}
            <span className="text-sm font-medium">Raw DNS Answers</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className="h-auto p-2 hover-elevate text-green-400 dark:text-green-400"
            data-testid="button-copy-json">
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        {isOpen && (
          <div className="border-t border-green-400/20">
            <pre
              className="p-6 overflow-x-auto text-xs font-mono bg-black dark:bg-black text-green-400 dark:text-green-400 max-h-96 overflow-y-auto"
              data-testid="text-raw-json">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
