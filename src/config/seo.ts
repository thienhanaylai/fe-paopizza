import type { Metadata } from "next";

export const SITE_NAME = "PaoPizza";
export const SITE_URL = "https://pizza.pao.io.vn";
export const DEFAULT_DESCRIPTION = "PaoPizza - Pizza thủ công thơm ngon, giao hàng nhanh và tiện lợi.";
export const SOCIAL_IMAGE = "/logopao.svg";

type SeoMetadataOptions = {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
};

export function createSeoMetadata({
  title,
  description,
  path,
  noIndex = false,
}: SeoMetadataOptions): Metadata {
  const canonicalUrl = new URL(path, SITE_URL).toString();
  const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} | ${SITE_NAME}`;

  return {
    title: {
      absolute: fullTitle,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
        },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: SOCIAL_IMAGE,
          alt: SITE_NAME,
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SOCIAL_IMAGE],
    },
  };
}

export function createPrivateMetadata(options: Omit<SeoMetadataOptions, "noIndex">): Metadata {
  return createSeoMetadata({ ...options, noIndex: true });
}
