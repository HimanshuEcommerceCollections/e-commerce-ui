import type { Metadata } from "next";
import { DayloraProduct } from "@/components/daylora/shop/DayloraProduct";
import type { ApiResponse } from "@/types/api/common.types";
import type { ProductDetailResponse } from "@/types/api/product.types";

type Props = { params: { id: string } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * NFR-04: SEO title, meta description and a canonical clean-slug URL per
 * product, rendered on the server from the catalog's SEO_Title,
 * Meta_Description and URL_Slug. The page accepts a SKU id or its slug.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const fallback: Metadata = { title: "Product · Daylora" };
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) return fallback;
  const path = UUID.test(params.id)
    ? `/api/products/${encodeURIComponent(params.id)}`
    : `/api/products/slug/${encodeURIComponent(params.id)}`;
  try {
    const res = await fetch(`${base}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return fallback;
    const body = (await res.json()) as ApiResponse<ProductDetailResponse>;
    const p = body.data;
    if (!p) return fallback;
    const text = p.seo?.metaDescription ?? p.parent.shortDescription ?? p.parent.description ?? p.description ?? "";
    const description = text.length > 160 ? `${text.slice(0, 157).trimEnd()}…` : text || undefined;
    const title = p.seo?.title && p.seo.title !== p.name ? p.seo.title : p.parent.name;
    const image = p.images[0]?.url;
    return {
      title: `${title} · Daylora`,
      description,
      keywords: p.seo?.keywords ?? undefined,
      alternates: p.seo?.urlSlug ? { canonical: `/product/${p.seo.urlSlug}` } : undefined,
      openGraph: { title, description, type: "website", images: image ? [image] : undefined },
    };
  } catch {
    return fallback;
  }
}

export default function ProductPage({ params }: Props) {
  return <DayloraProduct id={params.id} />;
}
