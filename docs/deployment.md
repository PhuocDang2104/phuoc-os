E-Portfolio — Tech Stack & Deployment Specification
1. Mục tiêu
Architecture ưu tiên:
- triển khai nhanh
- dễ maintain
- tách rõ frontend / backend / database
- backend có thể mở rộng cho AI features sau này
- production deployment đơn giản
- tất cả service backend phải được containerize bằng Docker
- không tạo thêm Caddy container trong project vì VM đã có Caddy chạy riêng ở host level
Kiến trúc tổng quát:
User Browser
    │
    ├── HTTPS
    ▼
Vercel
Frontend
Next.js / React / TypeScript
    │
    │ API request
    ▼
api.<domain>
    │
    ▼
Caddy
VNPT Cloud VM
Host-level Reverse Proxy
    │
    ▼
Docker Network
    │
    ├── Backend Container
    │
    └── PostgreSQL Container
2. Frontend
Hosting
Vercel
Frontend deploy độc lập khỏi backend.
Recommended stack:
Next.js
React
TypeScript
UI / styling:
Tailwind CSS
CSS Modules / Global CSS khi cần custom sâu
Animation:
GSAP
Framer Motion
Lenis
3D / Neural Field:
Three.js
React Three Fiber
React Three Drei
AI client-side feature:
ONNX Runtime Web
hoặc:
TensorFlow.js
Dùng cho feature nhẹ như handwritten digit recognition nếu model đủ nhỏ để inference trực tiếp trên browser.
3. Backend
Backend chạy trên:
VNPT Cloud VM
Backend bắt buộc được đóng Docker.
Recommended:
FastAPI
Python
Lý do:
- hợp với AI / ML workload
- dễ tích hợp model inference
- API development nhanh
- async support tốt
- OpenAPI tự động
- thuận tiện mở rộng cho portfolio AI assistant / RAG / analytics
Alternative nếu muốn full TypeScript:
NestJS
Node.js
TypeScript
Nhưng nếu backend sau này có nhiều AI logic thì ưu tiên FastAPI.
4. Backend Container
Ví dụ service:
portfolio-backend
Backend container chỉ expose nội bộ trên VM.
Ví dụ:
127.0.0.1:8000
hoặc bind vào Docker network rồi publish host port riêng.
Không expose trực tiếp public internet nếu Caddy đang đứng phía trước.
Flow:
Internet
   │
   ▼
Caddy :443
   │
   ▼
Backend :8000
5. Reverse Proxy
Reverse proxy dùng:
Caddy
Caddy chạy trực tiếp trên VNPT Cloud VM.
Không đặt Caddy trong:
docker-compose.yml
của project.
Không tạo:
caddy/
Dockerfile.caddy
Caddy container
trong repository này.
Caddy đảm nhiệm:
- HTTPS
- TLS certificate
- reverse proxy
- domain routing
- forwarding request vào backend container / host port
Ví dụ conceptual config:
api.example.com {
    reverse_proxy localhost:8000
}
Caddy config thực tế được quản lý ở VM-level deployment config, tách khỏi application repository nếu có thể.
6. PostgreSQL
Database:
PostgreSQL
PostgreSQL chạy bằng Docker.
Service:
postgres
Không dùng database cài trực tiếp trên VM.
Backend và PostgreSQL nên nằm cùng Docker network.
Ví dụ:
backend
   │
   ▼
postgres:5432
Backend sử dụng internal Docker hostname:
postgres
thay vì:
localhost
7. Docker Compose
Project backend có thể dùng:
docker-compose.yml
hoặc:
compose.yml
Các service chính:
services:
  backend:
    ...
  postgres:
    ...
Không có:
caddy:
vì Caddy đã chạy riêng trên VM.
Architecture:
VNPT CLOUD VM

Caddy
│
│ host-level reverse proxy
│
└──> localhost:8000
       │
       ▼
       backend container
       │
       ▼
       postgres container
8. Docker Network
Tạo network riêng:
portfolio-network
Ví dụ:
backend
postgres
cùng nằm trong network này.
PostgreSQL không cần expose port public.
Tốt nhất:
postgres:
  expose:
    - "5432"
thay vì:
ports:
  - "5432:5432"
trừ khi cần debug từ host.
9. Volumes
PostgreSQL phải có persistent volume.
Ví dụ:
postgres_data
Concept:
PostgreSQL Container
       │
       ▼
Docker Volume
postgres_data
Việc restart hoặc recreate container không được làm mất database.
10. Environment Variables
Không commit production secrets vào repository.
Backend:
DATABASE_URL
APP_ENV
SECRET_KEY
CORS_ORIGINS
AI_API_KEY
Database:
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
Frontend Vercel:
NEXT_PUBLIC_API_URL
Ví dụ:
NEXT_PUBLIC_API_URL=https://api.example.com
Production secret nên cấu hình trực tiếp bằng:
- Vercel Environment Variables
- .env trên VNPT Cloud VM
- secret manager nếu nâng cấp sau này
11. Domain Architecture
Recommended:
example.com
www.example.com
→ Vercel frontend
api.example.com
→ VNPT Cloud VM
Flow:
example.com
   │
   ▼
Vercel

api.example.com
   │
   ▼
VNPT Cloud
   │
   ▼
Caddy
   │
   ▼
Backend Docker
12. CORS
Backend chỉ nên allow frontend production domains cần thiết.
Ví dụ:
https://example.com
https://www.example.com
Development:
http://localhost:3000
Không nên dùng:
*
ở production nếu backend có endpoint nhạy cảm.
13. Recommended Backend Structure
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── db/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── ai/
│   └── main.py
│
├── migrations/
├── tests/
├── Dockerfile
├── requirements.txt
├── .env.example
└── compose.yml
Nếu dùng FastAPI:
app/api
cho REST endpoints.
app/services
cho business logic.
app/ai
cho AI-specific logic.
app/db
cho database session / models.
14. Suggested Database Usage
PostgreSQL có thể lưu:
- blog metadata
- portfolio content nếu cần dynamic CMS
- contact form submissions
- analytics event tùy chọn
- AI chat history nếu thật sự cần
- AI assistant knowledge metadata
- project / publication metadata
- admin content state
Không cần đưa toàn bộ static content vào DB nếu không cần.
Các content ít thay đổi như:
- About
- project description
- awards
- research summary
có thể bắt đầu bằng:
MDX / JSON / static files
để đơn giản deployment.
15. Static vs Dynamic Content
Recommended phase đầu:
Frontend static / hybrid
+
Backend chỉ xử lý dynamic features
Frontend giữ:
- About
- Work
- Research
- Awards
- Blog static content
- visual assets
Backend giữ:
- AI features
- contact submission
- dynamic analytics
- future admin APIs
- database-dependent features
Điều này giúp web load nhanh và backend gọn.
16. AI Feature Architecture
Handwritten Navigation
Ưu tiên inference client-side:
Browser
   │
   ▼
ONNX Runtime Web
Không cần backend request nếu model nhỏ.
Lợi ích:
- latency thấp
- demo kỹ thuật đẹp
- không tốn server
- không upload drawing của user
Pixel Cat AI Companion
Visual / behavior chạy client-side.
Frontend
├── sprite animation
├── state machine
├── mouse tracking
└── context-aware hints
Nếu chỉ dùng predefined smart hints:
không cần backend
Nếu sau này cho chat tự do:
Pixel Cat
   │
   ▼
Frontend
   │
   ▼
Backend API
   │
   ▼
LLM / RAG
17. Logging
Backend nên log ít nhất:
timestamp
method
route
status
latency
error
Không log:
- password
- API key
- secret token
- sensitive request content
Docker logs có thể kiểm tra bằng:
docker compose logs -f backend
18. Health Check
Backend nên có:
GET /health
Response:
{
  "status": "ok"
}
Nếu muốn chi tiết hơn:
GET /health/db
để kiểm tra PostgreSQL.
Docker backend có thể dùng endpoint này cho healthcheck.
19. Deployment Flow
Frontend
GitHub
   │
   ▼
Vercel
   │
   ▼
Automatic Build
   │
   ▼
Production
Deploy khi merge vào production branch.
Backend
Flow đơn giản:
GitHub
   │
   ▼
VNPT Cloud VM
   │
git pull
   │
docker compose build
   │
docker compose up -d
Có thể nâng cấp sau thành CI/CD tự động.
20. Fast Manual Deployment Commands
Ví dụ:
git pull
docker compose build backend
docker compose up -d
Kiểm tra:
docker compose ps
Logs:
docker compose logs -f backend
Restart:
docker compose restart backend
21. Database Migration
Nếu dùng FastAPI + SQLAlchemy:
Alembic
Flow deployment:
docker compose run --rm backend alembic upgrade head
docker compose up -d
Migration phải được version-control.
22. Backup PostgreSQL
Nên có backup định kỳ.
Ví dụ:
pg_dump
Backup tối thiểu:
daily database dump
và lưu ngoài Docker volume nếu có thể.
Không coi Docker volume là backup.
23. Security Baseline
Production checklist:
- HTTPS qua Caddy
- PostgreSQL không public
- backend chỉ expose port cần thiết
- secrets không commit Git
- CORS giới hạn domain
- rate limit endpoint AI / contact nếu cần
- validate request
- dependency update định kỳ
- VM firewall chỉ mở port cần thiết
Public ports trên VM chủ yếu:
22
80
443
Backend port như 8000 không nên mở public nếu Caddy proxy nội bộ.
24. Recommended Repository Layout
Nếu frontend và backend nằm cùng repo:
portfolio/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── app/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── ...
│
├── compose.yml
├── .env.example
└── README.md
compose.yml quản lý:
backend
postgres
Không quản lý frontend production vì frontend chạy Vercel.
Không quản lý Caddy vì Caddy chạy ở VM level.
25. Production Architecture Chốt
                          ┌─────────────────────┐
                          │       GitHub        │
                          └─────────┬───────────┘
                                    │
                    ┌───────────────┴──────────────┐
                    │                              │
                    ▼                              ▼
             ┌─────────────┐                ┌──────────────┐
             │   Vercel    │                │ VNPT Cloud VM│
             │  Frontend   │                │              │
             └──────┬──────┘                │    Caddy     │
                    │                       │      │       │
                    │ HTTPS API             │      ▼       │
                    └──────────────────────►│   Backend    │
                                            │   Docker     │
                                            │      │       │
                                            │      ▼       │
                                            │ PostgreSQL   │
                                            │   Docker     │
                                            └──────────────┘
26. Stack Summary
Frontend
Next.js
React
TypeScript
Tailwind CSS
GSAP
Framer Motion
Three.js
React Three Fiber
Deployment:
Vercel
Backend
Recommended:
FastAPI
Python
SQLAlchemy
Alembic
Deployment:
Docker
VNPT Cloud VM
Reverse Proxy
Caddy
Deployment:
Host-level service on VNPT Cloud VM
Important:
Không thêm Caddy container vào project Docker Compose.

Database
PostgreSQL
Deployment:
Docker container
Persistent Docker volume
27. Core Deployment Principle
Frontend runs independently on Vercel. Backend and PostgreSQL run as Docker services on VNPT Cloud. The VM's existing Caddy instance terminates HTTPS and reverse-proxies API traffic to the backend. Caddy is infrastructure-level and must not be duplicated inside the project's Docker stack.