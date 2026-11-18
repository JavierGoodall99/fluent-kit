// Sample data for the app.

export type TenantStatus = "gekoppeld" | "niet-ingesteld" | "fout";
export interface Tenant { id: string; name: string; city: string; units: number; status: TenantStatus; lastSync: string | null }

export const tenants: Tenant[] = [
  { id: "t1", name: "Woonstichting De Linde", city: "Utrecht", units: 4210, status: "gekoppeld", lastSync: "2026-11-16T08:12:00Z" },
  { id: "t2", name: "Portaal Wonen", city: "Amersfoort", units: 2875, status: "gekoppeld", lastSync: "2026-11-16T07:55:00Z" },
  { id: "t3", name: "Stichting Eigen Haard", city: "Amsterdam", units: 9120, status: "fout", lastSync: "2026-11-12T22:04:00Z" },
  { id: "t4", name: "Woonbedrijf Noord", city: "Groningen", units: 1534, status: "niet-ingesteld", lastSync: null },
  { id: "t5", name: "Havensteder", city: "Rotterdam", units: 6740, status: "gekoppeld", lastSync: "2026-11-16T06:30:00Z" },
  { id: "t6", name: "Wooncorporatie Zuid", city: "Maastricht", units: 980, status: "niet-ingesteld", lastSync: null },
  { id: "t7", name: "Stadgenoot", city: "Amsterdam", units: 7310, status: "fout", lastSync: "2026-11-15T03:41:00Z" },
];
export const tenantStatusLabel: Record<TenantStatus, string> = { gekoppeld: "Gekoppeld", "niet-ingesteld": "Niet ingesteld", fout: "Fout bij synchroniseren" };
export function searchTenants(list: Tenant[], q: string) { const s = q.trim().toLowerCase(); return s ? list.filter((t) => `${t.name} ${t.city}`.toLowerCase().includes(s)) : list; }
export function connectTenant(id: string) { console.info("connect", id); }

export type EventType = "LOGIN" | "SYNC_OK" | "SYNC_ERR" | "EXPORT" | "USER_ADD";
export interface ActivityEvent { id: number; at: string; type: EventType; user: string; tenant: string; detail: string }
const types: EventType[] = ["LOGIN", "SYNC_OK", "SYNC_OK", "SYNC_ERR", "EXPORT", "USER_ADD"];
const users = ["m.jansen", "s.devries", "a.bakker", "systeem"];
export const events: ActivityEvent[] = Array.from({ length: 64 }, (_, i) => ({
  id: 1000 + i,
  at: new Date(Date.UTC(2026, 10, 16, 9) - i * 47 * 60000).toISOString(),
  type: types[i % types.length],
  user: users[i % users.length],
  tenant: tenants[i % tenants.length].name,
  detail: types[i % types.length] === "SYNC_ERR" ? "ERR 504 upstream timeout" : "-",
}));
export function filterEvents(list: ActivityEvent[], q: string, type: EventType | "ALL") {
  const s = q.trim().toLowerCase();
  return list.filter((e) => (type === "ALL" || e.type === type) && (!s || `${e.user} ${e.tenant} ${e.detail}`.toLowerCase().includes(s)));
}
export function paginate<T>(list: T[], page: number, pageSize: number) { return list.slice(page * pageSize, page * pageSize + pageSize); }
export function exportActivityCsv(list: ActivityEvent[]) {
  const csv = ["id;tijd;type;gebruiker;huurder;detail", ...list.map((e) => [e.id, e.at, e.type, e.user, e.tenant, e.detail].join(";"))].join("\n");
  return URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
}
export function eventCounts(list: ActivityEvent[]) {
  return { total: list.length, errors: list.filter((e) => e.type === "SYNC_ERR").length, logins: list.filter((e) => e.type === "LOGIN").length };
}

export interface Invoice { id: string; tenant: string; period: string; amount: number; vat: number; paid: boolean }
export const invoices: Invoice[] = [
  { id: "F-2026-0412", tenant: "Woonstichting De Linde", period: "okt 2026", amount: 12480.5, vat: 0.21, paid: true },
  { id: "F-2026-0413", tenant: "Portaal Wonen", period: "okt 2026", amount: 8530, vat: 0.21, paid: true },
  { id: "F-2026-0414", tenant: "Stichting Eigen Haard", period: "okt 2026", amount: 27360.75, vat: 0.21, paid: false },
  { id: "F-2026-0415", tenant: "Havensteder", period: "okt 2026", amount: 20220, vat: 0.21, paid: false },
  { id: "F-2026-0416", tenant: "Stadgenoot", period: "okt 2026", amount: 21930.2, vat: 0.21, paid: true },
  { id: "F-2026-0417", tenant: "Woonbedrijf Noord", period: "okt 2026", amount: 845, vat: 0.09, paid: true },
];
export function invoiceTotals(list: Invoice[]) {
  const net = list.reduce((n, i) => n + i.amount, 0), vat = list.reduce((n, i) => n + i.amount * i.vat, 0);
  return { net, vat, gross: net + vat, open: list.filter((i) => !i.paid).reduce((n, i) => n + i.amount * (1 + i.vat), 0) };
}

export interface Customer { id: number; name: string }
export const customers: Customer[] = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, name: `Klant ${String(i + 1).padStart(3, "0")} (${tenants[i % tenants.length].city})` }));
export function saveInvoice(values: Record<string, string>) { console.info("save", values); return true; }

export const integrations = [
  { id: "ad", name: "Microsoft Entra ID", connected: true, lastRun: "2026-11-16T08:00:00Z" },
  { id: "ex", name: "Exact Online", connected: true, lastRun: "2026-11-16T06:00:00Z" },
  { id: "tp", name: "TopDesk", connected: false, lastRun: null },
  { id: "ad2", name: "Azure DevOps", connected: true, lastRun: "2026-11-15T23:00:00Z" },
];
export const profile = { name: "Marieke Jansen", email: "m.jansen@example.nl", role: "Beheerder", language: "nl", notifications: true };
export const tasks = [
  { id: 1, title: "Koppeling Woonbedrijf Noord instellen", owner: "s.devries", due: "2026-11-20", done: false },
  { id: 2, title: "Synchronisatiefout Eigen Haard onderzoeken", owner: "a.bakker", due: "2026-11-18", done: false },
  { id: 3, title: "Facturen oktober controleren", owner: "m.jansen", due: "2026-11-25", done: false },
  { id: 4, title: "Gebruikers Stadgenoot toevoegen", owner: "s.devries", due: "2026-11-30", done: true },
];
export const teams = [
  { name: "Support", tickets: ["Inloggen lukt niet", "Export leeg", "Dubbele huurder", "Factuur onjuist", "Wachtwoord resetten", "Rechten aanpassen", "Melding blijft staan", "Rapport traag", "Koppeling Exact", "Adres onjuist", "Mail komt niet aan", "Scherm laadt niet"] },
  { name: "Integraties", tickets: ["TopDesk koppelen", "Entra groepen"] },
  { name: "Facturatie", tickets: ["Btw 9% regels", "Creditnota", "Termijnen"] },
  { name: "Platform", tickets: ["Upgrade Node 24"] },
];
