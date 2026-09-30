# PHUOC.OS

Personal Engineering Workstation của **Dang Nhu Phuoc**.

Homepage theo concept desktop/Linux: hai workspace tương tác, một Neural Core riêng,
và Milo — mèo pixel kiêm trợ lý điều hướng. Nội dung cá nhân được quản lý tập trung,
frontend hoạt động độc lập với backend.

## Chạy frontend

Yêu cầu Node.js 22.13+ và npm.

```sh
npm ci
npm run dev
```

Mở http://localhost:3000. Không cần Docker hoặc API để sử dụng homepage.

```sh
npm run lint
npm run typecheck
npm run build
npm run start
```

## Đã triển khai

- **Profile Desk:** About là thẻ ID ngang, Journey là cửa sổ log dọc bên phải; cả hai cùng Work Gallery mở sẵn. Contact nằm ngay sau Awards trên navbar và mở popup toàn site.
- **Hệ cửa sổ:** kéo bằng title bar, focus, minimize/restore, close, maximize bằng
  nút hoặc double-click title bar; Escape đóng cửa sổ trên cùng.
- **NAV.AI ngay trên Home:** popup canvas chuột/chạm nhỏ gọn, CNN MNIST pretrained chạy bằng ONNX Runtime Web,
  confidence và latency thực, tự điều hướng khi nhận diện đủ chắc chắn; popup giữ trạng thái khi quay lại Home. Có đường điều hướng
  bằng nút khi model lỗi hoặc không muốn vẽ.
- **Work Gallery:** carousel ở đáy màn hình có ảnh dự án thật, chạy liên tục, kéo/vuốt, pause khi hover/focus và có nút điều khiển.
- **AI Lab:** workspace riêng cho stack, research và experiments.
- **Neural Core:** point cloud hình cầu có bốn portal đến Work, Research, Blog, Awards.
- **Milo:** mèo SVG nhiều lớp, đi/chạy, nhảy lên title bar, leo tường và đổi lời nhắn
  theo hành động. Click nền để đổi động tác; click mèo để nằm xuống, kéo để chuyển chỗ.
  Popup là chat nhiều lượt qua Groq khi cấu hình backend, có câu hỏi gợi ý, trạng thái kết nối
  và các nút điều hướng. Khóa Groq chỉ nằm trên backend.
- **Light / dark:** nút chuyển trên navbar với hiệu ứng pixel, ghi nhớ lựa chọn; GitHub
  và LinkedIn luôn có biểu tượng trên navbar.
- **Work / Research:** archive có sidebar thư mục, tìm kiếm và thumbnail 16:9. Đã thêm các dự án có chứng chỉ từ portfolio cũ và PDF bài nghiên cứu wrist-based fall detection.
- **Awards:** tường treo ảnh chứng nhận thật từ portfolio cũ; bấm để inspect 3D, xoay và phóng to. Ảnh giữ tỷ lệ tự nhiên.
- **Command palette:** Ctrl/Cmd+K, fuzzy search, ↑/↓, Enter, Escape, native focus trap.
- **Responsive:** navbar và file launcher gọn ở góc trái; nền Home không có chữ
  trang trí. Mobile xếp các cửa sổ nội dung dọc, NAV.AI là popup nổi, gallery neo đáy.
  Có swipe ngang và trackpad ngang trên nền trống.
- **Accessibility:** semantic controls, skip link, focus ring, reduced motion theo
  hệ thống hoặc nút Motion; model không cần thiết cho điều hướng.
- **Backend:** FastAPI, liveness/readiness, CORS theo origin, logging, SQLAlchemy,
  Alembic scaffold; Docker Compose gồm API + PostgreSQL với persistent volume.

## Cập nhật nội dung

`frontend/lib/portfolio.ts` là nơi sửa tên, bio, chuyên môn, email, GitHub,
LinkedIn và đường dẫn CV. `frontend/components/desktop/app-content.tsx` giữ nội
dung các ứng dụng trong Home.

Sửa danh sách gallery ở `frontend/lib/gallery.ts`; các thumbnail minh họa nằm
trong `frontend/components/desktop/gallery-art.tsx`. Thay bằng ảnh dự án thật khi có nội dung.
Bài viết Work/Research nằm trong `frontend/lib/editorial.ts`.

**Thay `frontend/public/resume.pdf` bằng CV thật của bạn**. File hiện tại là PDF
tạm có ghi rõ trạng thái, chỉ chứa thông tin đã cung cấp. Link xem và download
không cần đổi. Có script tái tạo PDF tạm tại `scripts/create-placeholder-resume.py`
(cần `reportlab`, không phải dependency chạy web).

Blog vẫn chờ bài viết thật. Social hiện có dự án SAVINA tại HumanLog; hoạt động từ thiện và CLB sẽ bổ sung khi có tư liệu. Assets dự án, chứng chỉ và bài paper nằm trong `frontend/public/portfolio/`. Avatar About vẫn dùng ảnh GitHub tạm tại `frontend/public/portrait-github.png`; thay ảnh chân dung và `frontend/public/resume.pdf` khi có bản chính thức.

## Bật chat Groq cho Milo

Backend chạy được khi chưa có khóa và trả trạng thái chưa kết nối. Để bật chat:

1. Thêm `GROQ_API_KEY` vào `backend/.env` khi chạy local, hoặc `.env` ở root khi
   deploy bằng Docker Compose. Có thể đổi `GROQ_MODEL`; mặc định là
   `llama-3.3-70b-versatile`.
2. Chạy backend tại `http://localhost:8000` và frontend tại `http://localhost:3000`.
   Local frontend sẽ tự dùng URL này. Nếu backend ở domain khác, đặt
   `NEXT_PUBLIC_API_URL=https://api.your-domain.com` cho frontend trên Vercel
   trước khi build/deploy.
3. Thêm origin frontend chính xác vào `CORS_ORIGINS` trên backend. Có thể kiểm tra
   `GET /ai/status`; chat dùng `POST /ai/chat`.

Groq dùng [Chat Completions API](https://console.groq.com/docs/api-reference). Lịch sử
chat chỉ giữ trong bộ nhớ phiên trình duyệt; tối đa 12 lượt gần nhất được gửi qua
backend tới Groq để duy trì ngữ cảnh. Khóa không được gửi xuống client.

## Cấu trúc

```text
frontend/
  app/                    Next.js App Router, metadata, global styles
  components/
    desktop/              Window system, neural field, app content, core
    editorial-archive.tsx  Work/Research article browser
    lab/                  Handwritten navigation
    milo/                 Layered cat artwork and autonomous motion
    ui/                   Shared icon adapter
  lib/                    Profile, articles, MNIST inference, chat client
  styles/                 Desktop and app styling
  public/models/          Model, license, provenance
  public/resume.pdf        CV tạm, thay trực tiếp bằng CV thật
  scripts/                Copy WASM assets into public/ort before dev/build
  tests/                  Playwright integration tests
backend/
  app/api/                Health and Groq chat routes
  app/core/               Environment config and validation
  app/db/                 SQLAlchemy model base
  migrations/             Alembic, chưa cần schema nghiệp vụ
  tests/                  Health, CORS, error handling
docs/                     Hai đặc tả gốc + ghi chú triển khai
compose.yml               Backend + PostgreSQL; không có Caddy/frontend
```

## Chạy backend độc lập

```sh
cd backend
python -m venv .venv
# Windows
.venv\Scripts\python -m pip install -r requirements-dev.txt
.venv\Scripts\python -m uvicorn app.main:app --reload
# macOS/Linux: thay .venv\Scripts\python bằng .venv/bin/python
```

`GET /health` → `{"status":"ok"}`. `GET /health/db` trả 503 cho đến khi cấu hình
và kết nối được PostgreSQL. Swagger chỉ bật trong development/test.

Các biến mẫu nằm trong `backend/.env.example`. Password được truyền qua các biến
Postgres và ghép bằng SQLAlchemy URL, tránh lỗi escaping ký tự đặc biệt. Chưa cần
SECRET_KEY vì chưa có authentication. Chat Groq dùng `GROQ_API_KEY` riêng ở backend.

## Docker và triển khai

1. Copy `.env.example` ở root thành `.env`; điền password và frontend origins thật.
2. `docker compose up -d --build`.
3. Backend chỉ bind `127.0.0.1:8000`; PostgreSQL không publish port ra host.
4. Caddy có sẵn trên VM reverse proxy API domain về `127.0.0.1:8000`.
5. Vercel dùng **Root Directory: `frontend`**, framework Next.js. Nếu override
   Build Command, dùng `npm run build` để chạy cả bước copy WASM.
6. Đặt `NEXT_PUBLIC_API_URL` khi thêm tính năng gọi API; Home hiện không cần biến này.

Xem `docs/implementation.md` cho quyết định kỹ thuật và các phần còn chờ dữ liệu.
Không có Caddy container hoặc cấu hình host Caddy bị ghi đè trong repo.

Khi thêm model database đầu tiên:

```sh
# Local development, after configuring backend/.env and database access:
cd backend
alembic revision --autogenerate -m "initial schema"
# Review migration rồi lưu vào Git trước khi phát hành.
cd ..
docker compose run --rm backend alembic upgrade head
```

Production chỉ chạy `upgrade head`, không autogenerate. Schema nghiệp vụ hiện
chưa có; migrations/versions sẽ chứa các migration được review ở phase sau.

## Kiểm thử

```sh
npm run test:e2e
cd backend
.venv\Scripts\python -m pytest -q
.venv\Scripts\python -m ruff check .
```

Playwright local dùng Chrome có sẵn; CI dùng Chromium (`npx playwright install
--with-deps chromium`). Các test bao gồm desktop/mobile, window lifecycle, fuzzy
commands, drag/maximize, links/PDF, reduced motion, inference CNN thật và fallback
khi model tải thất bại, carousel và tương tác với Milo.

## Tài nguyên và attribution

- Fonts Geist / Geist Mono được self-host qua `@fontsource`, không gọi Google Fonts.
- Icons: Lucide.
- Neural Field / Core: Canvas 2D procedural projection, không cần GPU/WebGL. Có
  adaptive point count, giới hạn tốc độ vẽ và dừng khi tab không hoạt động.
- [MNIST model của Microsoft](https://github.com/microsoft/onnxruntime-inference-examples/blob/main/c_cxx/MNIST/mnist.onnx): MIT, đã lưu license và checksum cùng model.
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html): lazy load khi bấm Recognize; dữ liệu nét vẽ không rời trình duyệt.

Chưa có remote GitHub, domain hoặc deployment production được tạo tự động.
