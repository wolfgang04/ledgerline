"use client";

import { useState, type ReactNode } from "react";
import { Building2, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type OrganizationWorkspaceTab = "people" | "structure";

type OrganizationWorkspaceTabsProps = {
  memberCount: number;
  people: ReactNode;
  structure: ReactNode;
};

export function OrganizationWorkspaceTabs({
  memberCount,
  people,
  structure,
}: OrganizationWorkspaceTabsProps) {
  const [tab, setTab] = useState<OrganizationWorkspaceTab>("people");

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (value === "people" || value === "structure") setTab(value);
      }}
      className="gap-4"
    >
      <div className="flex items-center gap-4 border-b border-(--line)">
        <TabsList variant="line" className="h-auto justify-start p-0 max-w-10">
          <TabsTrigger value="people" className="gap-2 px-1 py-2">
            <Users size={14} /> People{" "}
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
              {memberCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="structure" className="gap-2 px-1 py-2">
            <Building2 size={14} /> Structure
          </TabsTrigger>
        </TabsList>
        <span className="directory-sync">
          <i /> Directory synced just now
        </span>
      </div>
      {tab === "people" ? (
        <TabsContent value="people">{people}</TabsContent>
      ) : (
        <TabsContent value="structure">{structure}</TabsContent>
      )}
    </Tabs>
  );
}
