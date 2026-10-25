import type { Metadata } from "next";
import { OG_IMAGE } from "@/lib/site";
import { strings } from "@/lib/strings";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
}

export function pageMetadata({
  title,
  description,
  path,
}: PageMetadataInput): Metadata {
  const socialTitle = `${title} — ${strings.header.brand}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      locale: "es_MX",
      siteName: strings.header.brand,
      url: path,
      title: socialTitle,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
