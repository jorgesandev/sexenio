import type { MetadataRoute } from "next";
import { dataset } from "@/lib/dataset";
import { ROUTES } from "@/lib/routes";
import { SITE_URL } from "@/lib/site";

const lastModified = new Date(dataset.provenance.vintage);

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: ROUTES.explorar, priority: 1 },
    { path: ROUTES.comparar, priority: 0.9 },
    { path: ROUTES.constructor, priority: 0.8 },
    { path: ROUTES.metodologia, priority: 0.6 },
  ].map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: "monthly",
    priority,
  }));
}
