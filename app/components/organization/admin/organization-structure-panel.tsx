import { Building2 } from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function OrganizationStructurePanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 size={16} /> Organization structure
        </CardTitle>
        <CardDescription>
          Departments and teams are coming next. Use People to manage membership
          and roles today.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
