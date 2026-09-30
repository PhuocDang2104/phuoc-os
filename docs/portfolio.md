E-Portfolio Web Specification — v3
1. Tổng quan concept
Website là một personal engineering workstation thay vì một portfolio dạng landing page truyền thống.
Nguồn cảm hứng chính là phong cách của Edoardo Lunardi: dark UI, desktop-like interface, floating windows, micro-interaction, typography gọn, technical aesthetic và cảm giác như đang thao tác trên một hệ điều hành cá nhân. Tuy nhiên, website không sao chép nguyên mẫu mà phát triển thành một identity riêng phù hợp với hướng AI / Edge AI / Computer Vision / Embedded Systems / Research.
Điểm nâng cấp quan trọng của concept v3 là sự xuất hiện của một AI companion dưới dạng mèo pixel 2D chạy vòng quanh website. Con mèo này không phải chatbot truyền thống đứng riêng một góc, mà là một “resident intelligence” của toàn bộ web: vui mắt, có tính cách, phản ứng với chuột, thỉnh thoảng đưa ra lời nhắn ngẫu hứng, và khi được click sẽ bật chat popup ngay tại vị trí nó đang đứng.
Mục tiêu của homepage:
- Cho HR hiểu rất nhanh “tôi là ai, đang làm gì, có gì nổi bật”.
- Cho technical recruiter hoặc engineer có thể khám phá sâu hơn.
- Thể hiện năng lực kỹ thuật ngay từ interaction của website.
- Có tính sáng tạo nhưng không màu mè, không game hóa quá mức.
- Cảm giác tổng thể: clean, intelligent, technical, minimal, premium.
Concept tên nội bộ có thể dùng:
PHUOC.OS — Personal Engineering Workstation

Tagline gợi ý:
Building intelligence from models to machines.

Sub-line:
Edge AI · Computer Vision · Embedded Systems · Research

Bản v3 này tập trung chốt concept tổng và chốt Home experience. Các trang nav riêng như Work / Research / Blog / Awards sẽ tiếp tục được đặc tả chi tiết ở phase sau.
2. Navigation chính
Navigation cố định trên top bar:
- Home
- Work
- Research
- Blog
- Awards
Không thêm quá nhiều mục vào navbar để giữ giao diện sạch.
Các nội dung như About, Journey, Resume, Contact, Current Work… được đặt bên trong workspace của Home hoặc mở bằng command palette.
Top bar có thể có thêm khu vực bên phải:
- GitHub
- LinkedIn
- Email
- Resume
- Availability status
- Local time
- Command shortcut
Ví dụ:
● Dang Nhu Phuoc        Home  Work  Research  Blog  Awards

                                   GitHub  LinkedIn  Resume
                                   ● AVAILABLE  11:24 [VIE]
3. Visual Direction
3.1. Tone tổng thể
Phong cách:
- Dark
- Monochrome
- Technical
- Desktop / Linux inspired
- Minimal UI
- Có một accent color duy nhất
- Không dùng gradient quá nổi
- Không glassmorphism quá nhiều
- Không particle spam
- Không neon cyberpunk
Gợi ý palette:
Background       #060608
Surface          #0D0D10
Panel            #151519
Panel Alt        #1C1C22
Panel Hover      #23232B

Border           #34343D
Border Strong    #50505C

Primary Text     #F2F2F4
Secondary Text   #A3A3AD
Muted Text       #6F6F79

Lavender         #B8A7FF
Lavender Soft    #8F82D9

Blue             #6EA8FF
Blue Deep        #5576FF

Accent Gradient  linear-gradient(
                   135deg,
                   #B8A7FF 0%,
                   #8A8DFF 42%,
                   #6EA8FF 72%,
                   #5576FF 100%
                 )
Màu chủ đạo vẫn là đen / xám kiểu Linux workstation. Lavender và xanh dương chỉ đóng vai trò accent, không phủ toàn UI.
Quy tắc sử dụng:
- #060608 cho background chính.
- #151519 và #1C1C22 cho floating window / terminal panel.
- #34343D cho border mảnh, divider và inactive control.
- #B8A7FF cho active state, focus, selected file hoặc AI-related highlight.
- #6EA8FF cho link, route, model output hoặc interactive state.
- Gradient lavender → blue chỉ dùng rất hạn chế cho:
  - neural field highlight,
  - active neural cluster,
  - AI prediction confidence,
  - selected navigation underline,
  - tiny glow quanh Scene 03 / Neural Core.
Không dùng gradient làm background lớn, button lớn hoặc card fill. Gradient chỉ nên xuất hiện như light signal / data flow, để UI vẫn giữ cảm giác Linux tối giản.
3.2. Typography
Main UI:
- Geist
- Inter
- Neue Montreal
Technical / terminal:
- Geist Mono
- IBM Plex Mono
- JetBrains Mono
Ví dụ:
DANG NHU PHUOC           → sans
current_work.sh          → mono
prediction: 3            → mono
4. Background — Neural Field
Background chính của Home là một neural field dạng halftone / point field.
Không dùng neural network kiểu nhiều node phát sáng cliché.
Visual nên giống:
- dense point cloud
- field density
- learned feature landscape
- computational surface
- subtle neural topology
Behavior:
- chuyển động rất chậm
- mouse movement tạo parallax nhẹ
- một số point phản ứng gần cursor
- density có thể thay đổi tùy screen
- khi chuyển workspace, field morph nhẹ thay vì thay background hoàn toàn
Mục tiêu:
background có cảm giác “AI system đang sống”, nhưng không giành attention khỏi content.

5. Home — cấu trúc tổng thể
Home là một interactive desktop environment.
User có thể:
- click icon
- double-click file
- mở floating window
- drag window
- close / minimize
- focus window
- dùng command palette
- chuyển workspace bằng swipe / trackpad / wheel / keyboard
- quan sát và tương tác với AI companion dạng mèo pixel 2D
Homepage có 2 desktop screens chính và 1 scene thứ ba custom.
Không làm 3 màn hình desktop giống nhau.
Cấu trúc:
HOME
│
├── SCREEN 01 / PROFILE DESK
├── SCREEN 02 / AI LAB
└── SCENE 03 / NEURAL CORE
Indicator dưới màn hình:
● ○ ◇
Trong đó:
- ● = Screen 01
- ○ = Screen 02
- ◇ = Scene 03 custom
6. SCREEN 01 — PROFILE DESK
Đây là workspace mặc định.
Mục tiêu:
giúp HR hiểu profile trong 10–20 giây.

Các icon nằm bên trái giống desktop:
▣ About
▣ Journey
▣ Current Work
▣ Work Gallery
▤ Resume.pdf
▣ Contact
Có thể thêm:
▣ Quick View
nếu cần recruiter mode.
6.1. Window mặc định khi load
Không bắt user phải click mới biết profile.
Khi Home load, mở sẵn 2 window:
Window A — About
ABOUT

Dang Nhu Phuoc
Edge AI / Computer Vision / Embedded Intelligence

I build intelligent systems across
hardware, firmware, machine learning,
and real-world deployment.

[Journey] [Resume]
Window không cần dài.
Window B — Career Snapshot
CAREER SNAPSHOT

Current focus
→ Edge AI · Computer Vision · Embedded Systems

Research
→ AI / Vision / Explainability

Build
→ Hardware · Firmware · Edge inference

Status
● Open to opportunities

[Work] [Research] [Awards] [Contact]
Window này ưu tiên thông tin HR muốn thấy nhanh nhất.
7. Các app / file trong Screen 01
7.1. About
Dạng concise technical bio.
01 / WHO
AI / embedded engineer focused on intelligent systems.

02 / BUILD
AI · Vision · Embedded · Firmware · Hardware

03 / DIRECTION
Efficient intelligence deployed in real systems.
CTA:
> journey
> resume.pdf
> contact
7.2. Journey
Không dùng timeline card truyền thống.
Hiển thị như system log:
journey.log

2024
│
├─ ...
│
2025
│
├─ Project / Competition
│
2026
│
├─ Research
├─ Internship
├─ AIoT
└─ Current Work
Hover event:
- hiện preview nhỏ
- title
- role
- date
- link sang Work / Research / Awards
7.3. Current Work
Chỉ hiển thị các hướng đang làm gần nhất.
Format:
CURRENT WORK

01
Edge AI / Embedded Intelligence
STATUS  ACTIVE

02
Computer Vision Research
STATUS  ACTIVE

03
Research & Publication
STATUS  ACTIVE
Mỗi item có thể click để mở page tương ứng.
7.4. Work Gallery
Dạng file browser thay vì card grid thông thường.
WORK/

├── project_01/
├── project_02/
├── project_03/
└── experiments/
Click folder:
- preview panel mở bên phải
- project image/video
- role
- stack
- contribution
- CTA OPEN CASE STUDY
7.5. Resume.pdf
Double click mở PDF viewer giả lập:
resume.pdf                         _ □ ×

[CV preview]

                     [Download ↓]
7.6. Contact
Dạng terminal:
CONTACT

> whoami
Dang Nhu Phuoc

> status
Available for opportunities

> location
Ho Chi Minh City, Vietnam

> github
...

> linkedin
...

> mail
...

[COPY EMAIL]
8. SCREEN 02 — AI LAB
Workspace thứ hai mang tính kỹ thuật và interactive hơn.
Các icon:
▣ Featured AI
▣ Research Snapshot
▣ Tech Stack
▣ Experiments
▣ Build Notes
Mục tiêu:
cho technical recruiter thấy website không chỉ đẹp mà còn có technical depth.

Screen này vẫn là khu kỹ thuật hơn, nhưng thay vì đặt một ô AI Chat tĩnh, “AI presence” được chuyển sang con mèo pixel companion xuất hiện sống động xuyên suốt website.
Background neural field ở screen này có thể:
- mật độ node cao hơn
- phản ứng với cursor rõ hơn
- có flow nhẹ giống inference path
9. Featured AI — Draw-to-Navigate
Đây là signature interaction của homepage.
Tên gợi ý:
NAV.AI
hoặc:
draw2navigate.ai
Window:
FEATURED AI — DRAW TO NAVIGATE

Where do you want to go?

1  Work Experience
2  Selected Projects
3  Research & Papers
4  Awards & Certifications
5  Skills & Stack
6  Contact / Resume

┌────────────────────┐
│                    │
│     DRAW HERE      │
│         ✎          │
│                    │
└────────────────────┘

> waiting_for_input...
User vẽ số bằng mouse / touch.
Ví dụ vẽ 3:
> processing...

prediction      3
confidence      98.7%
route           /research
label           Research & Papers

[ENTER]
Sau đó:
> opening research...
và điều hướng đúng section.
9.1. Technical authenticity
Feature nên chạy model thật client-side nếu khả thi.
Gợi ý:
- Tiny CNN
- ONNX Runtime Web
- TensorFlow.js
- WebGPU nếu support
Có mini panel:
MODEL INFO

CNN
Client-side inference
Latency: 12 ms
No data uploaded
Điểm quan trọng:
đây là một AI demo thực, không chỉ animation giả.

10. Pixel Cat AI Companion
AI không còn xuất hiện như một app chat riêng trong desktop nữa.
Thay vào đó, toàn bộ website có một AI companion dạng mèo pixel 2D đi vòng quanh giao diện. Đây là một element mang tính nhận diện rất mạnh: vừa vui mắt, vừa sáng tạo, vừa tạo cảm giác website “sống”, nhưng vẫn không phá sự chuyên nghiệp.
Tên nội bộ gợi ý:
PIXEL CAT
hoặc:
PHUOC.AI CAT
hoặc:
MILO.OS
nếu muốn đặt tên riêng có personality.
10.1. Vai trò của mèo AI
Con mèo không thay thế nội dung chính của website. Nó là một ambient intelligence layer.
Vai trò:
- tạo cảm giác thân thiện và memorable
- làm “AI presence” cho toàn bộ web
- dẫn dắt người dùng nhẹ nhàng
- phản ứng với chuột để tăng cảm giác alive
- cung cấp micro-hints về nội dung
- khi click thì mở chat popup ngay tại chỗ đang đứng
Điểm quan trọng:
Con mèo là AI mascot có chức năng thật, nhưng không được biến website thành quá dễ thương hoặc childish. Tone vẫn phải tinh tế, hơi tinh nghịch, nhưng smart và clean.

10.2. Behavior tổng quát
Con mèo xuất hiện ở tất cả các trang, nhưng rõ nét nhất ở Home.
Behavior mặc định:
- đi qua lại trên mép dưới của màn hình, titlebar của window, hoặc các “platform” UI nhất định
- thỉnh thoảng dừng lại, ngồi, nhìn chuột, quay đầu, vẫy đuôi
- khi chuột đi gần, mèo quay sang nhìn
- khi chuột click gần mèo, mèo giật mình nhẹ hoặc nhảy lùi 1 chút
- khi idle lâu, mèo có thể nằm xuống hoặc ngủ
- khi user mở window mới, mèo có thể đi sang ngồi trên title bar của window đó
- khi user chuyển sang Scene 03, mèo có thể biến mất trong 1–2 giây rồi xuất hiện lại như “teleport” vào neural core area
Tốc độ di chuyển:
- chậm, nhịp nhàng
- không chạy loạn
- không cắt ngang nội dung đọc chính
- cảm giác như một companion đang sống trong hệ điều hành
10.3. Chat bubble ngẫu hứng
Con mèo sẽ thỉnh thoảng nói những câu ngắn bằng speech bubble pixel-style.
Ví dụ:
looking at current work?
try the featured AI
research is interesting today
you can open resume.pdf
this window looks important
need the fast route? press ctrl + k
Nội dung bubble nên:
- ngắn
- thông minh
- hơi playful
- liên quan đến context đang xem
- không quá meme
- không nói liên tục
Tần suất:
- khoảng 12–25 giây mới xuất hiện một lần
- có random delay
- không làm phiền
Bubble tự biến mất sau vài giây.
10.4. Mouse interaction
Con mèo phải có tương tác rõ với chuột:
- hover gần → quay đầu nhìn chuột
- hover lâu → tiến gần một chút hoặc ngồi xuống
- click gần mèo → tai giật / step-back / jump frame
- kéo window đi ngang qua mèo → mèo đổi vị trí như tránh bị che
- khi user rê chuột nhanh → mèo có thể “đuổi theo” rất nhẹ trong phạm vi nhỏ
Không nên làm quá game-like. Chỉ cần đủ để người xem thấy website có độ sống.
10.5. Click to open chat popup
Khi user click trực tiếp vào mèo, một chat popup nhỏ xuất hiện ngay tại vị trí con mèo đang đứng.
Điều này quan trọng vì popup không nên xuất hiện cố định ở góc màn hình; nó phải có cảm giác như chính con mèo đang nói chuyện.
Ví dụ:
┌────────────────────────────┐
│ PHUOC.AI CAT               │
├────────────────────────────┤
│ Hi — want a quick route?   │
│                            │
│ [Open Work]                │
│ [Open Research]            │
│ [Open Awards]              │
│ [Open Resume]              │
│ [Just explore]             │
└────────────────────────────┘
Popup behavior:
- neo vào vị trí mèo
- nếu mèo đứng sát mép màn hình thì popup tự lật hướng để không bị tràn
- mở nhanh, nhẹ
- có thể đóng bằng click outside / Esc
Popup này đóng vai trò smart shortcut assistant, không phải full-page chatbot.
10.6. Chat popup content
Nội dung popup nên theo 2 lớp:
Lớp 1 — quick actions
- Open Work
- Open Research
- Open Blog
- Open Awards
- Open Resume
- Contact
Lớp 2 — short prompts
Ví dụ:
show me the best overview
what should HR look at first?
take me to current work
show recent research
Nếu muốn nâng cấp về sau, popup có thể nhận input ngắn như command.
Ví dụ:
> current work
và trả về link nhanh.
Nhưng ở phase concept hiện tại, chỉ cần popup thông minh + shortcut là đủ.
10.7. Visual style của mèo
Phong cách mèo:
- 2D pixel art
- silhouette rõ
- ít frame nhưng mượt
- màu chủ đạo xám / off-white / lavender điểm nhẹ
- outline rõ trên nền tối
- không quá cartoon
- vẫn hợp Linux / terminal aesthetic
Animation frame gợi ý:
- walk
- sit
- tail flick
- look-left
- look-right
- blink
- idle
- sleep
- tiny hop
Kích thước:
- nhỏ vừa phải
- không che content
- đủ để người xem notice
10.8. Vì sao pixel cat mạnh hơn AI chat box truyền thống
Một chatbox cố định góc màn hình thường dễ generic.
Ngược lại, pixel cat:
- tạo identity riêng cho website
- cho thấy “AI” theo cách giàu cá tính hơn
- làm web có cảm giác nhớ lâu
- vẫn giữ technical vibe nếu vẽ đúng
- không ép người dùng phải chat, nhưng luôn gợi mở tương tác
Nó phù hợp vì website của bạn đang theo hướng:
engineer workstation with personality

chứ không phải SaaS dashboard.
10.9. Triển khai cấp cao
Về mặt kỹ thuật có thể tách làm 2 phần:
Visual layer
- sprite sheet animation
- state machine
- path / anchor system
- mouse proximity detection
- idle timing
Intelligence layer
- chọn bubble ngẫu nhiên theo context
- đọc current route
- gợi ý action theo page
- mở popup với shortcut thông minh
Như vậy mèo vừa là animation object, vừa là UI assistant.
11. Research Snapshot
Một shortcut nhỏ cho technical visitor.
Không thay thế Research page.
Chỉ hiện:
RESEARCH SNAPSHOT

CURRENT THEMES
→ Edge AI
→ Computer Vision
→ Explainable AI
→ Intelligent sensing

PUBLICATIONS
→ ...

[OPEN RESEARCH]
12. Tech Stack
Không dùng skill bar hoặc %.
Hiển thị như package manager:
$ stack --list

AI
├─ PyTorch
├─ TensorFlow
├─ ONNX
└─ OpenCV

Embedded
├─ C / C++
├─ RTOS
├─ BLE
└─ MCU

Research
├─ Python
├─ NumPy
└─ SciPy

Tools
├─ Git
├─ Docker
└─ Linux
13. Experiments
Dạng Lab registry:
LAB

EXP-001
Handwritten Navigation AI
STATUS / LIVE

EXP-002
Neural Field Interaction

EXP-003
Edge Inference Benchmark

EXP-004
Interactive Sensor Viewer
Các experiment nhỏ không cần full case study.
14. SCENE 03 — NEURAL CORE
Scene thứ ba không phải desktop screen.
Đây là custom signature experience.
Khi user swipe từ Screen 02 sang Scene 03:
- desktop icons biến mất
- floating windows minimize
- neural field co lại về trung tâm
- các point tạo thành một 3D neural core / computational object
Object không cần quá phức tạp.
Nó có thể giống:
- spherical neural field
- compact AI core
- abstract processor
- learned latent structure
14.1. Interaction
Neural Core có 4 cluster chính:
WORK
RESEARCH
BLOG
AWARDS
Cursor tiến gần cluster:
- node density tăng
- connection xuất hiện nhẹ
- label fade in
Ví dụ:
● RESEARCH

12 nodes
Publications · Experiments · Topics

[ENTER]
Click cluster → chuyển trực tiếp nav tương ứng.
14.2. Ý nghĩa
Scene này đại diện cho:
toàn bộ portfolio như một “knowledge system”.

Các nav không còn là menu mà trở thành các vùng trong một learned representation.
Điều này giúp scene:
- có concept AI rõ
- khác desktop UI
- không lặp lại Screen 01/02
- trở thành visual signature của website
14.3. Idle animation
Nếu không tương tác:
- core rotate rất nhẹ
- field breathing
- occasional signal path chạy qua vài node
- không bloom mạnh
- không particle burst
15. Window System
Floating window là interaction language xuyên suốt Home.
Mỗi window có:
┌───────────────────────────────┐
│ title                    _ × │
├───────────────────────────────┤
│                               │
│ content                       │
│                               │
└───────────────────────────────┘
Behavior:
- draggable
- close
- minimize
- focus
- z-index thật
- click window → bring to front
- double click title → maximize / restore
- Esc → close top window
Không nhất thiết cần resize tự do vì dễ làm UX rối.
16. Motion
Motion phải smooth nhưng restrained.
Open window
opacity       0 → 1
scale         0.97 → 1
translateY    4px → 0
duration      180–240 ms
Close
opacity       1 → 0
scale         1 → 0.98
duration      140–180 ms
Workspace transition
- neural field morph
- background shift nhẹ
- không hard cut
- duration khoảng 450–700 ms
Scene 03 transition
- desktop fade/minimize
- neural points gather to center
- core form
- total khoảng 800–1200 ms
17. Command Palette
Shortcut:
CTRL + K
Overlay:
> Where do you want to go?

Search...

Home
Work
Research
Blog
Awards
About
Journey
Resume
Contact
Ask AI
Có fuzzy search.
Keyboard navigation:
- ↑
- ↓
- Enter
- Esc
Đây là interaction rất hợp engineer / dev aesthetic.
18. Recruiter Fast Path
Dù website interactive, HR không được mất thời gian tìm thông tin.
Trong vòng vài giây phải thấy được:
- tên
- role
- current focus
- selected work
- research
- awards
- resume
- contact
Có thể đặt Quick View trong Screen 01.
Click:
RECRUITER VIEW

DANG NHU PHUOC
Edge AI Engineer

CURRENT FOCUS
...

SELECTED WORK
...

RESEARCH
...

RECOGNITION
...

CORE STACK
...

[DOWNLOAD CV]
[LINKEDIN]
[EMAIL]
Đây là fallback cho người không muốn khám phá interaction.
19. HOME — user flow đề xuất
First 0–2 seconds
User thấy:
- top nav
- neural field
- About window
- Career Snapshot
Biết ngay:
AI / Embedded / Research profile.

Đồng thời, ở background/foreground sẽ sớm xuất hiện con mèo pixel 2D như một “living AI layer”, giúp homepage có cá tính riêng ngay từ ấn tượng đầu.
2–10 seconds
User có thể click:
- Current Work
- Work Gallery
- Resume
- Contact
10–30 seconds
Nếu tò mò:
- swipe sang AI Lab
- thử Draw-to-Navigate
- hỏi AI Chat
Deeper exploration
- mở Scene 03
- chọn cluster
- đi sang Work / Research / Blog / Awards
20. Global navigation behavior
Navbar luôn có:
Home
Work
Research
Blog
Awards
Active state:
Home
────
hoặc:
[Home]
Không dùng animation quá lớn.
Nav pages sẽ được thiết kế chi tiết riêng ở phase tiếp theo.
21. WORK — định hướng cấp cao
Trang Work dùng để trình bày:
- selected projects
- engineering systems
- role
- contribution
- technical stack
- outcomes
- gallery / media
- case studies
Home chỉ preview.
Chi tiết structure sẽ viết sau.
22. RESEARCH — định hướng cấp cao
Trang Research dùng cho:
- publications
- research interests
- methodology
- figures
- papers
- DOI / PDF / code
- ongoing work
Không trộn Research vào Work quá nhiều.
Chi tiết structure sẽ viết sau.
23. BLOG — định hướng cấp cao
Blog dùng cho:
- engineering notes
- build logs
- research notes
- technical explainers
- postmortems
- learning notes
Có thể giữ aesthetic như terminal/manual.
Ví dụ file naming:
2026-09-edge-ai-inference.md
2026-08-neural-ode-notes.md
2026-07-ros2-cuda-buffer.md
Chi tiết structure sẽ viết sau.
24. AWARDS — định hướng cấp cao
Trang Awards dùng cho:
- competition results
- certificates
- recognitions
- awards
- selected highlights
Visual có thể giống:
- archive
- evidence folder
- certificate viewer
- timeline
Chi tiết structure sẽ viết sau.
25. Responsive behavior
Desktop
Full interaction:
- draggable windows
- multi-screen workspace
- command palette
- Scene 03
- hover
- keyboard shortcuts
Tablet
Giữ:
- swipe between Screen 01 / 02 / Scene 03
- window drag đơn giản
- touch drawing AI
Mobile
Không cố giả desktop hoàn toàn.
Chuyển thành:
- stacked windows
- app launcher
- bottom dock
- touch-first navigation
Scene 03 vẫn giữ nhưng giảm particle count.
26. Performance requirements
Homepage phải cảm giác nhanh dù có WebGL.
Nguyên tắc:
- lazy load AI model
- lazy load Scene 03
- không load tất cả 3D ngay first paint
- compress textures
- use GLB / Draco nếu có model 3D
- adaptive particle count
- pause rendering khi tab inactive
- reduce motion mode
- mobile fallback
First content phải xuất hiện trước khi AI model và scene tải xong.
27. Accessibility
Dù creative vẫn cần:
- keyboard navigation
- prefers-reduced-motion
- readable contrast
- fallback navigation nếu WebGL fail
- semantic HTML
- focus state rõ
- command palette usable bằng keyboard
- không bắt user phải drag để truy cập content
28. Suggested technical stack
Frontend:
Next.js
React
TypeScript
Animation:
GSAP
Framer Motion
Lenis
3D / Neural Field:
Three.js
React Three Fiber
React Three Drei
WebGL / WebGPU optional
AI demo:
ONNX Runtime Web
hoặc
TensorFlow.js
AI Chat:
Structured portfolio data
+
RAG / LLM
Content:
MDX
hoặc
headless CMS
29. Information architecture tổng thể
/
├── Home
│   │
│   ├── Screen 01 / Profile Desk
│   │   ├── About
│   │   ├── Journey
│   │   ├── Current Work
│   │   ├── Work Gallery
│   │   ├── Resume
│   │   └── Contact
│   │
│   ├── Screen 02 / AI Lab
│   │   ├── Featured AI
│   │   ├── Research Snapshot
│   │   ├── Tech Stack
│   │   ├── Experiments
│   │   └── Build Notes
│   │
│   ├── Global AI Companion
│   │   └── Pixel Cat Assistant
│   │
│   └── Scene 03 / Neural Core
│       ├── Work
│       ├── Research
│       ├── Blog
│       └── Awards
│
├── Work
├── Research
├── Blog
└── Awards
30. Design principles cần giữ xuyên suốt
Principle 01 — Technical first
Interaction phải có lý do.
Không thêm effect chỉ để “wow”.
Principle 02 — HR can scan fast
Creative UX không được che mất thông tin nghề nghiệp.
Principle 03 — One visual language
Dark OS + neural field + technical typography.
Không mix nhiều style.
Principle 04 — Real engineering details
UI có thể dùng:
- latency
- status
- model info
- timestamps
- logs
- stack
- process
để tạo cảm giác authentic.
Principle 05 — Motion is restrained
Không bounce, không flashy transition.
Principle 06 — Home is an experience, nav pages are content-first
Home là nơi thể hiện personality.
Work / Research / Blog / Awards ưu tiên đọc và hiểu nội dung.
31. Tóm tắt direction cuối cùng
Website là một personal engineering workstation lấy cảm hứng từ desktop/Linux interface.
Home gồm:
Screen 01 — Profile Desk
HR-centric:
- About
- Journey
- Current Work
- Work Gallery
- Resume
- Contact
Screen 02 — AI Lab
Technical / interactive:
- Featured AI Draw-to-Navigate
- Research Snapshot
- Tech Stack
- Experiments
- Build Notes
Global AI Companion
- Pixel Cat Assistant
- spontaneous chat bubbles
- mouse interaction
- click-to-open smart popup
- ambient AI presence across the whole website
Scene 03 — Neural Core
Custom AI visual experience:
- neural field co lại thành computational core
- 4 cluster:
  - Work
  - Research
  - Blog
  - Awards
- mỗi cluster hoạt động như một portal đến nav tương ứng
Global navigation:
Home   Work   Research   Blog   Awards
Visual identity:
Minimal dark engineering OS + neural field + precise micro-interaction.

Core principle:
The website should feel like entering an engineer's workspace — not browsing a résumé template.