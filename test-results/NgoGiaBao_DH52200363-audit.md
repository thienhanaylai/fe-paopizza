# Báo cáo kiểm thử đối chiếu luận văn PaoPizza

- Tài liệu đối chiếu: `NgoGiaBao_DH52200363.pdf` (110 trang)
- Ngày kiểm thử: 12/08/2026
- Phạm vi: frontend, backend, API không làm thay đổi dữ liệu, cấu hình build và đối chiếu mã nguồn
- Môi trường backend: `NODE_ENV=production`, API local tại `http://localhost:4000/api/v1`

## 1. Kết luận nhanh

Kết luận 7/7 mục "Đạt" ở Bảng 5-1 của luận văn chưa được bằng chứng kiểm thử hiện tại hỗ trợ đầy đủ.

| Phạm vi chấm | Pass | Fail | Blocked | Tỷ lệ trên test đã đánh giá |
|---|---:|---:|---:|---:|
| 7 mục chức năng chính của báo cáo | 22 | 11 | 7 | **66,7%** |
| Toàn bộ chức năng + NFR + bảo mật + chất lượng mã | 27 | 23 | 10 | **54,0%** |
| API smoke/validation không ghi dữ liệu | 24 | 0 | 0 | **100%** |

`Blocked` không được tính là Pass hoặc Fail. Các test tạo/sửa/xóa dữ liệu không được chạy vì backend đang dùng cấu hình production. Kiểm thử giao diện bằng Browser bị chặn vì phiên này không có in-app browser khả dụng.

## 2. Các lỗi quan trọng

| Mức độ | Lỗi | Bằng chứng | Ảnh hưởng |
|---|---|---|---|
| Critical | Giỏ khách vãng lai không thêm được món mới | `src/context/cartContext.tsx:771` comment khai báo `quantityToAdd`, nhưng `:803` vẫn sử dụng | Phát sinh `ReferenceError`, bị `catch` ở `:817`; storyboard khách vãng lai có thể dừng ngay bước thêm giỏ |
| Critical | Backend không cộng giá extra topping vào tổng đơn | `be-paopizza/src/modules/order/order.service.js:111-134`, tổng tại `:219` chỉ dùng giá biến thể | Giá hiển thị frontend và số tiền backend/QR có thể lệch; có thể đặt topping nhưng không trả tiền topping |
| Critical | Giá combo động tin giá do client gửi | `be-paopizza/src/modules/order/order.service.js:191-195` | Client có thể gửi `price` thấp hơn giá đúng |
| High | POS không nhận ra QR đã thanh toán | `src/services/payment.service.ts` trả thẳng `PaymentStatusData`; POS đọc `res.data.paymentStatus` tại `src/app/(employee)/is/(employee-layout)/pos/page.tsx:228` | Polling lặp lỗi, màn hình POS không chuyển thành công |
| High | Phí giao hàng chỉ tính ở frontend | `CheckoutModal.tsx:356-357` và POS `page.tsx:645-647`; backend `order.service.js:305` chỉ lấy `subTotal - discount` | UI có thể báo thêm 25.000đ nhưng đơn/QR backend không thu khoản đó |
| High | Có thể giả mạo `customer_id` và `employee_id` | `order.controller.js:20-21,64-67`; route tạo đơn dùng `optionalAuth` | Gắn đơn vào khách/nhân viên khác; vẫn có thể lạm dụng mã đổi điểm bằng ID khách hợp lệ |
| High | Cập nhật đơn, kho, điểm, khuyến mãi không nằm trong transaction | `order.service.js:328-342` và `:645-675` | Một bước sau thất bại có thể để lại đơn đã tạo/hoàn thành nhưng kho, điểm hoặc lượt mã chưa đồng bộ |
| High | Timeout thanh toán không thống nhất | Checkout 3 phút (`CheckoutModal.tsx:308`), backend 10 phút (`autoCancelOrder.js:5`), lịch sử 15 phút (`orders/page.tsx:13`) | UI báo hết hạn trong khi đơn còn hiệu lực hoặc cho thanh toán khi backend đã hủy |
| High | Build production bỏ qua lỗi TypeScript | `next.config.ts:6-8`; `npx tsc --noEmit` có 72 lỗi | Build báo thành công dù tồn tại lỗi kiểu có liên quan trực tiếp tới runtime |
| Medium | Menu không chứa chương trình khuyến mãi theo cửa hàng | `menu.model.js` chỉ có products/combos; danh sách promotion yêu cầu đăng nhập | Không đúng mô tả "menu ... sản phẩm, combo và chương trình khuyến mãi" |
| Medium | Không tự ẩn món theo tồn kho | `menu.service.js:235-255` chỉ lọc trạng thái/launch date, không kiểm tra kho | Món hết nguyên liệu vẫn có thể xuất hiện trên menu |
| Medium | Kho cho phép âm | `inventory.service.js:402-433` | Không bảo đảm ngăn bán món hết nguyên liệu như mục tiêu báo cáo |
| Medium | Trang menu chính không SSR dữ liệu sản phẩm | `src/app/(customer)/page.tsx:1,207-214` là Client Component và fetch trong `useEffect` | HTML ban đầu có metadata nhưng không có tên sản phẩm; tuyên bố SSR tối ưu SEO chỉ đúng một phần |
| Medium | API/controller chấp nhận `card`, `ewallet` nhưng model chỉ nhận `cash`, `qrCode` | `order.controller.js:7`; `order.model.js:10,217-220` | Request qua validation rồi có thể lỗi Mongoose/500 |
| Medium | Payment status công khai theo ObjectId | `payment.route.js:7` không có auth | Người biết ID đơn có thể xem số tiền và trạng thái thanh toán |
| Low | Bộ test API cấu hình hỏng | `package.json` trỏ `scripts/run-api-tests.js`, nhưng file không tồn tại | `npm run test:api` không chạy được |
| Low | Postman coverage thấp | 114 request nhưng chỉ 9 test scripts | Collection chủ yếu là request mẫu, chưa phải regression suite |

## 3. Ma trận test case theo 7 mục chức năng

### 3.1 Hiển thị menu linh hoạt theo cửa hàng

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| MENU-01 | Lấy danh sách chi nhánh công khai | API live | PASS - 25 cửa hàng |
| MENU-02 | Lấy menu cửa hàng A | API live | PASS - 87 sản phẩm, 3 combo |
| MENU-03 | Lấy menu cửa hàng B | API live | PASS - 24 sản phẩm, 3 combo |
| MENU-04 | Menu hai cửa hàng thực sự khác nhau | API live | PASS |
| MENU-05 | Menu trả promotion đang áp dụng riêng theo cửa hàng | API + source | FAIL |
| MENU-06 | Món thiếu nguyên liệu tự biến mất khỏi menu | Source | FAIL |

### 3.2 Quản lý biến thể sản phẩm chi tiết

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| VAR-01 | Pizza trả đủ size S/M/L | API live | PASS - mẫu 5/5 pizza |
| VAR-02 | Mỗi size có danh sách loại đế | API live | PASS |
| VAR-03 | Dữ liệu công thức/topping có trong API và modal | API + source | PASS |
| VAR-04 | Chọn size, đế, topping bằng giao diện ở desktop/mobile | Browser | BLOCKED |

### 3.3 Quản lý giỏ hàng linh hoạt

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| CART-01 | Có cơ chế đọc/ghi giỏ guest bằng localStorage | Source | PASS |
| CART-02 | Guest thêm sản phẩm mới vào giỏ | Typecheck + source | FAIL - `quantityToAdd` không tồn tại |
| CART-03 | Guest tăng/giảm/xóa và khôi phục sau reload | Browser | BLOCKED |
| CART-04 | API cart yêu cầu đăng nhập | API live | PASS - 401 khi không có token |
| CART-05 | Cart tài khoản được lưu database và đồng bộ sau đăng nhập | E2E có ghi dữ liệu | BLOCKED |

### 3.4 Phương thức thanh toán đa dạng

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| PAY-01 | Checkout có lựa chọn tiền mặt | Source | PASS |
| PAY-02 | Checkout có lựa chọn QR | Source | PASS |
| PAY-03 | API tạo QR kiểm tra payload thiếu | API live | PASS - 400 |
| PAY-04 | Webhook không token bị từ chối | API live | PASS - 403 |
| PAY-05 | Mock webhook bị chặn ở production | API live | PASS - 403 |
| PAY-06 | POS phát hiện thanh toán QR thành công | Typecheck + source | FAIL - đọc sai shape response |
| PAY-07 | Timeout thống nhất giữa các màn hình/backend | Source | FAIL - 3/10/15 phút |
| PAY-08 | Thanh toán thật qua SePay và nhận biến động số dư | External E2E | BLOCKED |

### 3.5 Hỗ trợ xử lý đơn hàng đa kênh

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| ORDER-01 | Schema hỗ trợ dine-in/carry-out/delivery | Source | PASS |
| ORDER-02 | Tạo đơn online thực tế | E2E có ghi dữ liệu | BLOCKED |
| ORDER-03 | Tạo đơn POS thực tế | E2E có ghi dữ liệu | BLOCKED |
| ORDER-04 | API quản lý đơn yêu cầu xác thực | API live | PASS - 401 |
| ORDER-05 | Backend bắt buộc địa chỉ cho delivery | Source | FAIL - chỉ frontend kiểm tra |
| ORDER-06 | Tổng tiền delivery frontend/backend giống nhau | Source | FAIL - backend thiếu phí giao hàng |

### 3.6 Xử lý giao dịch tự động

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| TXN-01 | Webhook hợp lệ có logic cập nhật `paymentStatus=success` | Source | PASS |
| TXN-02 | Cron hủy đơn QR pending quá hạn | Source + backend startup | PASS |
| TXN-03 | Webhook SePay thật cập nhật đúng đơn | External E2E | BLOCKED |
| TXN-04 | Frontend polling trạng thái định kỳ | Source | PASS - 3 giây/lần |
| TXN-05 | Thanh toán, đơn, khuyến mãi và các side effect là atomic | Source | FAIL - không có transaction |

### 3.7 Đồng bộ tồn kho

| ID | Test case | Phương pháp | Kết quả |
|---|---|---|---|
| INV-01 | Khi đơn chuyển completed thì gọi trừ kho | Source | PASS |
| INV-02 | Chuyển completed lặp lại không trừ kho hai lần | Source | PASS - filter `$ne: completed` |
| INV-03 | Có API cảnh báo low-stock | Source | PASS |
| INV-04 | Trừ kho và cập nhật trạng thái đơn trong cùng transaction | Source | FAIL |
| INV-05 | Không cho tồn kho xuống âm | Source | FAIL - chủ động cho phép âm |
| INV-06 | Menu tự ngắt món hết nguyên liệu | Source | FAIL |

## 4. Test phi chức năng, bảo mật và chất lượng

| ID | Test case | Kết quả |
|---|---|---|
| NFR-01 | `npm run build` frontend production | PASS |
| NFR-02 | `npx tsc --noEmit` | FAIL - 72 lỗi |
| NFR-03 | ESLint frontend | FAIL - 64 errors, 43 warnings |
| NFR-04 | ESLint backend | FAIL - 1 error, 9 warnings |
| NFR-05 | Metadata title/description có trong HTML server | PASS |
| NFR-06 | Nội dung menu/sản phẩm có trong HTML SSR | FAIL |
| NFR-07 | Responsive trên mobile/tablet/POS | BLOCKED - Browser unavailable |
| NFR-08 | `docker compose config` | BLOCKED - máy kiểm thử không có Docker CLI |
| NFR-09 | Helmet và CORS từ chối origin lạ | PASS |
| NFR-10 | Cloudflare/DDoS ngoài production | BLOCKED |
| NFR-11 | Chống race condition/điều phối tải cao | FAIL - không queue/transaction |
| SEC-01 | Mã đổi điểm không customer bị chặn khi tạo đơn | PASS - source |
| SEC-02 | Không thể giả mạo `customer_id` | FAIL |
| SEC-03 | Không thể giả mạo `employee_id` | FAIL |
| SEC-04 | Backend tự tính giá topping | FAIL |
| SEC-05 | Backend tự tính giá combo động | FAIL |
| SEC-06 | API validation/security smoke suite | PASS - 24/24 |
| SEC-07 | `npm run test:api` chạy được | FAIL - thiếu script |
| SEC-08 | Collection Postman có assertion cho phần lớn request | FAIL - 9/114 |
| SEC-09 | Payment status không lộ cho người không xác thực | FAIL |

## 5. Kết quả API smoke/validation không ghi dữ liệu

| ID | Endpoint/kiểm tra | Kết quả |
|---|---|---|
| API-01 | `GET /health` | PASS 200 |
| API-02 | `GET /stores?limit=2` | PASS 200 |
| API-03 | `GET /menus/store/{storeA}` | PASS 200 |
| API-04 | `GET /menus/store/{storeB}` | PASS 200 |
| API-05 | So sánh menu A/B | PASS - khác nhau |
| API-06 | `GET /products/active` | PASS 200 |
| API-07 | `GET /combos/active` | PASS 200 |
| API-08 | `GET /categories` | PASS 200 |
| API-09 | `GET /orders` không token | PASS 401 |
| API-10 | `GET /inventory/{store}` không token | PASS 401 |
| API-11 | `GET /promotions` không token | PASS 401 |
| API-12 | `GET /users` không token | PASS 401 |
| API-13 | `POST /orders` body rỗng | PASS 400 |
| API-14 | `POST /promotions/apply` body rỗng | PASS 400 |
| API-15 | `POST /payments/create` body rỗng | PASS 400 |
| API-16 | `POST /payments/sepay-webhook` không token | PASS 403 |
| API-17 | Mock webhook ở production | PASS 403 |
| API-18 | Menu với store ID sai định dạng | PASS 400 |
| API-19 | Payment status với order ID sai định dạng | PASS 400 |
| API-20 | Track order thiếu phone/order ID | PASS 400 |
| API-21 | Apply code không tồn tại | PASS 200, `valid=false` |
| API-22 | Route không tồn tại | PASS 404 |
| API-23 | Header `X-Content-Type-Options` | PASS `nosniff` |
| API-24 | CORS với origin lạ | PASS - không trả ACAO |

## 6. Sai khác trực tiếp với nội dung báo cáo

1. Báo cáo nói menu theo cửa hàng gồm sản phẩm, combo và promotion; model/menu API hiện không có promotion.
2. Báo cáo nói giỏ guest lưu localStorage và hoạt động liền mạch; code hiện không thêm được item mới do `quantityToAdd` chưa khai báo.
3. Báo cáo nói POS hỗ trợ QR; polling POS hiện đọc sai response.
4. Báo cáo nói SSR bằng Next.js để tối ưu SEO; trang menu là Client Component và dữ liệu menu chỉ tải trong `useEffect`.
5. Báo cáo nói tránh race condition/toàn vẹn dữ liệu; chưa có message queue hoặc transaction đa document.
6. Báo cáo nói tồn kho giúp ngắt hiển thị món hết; menu không tham chiếu tồn kho và tồn kho còn cho phép âm.
7. Bảng 5-1 ghi 7/7 mục đạt nhưng chương 4 chủ yếu dùng ảnh minh họa và kết luận thủ công, không có test case, expected result, actual result hay assertion có thể tái chạy.

## 7. Ưu tiên sửa

1. Sửa `quantityToAdd`, POS polling và tính giá delivery/topping ở backend.
2. Không nhận `customer_id`, `employee_id` từ client khi đã có JWT; xác định danh tính từ token.
3. Backend tự tính toàn bộ giá combo/topping từ dữ liệu database.
4. Đồng nhất timeout bằng một cấu hình dùng chung.
5. Dùng MongoDB transaction cho tạo đơn + mã giảm giá và completed + kho + điểm.
6. Liên kết tồn kho với khả năng bán/menu.
7. Bật typecheck trong build, sửa 72 lỗi TypeScript và bổ sung regression tests.
8. Chuyển phần dữ liệu menu cần SEO sang Server Component hoặc server data fetching.

## 8. Giới hạn lần kiểm thử

- Không tạo/sửa/xóa dữ liệu vì API đang nối tới môi trường production.
- Không chạy thanh toán thật hoặc webhook thật.
- Không kiểm tra trực quan responsive/touch vì in-app Browser không khả dụng trong phiên.
- Không kiểm tra Docker runtime vì Docker CLI không được cài trên máy kiểm thử.
