import Link from "next/link";
import { Home, Pizza } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-16">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-orange-300/20 blur-3xl" />

      <section className="relative w-full max-w-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <Pizza aria-hidden="true" size={34} />
        </div>

        <p className="text-8xl font-bold tracking-tight text-primary sm:text-9xl">404</p>
        <h1 className="mt-5 text-2xl font-semibold text-foreground sm:text-3xl">Không tìm thấy trang</h1>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted-foreground">
          Có vẻ bạn đã đi lạc khỏi thực đơn PaoPizza. Trang này không tồn tại hoặc đã được chuyển đi.
        </p>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Home aria-hidden="true" size={18} />
          Về trang chủ
        </Link>
      </section>
    </main>
  );
}
