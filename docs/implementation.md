# Phase 1 — Repo foundation & Home

## Visual direction

Nền graphite/đen, accent lavender, Geist + Geist Mono self-host, border mảnh,
cửa sổ có hierarchy rõ. Heading và hai cửa sổ mặc định đưa tên/chuyên môn vào
first paint. Các thông số nhỏ là metadata, không thay nội dung chính.

Home có 3 trải nghiệm khác nhau:

1. Profile Desk: giới thiệu và lối tắt cho recruiter.
2. AI Lab: handwritten navigation chạy thật, stack, research, experiments.
3. Neural Core: vùng khám phá dạng spherical point cloud với bốn portal.

Work / Research / Blog / Awards giữ khung content-first, chờ đặc tả và dữ liệu
cụ thể ở phase tiếp theo đúng tài liệu gốc.

## Các lựa chọn triển khai

- **Next.js App Router / React / TypeScript**; CSS được tách theo shell, desktop,
  app. Chưa cần Tailwind/GSAP/Three.js để đáp ứng phần này.
- **Canvas 2D procedural** tạo neural field và projection 3D của core. Ít dependency,
  có animation vòng đời rõ, hoạt động không cần WebGL. Core được dynamic import.
- **Window manager nhẹ:** state trong Shell, z-order theo focus, state giữ khi
  điều hướng sang trang khác; không lưu session vào localStorage ngoài motion preference.
- **Native dialog** cho command palette và popup mèo, hỗ trợ focus trap/Escape.
- **Milo local guide:** smart shortcuts và hints theo workspace, không giả chatbot AI.
  Pixel art SVG/các trạng thái được tạo trong code để dễ chỉnh màu/chuyển động.
- **MNIST CNN pretrained** từ Microsoft, input 28×28 float32. Preprocessing crop
  vùng mực, giữ aspect ratio, fit trong 20×20, cân giữa theo center of mass. Softmax
  từ logits; chỉ điều hướng sau confirm khi số 1–6 và confidence >=65%. Confidence
  là score của model, không phải bảo đảm đúng. Không gửi ảnh tới API.
- **Lazy WASM:** single thread để không cần cross-origin isolation. Runtime assets
  cùng origin; không phụ thuộc CDN. Model và runtime chưa tải ở Home first paint.
- **Backend skeleton:** chưa có CRUD/contact form/LLM nên không tạo schema giả.
  CORS chỉ GET hiện tại; cập nhật allow_methods khi có API ghi thực tế.
- **Compose:** API chỉ bind loopback, database có volume và healthcheck. Caddy do
  host quản lý. Không chạy thêm frontend hoặc Caddy trong Docker.

## Dữ liệu cần hoàn thiện ở phase sau

- CV chính thức (thay `frontend/public/resume.pdf`).
- Học vấn, kinh nghiệm, mốc Journey có ngày tháng.
- Selected projects: ảnh/video, role, stack, contribution, kết quả, code/demo.
- Publications: tác giả, venue, năm, DOI/PDF, code và research figures.
- Awards/certificates đã xác thực.
- Bài blog hoặc build notes thực tế.
- Domain Vercel/API; cấu hình Caddy host và secrets khi deploy.

## Giới hạn có chủ ý

Milo đi ở dải dưới viewport, chưa nhảy qua title bar hoặc tìm đường trên mọi
cửa sổ. Core dùng toán học 3D và Canvas 2D, chưa dùng Three.js/WebGL. Không có
resize tự do cho cửa sổ. Các trang phụ mới là khung nội dung, không phải case
study hoàn chỉnh. Các phần này có thể mở rộng độc lập, không thay kiến trúc.

## Backup database

Chạy pg_dump định kỳ trên VM rồi copy bản dump sang nơi lưu độc lập. Ví dụ:

```sh
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' > portfolio-backup.sql
```

Không commit dump vào Git. Docker volume không thay thế backup; định kỳ kiểm tra restore.

## Kiểm chứng bản đầu (2026-09-30)

- Production build: thành công, Home và bốn trang nội dung được prerender.
- ESLint, TypeScript và Prettier: đạt.
- Playwright: 15 test đạt, 1 test drag desktop bỏ qua có chủ ý ở mobile.
- Touch drawing: đã kiểm tra thêm bằng Chromium touch events, nhận diện và điều hướng đúng.
- API: 6 test đạt; Ruff đạt. TestClient có cảnh báo deprecation của dependency httpx,
  không ảnh hưởng kết quả test.
- Docker Compose: cấu hình hợp lệ. Chưa chạy container/database thật vì Docker engine
  trên máy chưa hoạt động; chưa xác nhận database readiness hoặc migration trên PostgreSQL.
- Production browser: nhận diện số 1 bằng CNN thật; không có page error; không tải
  model/WASM ở first paint; không tràn ngang ở 1366, 768 và 390 px.
- Browser tests sử dụng Chrome/Chromium với viewport và touch emulation; chưa kiểm tra
  trên thiết bị iOS/Safari vật lý.
- Chưa push remote hoặc deploy lên Vercel/VM.
