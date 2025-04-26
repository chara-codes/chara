"use client";
import React from "react";
import {
  EllipsisVertical,
  ExternalLink,
  Code,
  Layers,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DialogHeader } from "../ui/dialog";
import { Technology } from "@/context";

const CardActions = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="!mt-0 border-none outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
          <EllipsisVertical />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent side="bottom" align="end" sideOffset={10}>
          <div className="px-2 py-1 text-md font-semibold">Actions</div>
          <DropdownMenuItem>Edit stack</DropdownMenuItem>
          <DropdownMenuItem>Duplicate stack</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive hover:!text-destructive">
            Delete Stack
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
};

const CardChipWithLink = ({
  label,
  link,
  codeLink,
}: {
  label: string;
  link: string;
  codeLink: string;
}) => {
  return (
    <div className="inline-flex items-center gap-2 border border-border px-3 py-1 rounded-full text-sm font-bold text-foreground hover:bg-muted transition">
      <span>{label}</span>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
        aria-label={`${label} documentation`}
      >
        <ExternalLink size={16} />
      </a>
      <a
        href={codeLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-green-500 hover:underline"
        aria-label={`${label} source code`}
      >
        <Code size={16} />
      </a>
    </div>
  );
};

export const StackCard = ({
  stackName,
  technologies,
  category,
  description,
}: {
  stackName: string;
  technologies: Technology[];
  category: string;
  description: string;
}) => {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row justify-between items-start space-x-6">
        <CardTitle className="text-xl font-medium">{stackName}</CardTitle>
        <CardActions />
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          Technologies in this stack:
        </CardDescription>
        {/* max number of chips in the line should be 3 use grid to wrap them if there are more than 3*/}
        <div className="flex flex-wrap gap-x-2 gap-y-3 pr-8">
          {technologies.map(({ name, docsUrl, codeUrl }) => (
            <CardChipWithLink
              key={name}
              label={name}
              link={docsUrl || ""}
              codeLink={codeUrl || ""}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
          <Layers />
          <div className="text-md truncate">{category}</div>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="whitespace-nowrap flex-shrink-0"
            >
              <Info className="mr-2" />
              View Details
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-xl">
            <DialogHeader>
              <DialogTitle>{stackName}</DialogTitle>
              <DialogDescription>Full stack information</DialogDescription>
            </DialogHeader>
            <section className="mt-2 mb-2">
              <h3 className="text-lg font-semibold mb-1">Category:</h3>
              <p>{category}</p>
            </section>
            <section className="mb-2">
              <h3 className="text-lg font-semibold mb-2">Technologies:</h3>
              <div className="flex flex-wrap gap-2">
                {technologies.map(({ name }) => (
                  <span
                    key={name}
                    className="px-3 py-1 rounded-full text-sm font-semibold bg-muted"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </section>
            <section className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Description:</h3>
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-semibold mt-4 mb-2"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3
                      className="text-lg font-semibold mt-3 mb-1"
                      {...props}
                    />
                  ),
                  p: ({ node, ...props }) => (
                    <p className="text-sm/6 mb-2" {...props} />
                  ),
                  ul: ({ node, ...props }) => (
                    <ul
                      className="list-disc pl-5 space-y-2 marker:text-border"
                      {...props}
                    />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-5 space-y-2" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="text-sm mb-2 pl-2" {...props} />
                  ),
                  a: ({ node, ...props }) => (
                    <a
                      className="text-foreground font-semibold underline"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...props}
                    />
                  ),
                  code: ({ node, ...props }) => (
                    <pre className="bg-secondary-foreground text-xs text-accent p-2.5 my-5 rounded-sm overflow-x-auto">
                      <code {...props} />
                    </pre>
                  ),
                }}
              >
                {description}
              </ReactMarkdown>
            </section>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
};
