import { createPrivateMetadata } from "@/src/config/seo";

export const metadata = createPrivateMetadata({
  title: "Danh bạ nhân viên",
  description: "Danh bạ liên hệ nhân viên trong hệ thống nội bộ PaoPizza.",
  path: "/is/contacts",
});

export default function ContactsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
