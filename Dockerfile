FROM node:22-alpine

WORKDIR /app

# Cài đặt thư viện cần thiết cho Next.js trên Alpine
RUN apk add --no-cache libc6-compat

# Cấu hình biến môi trường
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
ENV NEXT_PUBLIC_API_URL="https://apipaopizza.ngb.id.vn"

# Tạo user để bảo mật
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# COPY TRỰC TIẾP TỪ MÁY BẠN VÀO DOCKER (Không dùng --from=builder nữa)
COPY ./public ./public
COPY --chown=nextjs:nodejs ./.next/standalone ./
COPY --chown=nextjs:nodejs ./.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]