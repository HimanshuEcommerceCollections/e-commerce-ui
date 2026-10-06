import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DayloraProduct } from "@/components/daylora/shop/DayloraProduct";
import type { ApiResponse } from "@/types/api/common.types";
import type { ProductDetailResponse } from "@/types/api/product.types";

type Props = { params: { slugOrId: string } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The product, or "missing" (404) / null (API unreachable: the client retries). */
const loadProduct = cache(async (ref: string): Promise<ProductDetailResponse | "missing" | null> => {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return null;
  const path = UUID.test(ref)
    ? `/api/products/${encodeURIComponent(ref)}`
    : `/api/products/slug/${encodeURIComponent(ref)}`;
  try {
    // Stock and price must be current, so no caching.
    const res = await fetch(`${base}${path}`, { cache: "no-store" });
    if (res.status === 404 || res.status === 400) return "missing";
    if (!res.ok) return null;
    const body = (await res.json()) as ApiResponse<ProductDetailResponse>;
    return body.data ?? "missing";
  } catch {
    return null;
  }
});

/**
 * NFR-04: SEO title, meta description and the canonical clean-slug URL per
 * product, rendered on the server from the catalog's SEO_Title,
 * Meta_Description and URL_Slug. The page accepts a SKU id or its slug.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await loadProduct(params.slugOrId);
  if (p === "missing") return { title: "Product not found", robots: { index: false } };
  if (!p) return { title: "Product" };
  const text = p.seo?.metaDescription ?? p.parent.shortDescription ?? p.parent.description ?? p.description ?? "";
  const description = text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text || undefined;
  const title = p.seo?.title || p.parent.name;
  const image = p.images[0]?.url ?? p.variants.find((v) => v.id === p.id)?.primaryImageUrl ?? undefined;
  const slug = p.seo?.urlSlug;
  return {
    // The SEO title is the full title, without the store-name template.
    title: { absolute: title },
    description,
    keywords: p.seo?.keywords ?? undefined,
    alternates: slug ? { canonical: `/product/${slug}` } : undefined,
    openGraph: { title, description, type: "website", url: slug ? `/product/${slug}` : undefined, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const p = await loadProduct(params.slugOrId);
  if (p === "missing") notFound();
  return <DayloraProduct requested={params.slugOrId} initial={p} />;
}
