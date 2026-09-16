"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { Alert } from "./components/ui/alert";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select } from "./components/ui/select";
import { useLoginMutation, useSignupMutation, type SignupInput } from "./hooks/queries/auth";
import { useCreateOrganizationMutation, useInviteUserMutation, useUpdateRoleMutation } from "./hooks/queries/organization";
import { getApiError, type Organization, type Role, type User } from "./lib/api";

const roles: Role[] = ["employee", "finance", "manager", "organization_admin"];

function Field({ label, name, type = "text", placeholder }: { label: string; name: string; type?: string; placeholder?: string }) {
  return <Label className="my-4">{label}<Input required name={name} type={type} placeholder={placeholder} /></Label>;
}

function RoleSelect({ name = "role" }: { name?: string }) {
  return <Select name={name} defaultValue="employee">{roles.map((role) => <option key={role} value={role}>{role.replace("_", " ")}</option>)}</Select>;
}

export default function Home() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const savedUser = window.localStorage.getItem("financial-operations-user");
    return savedUser ? (JSON.parse(savedUser) as User) : null;
  });
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const login = useLoginMutation();
  const signup = useSignupMutation();
  const createOrganization = useCreateOrganizationMutation();
  const inviteUser = useInviteUserMutation();
  const updateRole = useUpdateRoleMutation();
  const isPending = login.isPending || signup.isPending;

  const success = (text: string) => setNotice({ type: "success", text });
  const failure = (error: unknown) => setNotice({ type: "error", text: getApiError(error) });

  function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    if (mode === "login") {
      login.mutate(data as { email: string; password: string }, { onSuccess: (result) => { window.localStorage.setItem("financial-operations-token", result.token); window.localStorage.setItem("financial-operations-user", JSON.stringify(result.user)); setUser(result.user); success("You are signed in. Your workspace is ready."); }, onError: failure });
    } else {
      signup.mutate(data as SignupInput, { onSuccess: () => { setMode("login"); success("User created. Sign in to continue."); }, onError: failure });
    }
  }

  function signOut() {
    window.localStorage.removeItem("financial-operations-token");
    window.localStorage.removeItem("financial-operations-user");
    setUser(null);
    setOrganization(null);
    success("Signed out.");
  }

  return <main className="shell">
    <header className="topbar"><div className="brand-mark">LO</div><div><strong>Ledgerline</strong><span>Operations console</span></div>{user && <Button variant="ghost" className="ml-auto" onClick={signOut}><LogOut size={14} /> Sign out</Button>}</header>
    <section className="intro"><p className="eyebrow">People & access</p><h1>Make the organization<br /><em>move together.</em></h1><p className="lede">A focused workspace for creating teams, inviting collaborators, and keeping access exactly where it belongs.</p></section>
    {notice && <Alert variant={notice.type === "error" ? "destructive" : "default"}>{notice.text}</Alert>}
    {!user ? <section className="auth-layout"><div className="side-note"><span className="number">01</span><h2>Start with the people who make the work happen.</h2><p>Create an account or sign in to open your organization workspace.</p></div><Card className="form-panel"><div className="tabs"><button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign in</button><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>Create user</button></div><form onSubmit={submitAuth}>{mode === "signup" && <div className="two-fields"><Field label="First name" name="first_name" placeholder="Alex" /><Field label="Last name" name="last_name" placeholder="Morgan" /></div>}<Field label="Work email" name="email" type="email" placeholder="alex@company.com" /><Field label="Password" name="password" type="password" placeholder="••••••••" /><Button className="w-full" disabled={isPending}>{isPending ? "Working..." : mode === "login" ? "Open workspace" : "Create user"}<ArrowUpRight size={17} /></Button></form></Card></section> : <section className="workspace"><div className="workspace-head"><div><p className="eyebrow">Signed in as {user.email}</p><h2>{user.name}</h2></div><Badge>{user.role.replace("_", " ")}</Badge></div><div className="workspace-grid"><Card><span className="number">02</span><h3>Create organization</h3><p>Start a new workspace. You become its organization admin automatically.</p><form onSubmit={(event) => { event.preventDefault(); createOrganization.mutate(String(new FormData(event.currentTarget).get("name")), { onSuccess: ({ organization: created }) => { setOrganization(created); success(`${created.name} is ready. You are its organization admin.`); }, onError: failure }); }}><Field label="Organization name" name="name" placeholder="Northstar Finance" /><Button className="w-full" disabled={createOrganization.isPending}>{createOrganization.isPending ? "Creating..." : "Create organization"}<ArrowUpRight size={17} /></Button></form>{organization && <div className="result"><small>Active organization</small><strong>{organization.name}</strong><code>ID {organization.id}</code></div>}</Card><Card><span className="number">03</span><h3>Invite a user</h3><p>Invite an existing account into an organization with an initial role.</p><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); inviteUser.mutate({ id: String(data.get("organization_id")), email: String(data.get("email")), role: data.get("role") as Role }, { onSuccess: () => success("Invitation created and ready for acceptance."), onError: failure }); }}><Field label="Organization ID" name="organization_id" placeholder={organization ? String(organization.id) : "e.g. 12"} /><Field label="User email" name="email" type="email" placeholder="teammate@company.com" /><Label className="my-4">Initial role<RoleSelect /></Label><Button className="w-full" disabled={inviteUser.isPending}>{inviteUser.isPending ? "Sending..." : "Create invitation"}<ArrowUpRight size={17} /></Button></form></Card><Card><span className="number">04</span><h3>Update member role</h3><p>Change an existing member’s access. You must be an organization admin.</p><form onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); updateRole.mutate({ orgId: String(data.get("organization_id")), userId: String(data.get("user_id")), role: data.get("role") as Role }, { onSuccess: ({ member }) => success(`User ${member.user_id} is now a ${member.role.replace("_", " ")}.`), onError: failure }); }}><div className="two-fields"><Field label="Organization ID" name="organization_id" placeholder="e.g. 12" /><Field label="User ID" name="user_id" placeholder="e.g. 48" /></div><Label className="my-4">New role<RoleSelect /></Label><Button className="w-full" disabled={updateRole.isPending}>{updateRole.isPending ? "Updating..." : "Update role"}<ArrowUpRight size={17} /></Button></form></Card></div></section>}
    <footer><span>LEDGERLINE / 2026</span><span>Secure people operations</span></footer>
  </main>;
}
