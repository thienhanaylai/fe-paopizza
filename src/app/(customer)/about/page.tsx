import { Heart, Leaf, Sparkles, Wheat } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const storyMoments = [
  {
    year: "2020",
    title: "Bắt đầu từ một chiếc lò nhỏ",
    content:
      "PaoPizza khởi đầu bằng một chiếc lò nóng, vài bao bột và niềm tin rằng một bữa pizza ngon có thể khiến ngày thường trở nên đáng nhớ. Những ngày đầu, chúng tôi tự tay nhào từng mẻ bột, thử đi thử lại công thức sốt cà chua để tìm ra hương vị vừa đủ đậm đà, gần gũi với khẩu vị Việt.",
  },
  {
    year: "2021",
    title: "Tử tế trong từng mẻ bánh",
    content:
      "Khi những đơn hàng đầu tiên được gửi đi, chúng tôi hiểu rằng khách hàng không chỉ chờ một chiếc pizza nóng hổi. Đó còn là sự yên tâm về nguyên liệu, sự chỉn chu trong từng chiếc hộp và cảm giác được chăm chút như một bữa ăn nhà. Từ đó, mỗi công đoạn đều được làm kỹ hơn một chút.",
  },
  {
    year: "Hôm nay",
    title: "Lớn lên cùng những cuộc hẹn",
    content:
      "Từ những buổi tụ họp bạn bè đến bữa tối vội sau giờ làm, PaoPizza may mắn được hiện diện trong rất nhiều khoảnh khắc giản dị. Chúng tôi vẫn tiếp tục lắng nghe, làm mới thực đơn và hoàn thiện dịch vụ mỗi ngày, để bất cứ khi nào bạn muốn quây quần, PaoPizza luôn sẵn sàng ở đó.",
  },
];

const values = [
  {
    icon: Wheat,
    title: "Làm từ điều cơ bản",
    content: "Bột bánh được chuẩn bị cẩn thận để tạo nên lớp đế thơm, mềm và vừa vặn.",
  },
  {
    icon: Leaf,
    title: "Chọn nguyên liệu kỹ",
    content: "Mỗi nguyên liệu đều được chọn với mong muốn mang đến hương vị tươi ngon, rõ ràng.",
  },
  {
    icon: Heart,
    title: "Phục vụ bằng sự chân thành",
    content: "Chúng tôi trân trọng từng đơn hàng và những phản hồi giúp PaoPizza tốt hơn mỗi ngày.",
  },
];

const galleryImages = [
  {
    src: "https://res.cloudinary.com/dxrrdqgss/image/upload/v1785916423/b55ri7sz2jcspadipyoj.jpg",
    alt: "Khoảnh khắc tại PaoPizza",
  },
  {
    src: "https://res.cloudinary.com/dxrrdqgss/image/upload/v1785916424/uc7lwox4denki0myfbb2.png",
    alt: "Không gian và hương vị PaoPizza",
  },
  {
    src: "https://res.cloudinary.com/dxrrdqgss/image/upload/v1785916423/vvfb28s6evdzlg85zkjl.jpg",
    alt: "Pizza PaoPizza vừa ra lò",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background">
      <section className="overflow-hidden border-b border-border bg-card">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles size={14} /> Câu chuyện của PaoPizza
            </div>
            <h1 className="max-w-xl text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Một chiếc pizza ngon bắt đầu từ mong muốn được quây quần.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              PaoPizza là nơi chúng tôi gửi gắm tình yêu với những bữa ăn ấm áp: một chiếc bánh vừa ra lò, một bàn ăn đầy tiếng
              cười và những người thân quen ngồi gần nhau hơn.
            </p>
            <Link
              href="/#menu"
              className="mt-8 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Khám phá thực đơn
            </Link>
          </div>
          <div className="relative mx-auto h-[330px] w-full max-w-lg sm:h-[420px]">
            <div className="absolute inset-4 -rotate-3 rounded-[2rem] bg-primary/15" />
            <div className="relative h-full overflow-hidden rounded-[2rem] shadow-2xl">
              <Image
                src={galleryImages[2].src}
                alt="Không gian PaoPizza"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-20 text-white">
                <p className="text-sm font-medium">Nóng hổi từ lò, trọn vị trong từng khoảnh khắc.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Từ năm 2020</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Chúng tôi kể câu chuyện bằng hương vị</h2>
          <p className="mx-auto mt-5 max-w-2xl leading-7 text-muted-foreground">
            Có những điều không cần quá cầu kỳ để chạm đến người khác. Với PaoPizza, đó là sự kiên nhẫn khi làm bột, là mùi phô
            mai tan chảy trong bếp và lời nhắn cảm ơn dành cho mỗi vị khách.
          </p>
        </div>
        <div className="mt-12">
          {storyMoments.map(moment => (
            <article
              key={moment.year}
              className="grid grid-cols-[72px_1fr] gap-4 border-l border-border pb-10 last:pb-0 sm:grid-cols-[110px_1fr] sm:gap-7"
            >
              <div className="-ml-px">
                <span className="-translate-x-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground sm:-translate-x-4">
                  {moment.year}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">{moment.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">{moment.content}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Những khoảnh khắc của chúng tôi</p>
          <h2 className="mt-3 text-3xl font-bold text-foreground">Một góc nhỏ của PaoPizza</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map(image => (
              <div key={image.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted shadow-sm">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Điều chúng tôi theo đuổi</p>
        <h2 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Không chỉ là pizza, mà là trải nghiệm sẻ chia</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, content }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon size={22} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{content}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <Heart className="mx-auto text-primary" size={28} fill="currentColor" />
        <h2 className="mt-4 text-3xl font-bold text-foreground">Cảm ơn vì đã để PaoPizza đồng hành</h2>
        <p className="mt-4 leading-7 text-muted-foreground">
          Mỗi lần bạn chọn PaoPizza là thêm một lý do để chúng tôi giữ lửa với căn bếp của mình. Hẹn gặp bạn trong bữa ăn tiếp
          theo nhé.
        </p>
      </section>
    </div>
  );
}
