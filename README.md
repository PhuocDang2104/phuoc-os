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

- **Profile Desk:** About và Career Snapshot mở sẵn; launcher cho Journey, Current
  Work, Work Gallery, Resume và Contact; có Recruiter Quick View.
- **Hệ cửa sổ:** kéo bằng title bar, focus, minimize/restore, close, maximize bằng
  nút hoặc double-click title bar; Escape đóng cửa sổ trên cùng.
- **AI Lab:** canvas chuột/chạm, CNN MNIST pretrained chạy bằng ONNX Runtime Web,
  confidence và latency thực, xác nhận trước khi chuyển trang. Có đường điều hướng
  bằng nút khi model lỗi hoặc không muốn vẽ.
- **Neural Core:** point cloud hình cầu có bốn portal đến Work, Research, Blog, Awards.
- **Milo:** pixel art SVG gốc, đi lại chậm, nhìn theo chuột khi ở gần, ngủ khi idle,
  gợi ý theo workspace và popup shortcut neo cạnh mèo. Đây là local guide, chưa có LLM.
- **Command palette:** Ctrl/Cmd+K, fuzzy search, ↑/↓, Enter, Escape, native focus trap.
- **Responsive:** desktop nhiều cửa sổ; tablet/mobile dùng cửa sổ xếp dọc, launcher
  ngang và dock cố định. Có swipe ngang và trackpad ngang trên nền trống.
- **Accessibility:** semantic controls, skip link, focus ring, reduced motion theo
  hệ thống hoặc nút Motion; model không cần thiết cho điều hướng.
- **Backend:** FastAPI, liveness/readiness, CORS theo origin, logging, SQLAlchemy,
  Alembic scaffold; Docker Compose gồm API + PostgreSQL với persistent volume.

## Cập nhật nội dung

`frontend/lib/portfolio.ts` là nơi sửa tên, bio, chuyên môn, email, GitHub,
LinkedIn và đường dẫn CV. `frontend/components/desktop/app-content.tsx` giữ nội
dung các ứng dụng trong Home.

**Thay `frontend/public/resume.pdf` bằng CV thật của bạn**. File hiện tại là PDF
tạm có ghi rõ trạng thái, chỉ chứa thông tin đã cung cấp. Link xem và download
không cần đổi. Có script tái tạo PDF tạm tại `scripts/create-placeholder-resume.py`
(cần `reportlab`, không phải dependency chạy web).

Work / Research / Blog / Awards đã có route, metadata và bố cục đọc nội dung.
Đây là khung cho phase kế tiếp; chưa có dự án, công bố, giải thưởng hay kinh
nghiệm giả. Journey cũng chưa gán mốc thời gian khi chưa có dữ liệu xác thực.

## Cấu trúc

```text
frontend/
  app/                    Next.js App Router, metadata, global styles
  components/
    desktop/              Window system, neural field, app content, core
    lab/                  Handwritten navigation
    ui/                   Shared icon adapter
  lib/                    Profile data, MNIST preprocessing/inference
  styles/                 Desktop and app styling
  public/models/          Model, license, provenance
  public/resume.pdf        CV tạm, thay trực tiếp bằng CV thật
  scripts/                Copy WASM assets into public/ort before dev/build
  tests/                  Playwright integration tests
backend/
  app/api/                API routes
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
SECRET_KEY hoặc AI_API_KEY vì chưa có authentication hay gọi LLM.

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
khi model tải thất bại.

## Tài nguyên và attribution

- Fonts Geist / Geist Mono được self-host qua `@fontsource`, không gọi Google Fonts.
- Icons: Lucide.
- Neural Field / Core: Canvas 2D procedural projection, không cần GPU/WebGL. Có
  adaptive point count, giới hạn tốc độ vẽ và dừng khi tab không hoạt động.
- [MNIST model của Microsoft](https://github.com/microsoft/onnxruntime-inference-examples/blob/main/c_cxx/MNIST/mnist.onnx): MIT, đã lưu license và checksum cùng model.
- [ONNX Runtime Web](https://onnxruntime.ai/docs/get-started/with-javascript/web.html): lazy load khi bấm Recognize; dữ liệu nét vẽ không rời trình duyệt.

Chưa có remote GitHub, domain hoặc deployment production được tạo tự động.
