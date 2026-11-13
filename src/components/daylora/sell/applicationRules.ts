import type { ApplicationForm, MyApplication, SupplierStage } from "@/types/api/supplier.types";

// The seller application's options and checks. The server repeats every
// check on submit with the same messages (backend src/supplier/onboarding.rules.ts).

export const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]; // prettier-ignore
export const BUSINESS_TYPES = ["Manufacturer", "Brand owner", "Wholesaler or distributor", "Dropship supplier"];
export const YEARS = ["Less than 1", "1–2", "3–5", "6–10", "More than 10"];
export const CATEGORIES = [
  "Home & decor",
  "Kitchen & dining",
  "Bedding & bath",
  "Apparel",
  "Kids & baby",
  "Outdoor & garden",
  "Pet supplies",
  "Electronics & audio",
  "Beauty & personal care",
  "Toys & games",
];
export const PRODUCT_COUNTS = ["Under 50", "50–200", "200–1,000", "Over 1,000"];
export const OWN_BRAND: Array<[string, string]> = [["yes", "Yes"], ["no", "No, other brands"], ["both", "Both"]];
export const YES_NO: Array<[string, string]> = [["yes", "Yes"], ["no", "No"]];
export const HANDLING = ["Same day", "1 business day", "2 business days", "3–5 business days"];
export const CARRIERS = ["USPS", "UPS", "FedEx", "DHL", "Other"];
export const FEEDS: Array<[string, string, string]> = [
  ["csv", "Spreadsheet (CSV or Excel)", "Use our template for bulk upload"],
  ["shopify", "Shopify store", "We can read your catalogue"],
  ["woo", "WooCommerce store", "We can read your catalogue"],
  ["api", "Our own API", "Your tech team shares access"],
  ["none", "I don’t have product data ready", "Photos and details aren’t in a file yet"],
];
export const FEED_LABEL: Record<string, string> = { csv: "Spreadsheet", shopify: "Shopify store", woo: "WooCommerce store", api: "API", none: "Not ready" };

export const FORM_STEPS = ["Company", "Products", "Shipping", "Product data", "Review"];

export type FormErrors = Partial<Record<keyof ApplicationForm | "agree", string>>;

/** Which step owns a field, to jump back to it when the server flags it. */
export const FIELD_STEP: Record<string, number> = {
  legalName: 0, tradingName: 0, ein: 0, website: 0, businessType: 0, yearsInBusiness: 0, phone: 0, street: 0, city: 0, state: 0, zip: 0,
  categories: 1, productCount: 1, ownBrand: 1, brands: 1,
  usWarehouse: 2, warehouseState: 2, shipsAllStates: 2, handlingTime: 2, carriers: 2,
  productData: 3, moq: 3, notes: 3,
}; // prettier-ignore

const s = (v: string | undefined) => (v ?? "").trim();

export function stepErrors(step: number, a: ApplicationForm): FormErrors {
  const e: FormErrors = {};
  if (step === 0) {
    if (s(a.legalName).length < 2) e.legalName = "Enter your legal business name";
    if (!/^\d{2}-\d{7}$/.test(a.ein ?? "")) e.ein = "Enter all 9 digits, like 12-3456789";
    if (!a.businessType) e.businessType = "Choose your business type";
    if (!a.yearsInBusiness) e.yearsInBusiness = "Choose one";
    if ((a.phone ?? "").replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit phone number";
    if (s(a.street).length < 4) e.street = "Enter your street address";
    if (!s(a.city)) e.city = "Enter the city";
    if (!a.state) e.state = "Choose a state";
    if (!/^\d{5}(-\d{4})?$/.test(a.zip ?? "")) e.zip = "Enter a 5-digit ZIP";
    if (a.website && !/^https?:\/\/\S+\.\S+/.test(a.website)) e.website = "Start with https://";
  }
  if (step === 1) {
    if (!a.categories?.length) e.categories = "Choose at least one category";
    if (!a.productCount) e.productCount = "Choose one";
    if (!a.ownBrand) e.ownBrand = "Choose one";
    if (!s(a.brands)) e.brands = "List at least one brand";
  }
  if (step === 2) {
    if (!a.usWarehouse) e.usWarehouse = "Choose yes or no";
    if (a.usWarehouse === "yes" && !a.warehouseState) e.warehouseState = "Choose the warehouse state";
    if (!a.shipsAllStates) e.shipsAllStates = "Choose yes or no";
    if (!a.handlingTime) e.handlingTime = "Choose your handling time";
  }
  if (step === 3) {
    if (!a.productData) e.productData = "Choose how you’ll share product data";
    if (!/^\d+$/.test(a.moq ?? "") || Number(a.moq) < 1) e.moq = "Enter a whole number, 1 or more";
  }
  return e;
}

/** The critical requirements the automatic screening checks. */
export function critFails(a: ApplicationForm): string[] {
  const c: string[] = [];
  if (a.usWarehouse === "no") c.push("You don’t ship from a US warehouse");
  if (a.shipsAllStates === "no") c.push("You can’t ship to all 50 states");
  if (a.productData === "none") c.push("Your product data isn’t ready to share yet");
  return c;
}

/** "12-3456789" as the applicant types. */
export const formatEin = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  return d.length > 2 ? `${d.slice(0, 2)}-${d.slice(2)}` : d;
};

/** The big progress bar: Account, Application, Our review, Documents, Approved. */
export const PROGRESS = ["Account", "Application", "Our review", "Documents", "Approved"];
export function progressIndex(stage: SupplierStage | null): number {
  switch (stage) {
    case null:
    case "DRAFT":
    case "AUTO_REJECTED":
      return 1;
    case "APPLIED":
    case "SCREENED":
    case "SCORECARD":
    case "DECLINED":
      return 2;
    case "DOCUMENTS":
      return 3;
    default:
      return 5;
  }
}

/** Documents in place: uploaded and not sent back or expired. */
export const docsDone = (app: MyApplication) =>
  app.requiredDocuments.filter((r) => {
    const d = app.documents.find((x) => x.type === r.type);
    return d && d.status !== "REJECTED" && d.status !== "EXPIRED";
  }).length;

export const MAX_DOC_BYTES = 10 * 1024 * 1024;
export const DOC_ACCEPT = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";

export function saveBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function fileNameFrom(disposition: string | undefined, fallback: string) {
  if (!disposition) return fallback;
  const star = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(disposition);
  if (star) return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain ? plain[1] : fallback;
}

export const fileSize = (bytes: number) =>
  bytes / 1024 < 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
