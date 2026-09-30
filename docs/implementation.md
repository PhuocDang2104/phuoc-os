# Phase 1 — Repo foundation & Home

## Visual direction

Nền graphite/đen, accent lavender, Geist + Geist Mono self-host, border mảnh,
cửa sổ có hierarchy rõ. Navbar mảnh và file launcher hai cột ở góc trái trên.
Nền Home chỉ có neural field, không có hero/watermark/caption. About dạng thẻ ID ngang, Journey dạng log dọc bên phải mở sẵn; Work Gallery tự mở ở đáy. NAV.AI là popup toàn site, giữ nguyên vị trí và trạng thái qua các trang, chỉ đóng khi người dùng bấm x.

Home có 3 trải nghiệm khác nhau:

1. Profile Desk: giới thiệu, lối tắt cho recruiter, NAV.AI và Work Gallery.
2. AI Lab: stack, research, experiments.
3. Neural Core: vùng khám phá dạng spherical point cloud với bốn portal.

Work / Research có archive bài viết, dự án thật và bài paper cùng asset đã chuyển từ portfolio cũ; Blog chờ nội dung thật. Social ghi lại SAVINA/HumanLog và để ngỏ hoạt động từ thiện, CLB khi có bằng chứng. Awards dùng ảnh chứng nhận thật, inspector kéo xoay 3D và tỷ lệ ảnh tự nhiên.

## Các lựa chọn triển khai

- **Next.js App Router / React / TypeScript**; CSS được tách theo shell, desktop,
  app. Chưa cần Tailwind/GSAP/Three.js để đáp ứng phần này.
- **Canvas 2D procedural** tạo neural field và projection 3D của core. Ít dependency,
  có animation vòng đời rõ, hoạt động không cần WebGL. Core được dynamic import.
- **Window manager nhẹ:** state trong Shell, z-order theo focus, state giữ khi
  điều hướng sang trang khác; không lưu session vào localStorage ngoài motion preference.
- **Native dialog** cho command palette và popup mèo, hỗ trợ focus trap/Escape.
- **Milo:** smart shortcuts, hints theo workspace và chat nhiều lượt qua Groq/FastAPI
  khi backend có khóa. UI cho biết trạng thái kết nối khi chưa bật backend.
  Pixel art SVG nhiều lớp được tạo trong code; locomotion bằng requestAnimationFrame,
  pose bằng CSS. Đi/chạy, duỗi người, nhảy lên title bar, leo tường và đáp xuống.
  Click nền đổi động tác; click mèo để nằm/ngủ. Bong bóng đổi theo hành động, assistant
  mở qua navbar/bong bóng. Dừng chuyển động khi tab ẩn hoặc bật reduced motion.
- **Gallery:** hai nhóm thumbnail lặp với số bản sao thích ứng chiều rộng màn hình,
  autoplay dừng khi hover/focus, có kéo/vuốt, nút tiến/lùi, pause và minimize/restore.
  Các ảnh SVG là minh họa demo/hướng nghiên cứu, không phải case study khách hàng.
- **MNIST CNN pretrained** từ Microsoft, input 28×28 float32. Preprocessing crop
  vùng mực, giữ aspect ratio, fit trong 20×20, cân giữa theo center of mass. Softmax
  từ logits; tự điều hướng khi số 1–6 đạt confidence >=65%, không cần xác nhận. Confidence
  là score của model, không phải bảo đảm đúng. Không gửi ảnh tới API.
- **Lazy WASM:** single thread để không cần cross-origin isolation. Runtime assets
  cùng origin; không phụ thuộc CDN. Model và runtime chưa tải ở Home first paint.
- **Backend:** chưa có CRUD/contact form nên không tạo schema giả. CORS cho GET và POST,
  vì chat dùng `POST /ai/chat`. Khóa Groq lưu trong biến môi trường backend.
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

Milo có các hành trình được phối hợp, chưa có physics/collision engine cho mọi
cửa sổ; mobile ưu tiên đi/chạy/nhảy thấp. Core dùng toán học 3D và Canvas 2D, chưa dùng Three.js/WebGL. Không có
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

## Nâng cấp Home / NAV.AI / Milo (2026-09-30)

- Navbar 38px trên desktop, file launcher hai cột; bỏ toàn bộ chữ trang trí trên nền.
- NAV.AI mở ngay trong Profile Desk, có canvas dùng toàn bộ diện tích khung vẽ;
  Projects mở carousel. Trên mobile popup nằm trên Milo để không cản thao tác vẽ.
- Carousel lặp thích ứng cả màn hình rộng, có hover/focus pause và kéo/vuốt.
- Milo lớn hơn, SVG nhiều lớp, có locomotion và phản ứng click. Đã quan sát trực tiếp
  chuỗi walk/run/stretch/jump/climb trong trình duyệt và kiểm tra pose lie khi click.
- Playwright: 25 test đạt trên desktop/mobile; 1 test drag desktop bỏ qua ở mobile.
  Bao gồm nhận diện CNN thật với chuột/cảm ứng, fallback và reduced motion.
- Production build, ESLint, TypeScript và Prettier: đạt. Kiểm tra thêm trên production
  server: CNN nhận diện nét vẽ sát mép trái khung; gallery lifecycle đạt ở cả desktop/mobile.
- Kiểm tra hình ảnh ở 390, 1440 và 2560px: không tràn ngang; NAV.AI và gallery có
  giới hạn chiều cao riêng. Các phần nội dung dài cuộn trong popup.

## Mở rộng tương tác và archive

- Milo hỗ trợ kéo/thả bằng chuột hoặc chạm, có pose lúc được nhấc và chuyển động đáp
  xuống. Click ngắn vẫn làm mèo nằm. Popup chat lưu lịch sử trong phiên và gửi từng
  lượt qua FastAPI tới Groq; khi chưa có backend/khóa, trạng thái được báo rõ.
- `GET /ai/status` chỉ trả trạng thái sẵn sàng; `POST /ai/chat` kiểm tra độ dài và vai
  trò tin nhắn, ghép system prompt từ các dữ kiện đã xác nhận. Backend giữ khóa,
  giới hạn số lượt ngữ cảnh và xử lý lỗi provider mà không trả khóa về trình duyệt.
- NAV.AI tự mở đích sau nhận diện số 1–6 đủ tự tin. State cửa sổ giữ trong Shell,
  nên trở lại Home vẫn thấy popup. Các nút chọn đích vẫn hoạt động khi model lỗi.
- Theme sáng/tối lưu trong localStorage. View Transition dùng bước pixel; reduced motion
  bỏ hiệu ứng. GitHub/LinkedIn hiện trên navbar cả mobile.
- Work/Research dùng dữ liệu trong `frontend/lib/editorial.ts`: thư mục chủ đề, search, index và bài đọc. Dự án, chứng chỉ và paper lấy từ portfolio cũ và thư mục paper do chủ website cung cấp.
- Playwright kiểm tra desktop/mobile, cửa sổ, carousel, NAV.AI, Contact, Social và paper; backend có 9 kiểm thử. Groq cần khóa backend để gọi model trực tiếp.
