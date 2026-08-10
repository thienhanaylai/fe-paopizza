const sections = [
  {
    title: "Sử dụng dịch vụ",
    content:
      "Bạn đồng ý cung cấp thông tin chính xác khi đặt món và sử dụng website đúng mục đích. PaoPizza có quyền từ chối yêu cầu có dấu hiệu gian lận hoặc gây ảnh hưởng đến hệ thống.",
  },
  {
    title: "Đặt hàng và thanh toán",
    content:
      "Đơn hàng chỉ được xác nhận sau khi hệ thống ghi nhận đầy đủ thông tin. Giá, ưu đãi và khả năng phục vụ có thể thay đổi theo cửa hàng và thời điểm đặt món.",
  },
  {
    title: "Giao hàng, thay đổi và hủy đơn",
    content:
      "Thời gian giao hàng là ước tính và có thể bị ảnh hưởng bởi khoảng cách, thời tiết hoặc lưu lượng đơn. Hãy liên hệ cửa hàng sớm nhất nếu cần thay đổi hoặc hủy đơn.",
  },
  {
    title: "Nội dung và quyền sở hữu",
    content:
      "Tên thương hiệu, hình ảnh, nội dung và thiết kế trên website thuộc PaoPizza hoặc bên cấp quyền và không được sao chép cho mục đích thương mại khi chưa có sự đồng ý.",
  },
];

export default function TermsPage() {
  return (
    <div className="bg-background py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Điều khoản sử dụng</h1>
          <p className="mt-3 text-sm text-muted-foreground">Cập nhật ngày 10/08/2026</p>
        </header>
        <div className="space-y-8">
          {sections.map(section => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{section.content}</p>
            </section>
          ))}
          <section>
            <h2 className="text-xl font-semibold text-foreground">Hỗ trợ</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Mọi thắc mắc về điều khoản sử dụng có thể gửi qua{" "}
              <a className="font-medium text-primary hover:underline" href="/contact">
                trang liên hệ
              </a>
              .
            </p>
          </section>
        </div>
      </article>
    </div>
  );
}
