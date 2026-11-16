import type { PermissionId, TeamRole, TeamUser } from "../models";

export const permissionCatalog: {
  id: PermissionId;
  label: string;
  group: string;
}[] = [
  { id: "contacts.view", label: "View contacts", group: "Contacts" },
  { id: "contacts.create", label: "Add contacts", group: "Contacts" },
  { id: "contacts.edit", label: "Edit contacts", group: "Contacts" },
  { id: "contacts.delete", label: "Delete contacts", group: "Contacts" },
  { id: "contacts.export", label: "Export contacts", group: "Contacts" },
  { id: "audiences.view", label: "View audiences", group: "Audiences" },
  {
    id: "audiences.manage",
    label: "Create and manage audiences",
    group: "Audiences",
  },
  { id: "campaigns.view", label: "View campaigns", group: "Campaigns" },
  { id: "campaigns.create", label: "Create campaigns", group: "Campaigns" },
  { id: "campaigns.approve", label: "Approve campaigns", group: "Campaigns" },
  {
    id: "campaigns.send",
    label: "Schedule and send campaigns",
    group: "Campaigns",
  },
  { id: "templates.manage", label: "Manage templates", group: "Templates" },
  { id: "reports.view", label: "View reports", group: "Reports" },
  { id: "reports.export", label: "Export reports", group: "Reports" },
  {
    id: "categories.manage",
    label: "Manage contact categories",
    group: "Contacts",
  },
  { id: "team.manage", label: "Manage users and roles", group: "Workspace" },
  {
    id: "settings.manage",
    label: "Manage workspace settings",
    group: "Workspace",
  },
];
export const rolePermissions: Record<TeamRole, PermissionId[]> = {
  Superadmin: permissionCatalog.map((permission) => permission.id),
  Admin: [
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "contacts.delete",
    "contacts.export",
    "audiences.view",
    "audiences.manage",
    "campaigns.view",
    "campaigns.create",
    "campaigns.approve",
    "campaigns.send",
    "templates.manage",
    "reports.view",
    "reports.export",
    "categories.manage",
    "settings.manage",
  ],
  "Campaign Approver": [
    "contacts.view",
    "audiences.view",
    "campaigns.view",
    "campaigns.approve",
    "reports.view",
  ],
  "Marketing Staff": [
    "contacts.view",
    "contacts.create",
    "contacts.edit",
    "audiences.view",
    "audiences.manage",
    "campaigns.view",
    "campaigns.create",
    "templates.manage",
    "reports.view",
  ],
  Viewer: ["contacts.view", "audiences.view", "campaigns.view", "reports.view"],
};
const initialTeamUsers: TeamUser[] = [
  {
    name: "Amara Okafor",
    email: "amara@cephas.ng",
    role: "Superadmin",
    permissions: rolePermissions.Superadmin,
  },
  {
    name: "Tunde Bakare",
    email: "tunde@cephas.ng",
    role: "Campaign Approver",
    permissions: rolePermissions["Campaign Approver"],
  },
  {
    name: "Nneka Eze",
    email: "nneka@cephas.ng",
    role: "Marketing Staff",
    permissions: rolePermissions["Marketing Staff"],
  },
  {
    name: "David Adebayo",
    email: "david@cephas.ng",
    role: "Viewer",
    permissions: rolePermissions.Viewer,
  },
];
export function loadTeamUsers(): TeamUser[] {
  try {
    const saved = JSON.parse(
      localStorage.getItem("cephas.team-users") ?? "null",
    ) as TeamUser[] | null;
    if (
      Array.isArray(saved) &&
      saved.some(
        (user) =>
          user.email === "amara@cephas.ng" && user.role === "Superadmin",
      )
    )
      return saved;
  } catch {
    // Use the default team when local preview data is missing or invalid.
  }
  return initialTeamUsers;
}
