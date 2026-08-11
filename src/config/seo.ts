import type { Metadata } from "next";

export const SITE_NAME = "PaoPizza";
export const SITE_URL = "https://pizza.pao.io.vn";
export const DEFAULT_DESCRIPTION = "PaoPizza - Pizza thủ công thơm ngon, giao hàng nhanh và tiện lợi.";
export const SOCIAL_IMAGE = "/logopao.svg";

export const HOMEPAGE_FAQS = [
  {
    question: "Làm thế nào để đặt pizza tại PaoPizza?",
    answer:
      "Chọn cửa hàng phục vụ, xem thực đơn, chọn món và tùy chọn phù hợp, sau đó thêm vào giỏ hàng để hoàn tất thông tin đặt món.",
  },
  {
    question: "Giá và món ăn có giống nhau ở tất cả cửa hàng không?",
    answer:
      "Thực đơn, giá, ưu đãi và khả năng phục vụ có thể thay đổi theo cửa hàng và thời điểm đặt món. Thông tin hiển thị sau khi bạn chọn cửa hàng là thông tin dùng để đặt hàng.",
  },
  {
    question: "Thời gian giao pizza được tính như thế nào?",
    answer:
      "Thời gian giao hàng là ước tính và có thể thay đổi theo khoảng cách, thời tiết và lượng đơn tại cửa hàng. PaoPizza sẽ xác nhận thông tin phù hợp với đơn hàng của bạn.",
  },
  {
    question: "Tôi cần thay đổi hoặc hủy đơn hàng thì làm gì?",
    answer:
      "Hãy liên hệ cửa hàng sớm nhất qua trang liên hệ để được hỗ trợ. Khả năng thay đổi hoặc hủy đơn phụ thuộc vào trạng thái xử lý đơn hàng.",
  },
] as const;

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
