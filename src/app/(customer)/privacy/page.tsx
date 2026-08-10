const sections = [
  {
    title: "Thông tin chúng tôi thu thập",
    content:
      "PaoPizza có thể thu thập thông tin liên hệ, địa chỉ giao hàng, lịch sử đơn hàng và dữ liệu cần thiết để xử lý thanh toán khi bạn sử dụng dịch vụ.",
  },
  {
    title: "Mục đích sử dụng",
    content:
      "Thông tin được sử dụng để xác nhận và giao đơn, hỗ trợ khách hàng, quản lý tài khoản, cải thiện dịch vụ và thực hiện các nghĩa vụ pháp lý liên quan.",
  },
  {
    title: "Bảo vệ và chia sẻ dữ liệu",
    content:
      "PaoPizza áp dụng các biện pháp phù hợp để bảo vệ dữ liệu. Thông tin chỉ được chia sẻ với đơn vị hỗ trợ vận hành khi cần thiết hoặc theo yêu cầu hợp pháp.",
  },
  {
    title: "Quyền của khách hàng",
    content:
      "Bạn có thể yêu cầu xem, cập nhật hoặc xóa thông tin cá nhân theo phạm vi pháp luật cho phép bằng cách liên hệ với PaoPizza.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="bg-background py-12 sm:py-16">
      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-10 border-b border-border pb-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Chính sách bảo mật</h1>
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
            <h2 className="text-xl font-semibold text-foreground">Liên hệ</h2>
            <p className="mt-3 leading-7 text-muted-foreground">
              Nếu có câu hỏi về quyền riêng tư, vui lòng gửi thông tin qua{" "}
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
