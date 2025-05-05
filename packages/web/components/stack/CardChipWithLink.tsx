import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Code, ExternalLink } from "lucide-react";
import React from "react";

type Props = {
  label: string;
  docsUrl: string;
  codeUrl: string;
};

export const CardChipWithLink = ({ label, docsUrl, codeUrl }: Props) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-3 py-1 text-sm"
          >
            {label}
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href={codeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-700"
            >
              <Code className="h-3 w-3" />
            </a>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Docs: {docsUrl}</p>
          <p>Code: {codeUrl}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
