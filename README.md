# 🧠 MindFlow (VibeCheck) - Hướng Dẫn Cài Đặt & Sử Dụng

MindFlow là ứng dụng hỗ trợ điều hòa năng lượng giao tiếp và cấp cứu cảm xúc, tích hợp bộ nhớ ngoài (Google Sheets) và trí tuệ nhân tạo (Gemini AI Oracle).

---

## 📂 Cơ Cấu Dự Án
*   [**`preview.html`**](file:///d:/Agentic%20AI/Emotional/preview.html): Bản mẫu HTML tự chứa (standalone). Chạy trực tiếp trên mọi thiết bị (điện thoại/máy tính) mà không cần cài đặt Node.js.
*   [**`gas-backend.js`**](file:///d:/Agentic%20AI/Emotional/gas-backend.js): Mã nguồn Google Apps Script để tích hợp vào Google Sheet của bạn.
*   **React App Folder:** Cấu trúc dự án React chính thức chuẩn (`package.json`, `vite.config.js`, `src/App.jsx`, `src/index.css`...).

---

## 🛠️ HƯỚNG DẪN THIẾT LẬP GOOGLE SHEETS & BACKEND

### Bước 1: Chuẩn bị Google Sheet
1. Mở file Google Sheet của bạn (Ví dụ file Sheet Emotion).
2. Tạo 2 trang tính (sheet) với tên chính xác như sau:
    *   Sheet 1: **`Daily_Logs`** (Không cần viết sẵn hàng tiêu đề, mã script sẽ tự động khởi tạo khi lưu bài học đầu tiên).
    *   Sheet 2: **`Master_Advice`** (Trang chứa bộ quy tắc giải pháp xương máu của bạn).
3. Đảm bảo cấu trúc cột của sheet `Master_Advice` có các cột tiêu đề sau:
    *   `STT` | `Vấn đề & Biểu hiện cụ thể` | `Bản chất tâm lý` | `Giải pháp tức thời (Cấp cứu tại chỗ)` | `Giải pháp dài hạn (Bẻ gãy vòng lặp)`

### Bước 2: Dán mã Script Backend
1. Trên thanh công cụ của Google Sheet, chọn **Tiện ích mở rộng (Extensions)** > **Apps Script**.
2. Xóa sạch mọi đoạn code có sẵn trong khung soạn thảo.
3. Mở file [**`gas-backend.js`**](file:///d:/Agentic%20AI/Emotional/gas-backend.js) trong dự án này, copy toàn bộ nội dung và dán vào Apps Script.
4. Bấm biểu tượng **Save (Lưu - hình đĩa mềm)**.

### Bước 3: Lấy & Cấu hình Gemini API Key
1. Truy cập [Google AI Studio](https://aistudio.google.com/), đăng nhập tài khoản Google của bạn.
2. Bấm nút **Create API Key** > Chọn dự án và copy mã API Key nhận được.
3. Quay lại trang Apps Script của bạn:
    *   Bấm vào **Cài đặt dự án (Project Settings - biểu tượng bánh răng cưa bên trái)**.
    *   Kéo xuống mục **Script Properties (Thuộc tính tập lệnh)**.
    *   Bấm **Add script property** và cấu hình:
        *   **Property (Thuộc tính):** `GEMINI_API_KEY`
        *   **Value (Giá trị):** (Dán mã API Key bạn vừa copy ở trên).
    *   Bấm **Save script properties**.

### Bước 4: Deploy thành Web App công khai
1. Ở góc trên bên phải trang Apps Script, bấm nút **Deploy (Triển khai)** > **New deployment (Triển khai mới)**.
2. Bấm vào biểu tượng bánh răng bên cạnh "Select type" > chọn **Web app**.
3. Cấu hình các thông số sau:
    *   *Description:* `MindFlow API`
    *   *Execute as:* **Me (Tài khoản của bạn)**
    *   *Who has access:* **Anyone (Mọi người)** - *Lưu ý: Bắt buộc chọn Anyone để app ở điện thoại/máy tính của bạn gửi được dữ liệu.*
4. Bấm **Deploy**.
5. Cấp quyền truy cập tài khoản (nếu Google yêu cầu): Bấm *Advanced* > *Go to Untitled project (unsafe)* > Bấm *Allow*.
6. Google sẽ cung cấp cho bạn một đường dẫn **Web App URL** (có đuôi `/exec`). **Copy đường dẫn này**.

---

## 📱 CÁCH SỬ DỤNG ỨNG DỤNG

### Cách 1: Sử dụng Bản Nhẹ Nhất (Khuyên dùng)
Bạn không cần cài đặt Node.js hay môi trường lập trình phức tạp. Bạn có thể mở ứng dụng ngay lập tức:
1. Mở file [**`preview.html`**](file:///d:/Agentic%20AI/Emotional/preview.html) bằng bất kỳ trình duyệt nào trên máy tính, hoặc gửi file này vào điện thoại để mở.
2. Ở góc trên bên phải ứng dụng, bấm vào nút **Cài đặt (bánh răng)**.
3. Dán đường dẫn **Web App URL** bạn đã copy ở *Bước 4* vào ô cấu hình. Bấm **Lưu cấu hình**.
4. Ứng dụng của bạn đã hoàn thành kết nối 2 chiều trực tiếp tới Google Sheets và AI Oracle! Bạn có thể lưu bài học, xả não, tự phanh và nhận lời khuyên thời gian thực.

### Cách 2: Phát triển/Biên dịch bằng React Project
Nếu sau này bạn cài đặt Node.js trên máy, bạn có thể chạy phiên bản React bằng cách:
1. Mở Command Prompt / Terminal tại thư mục `d:/Agentic AI/Emotional`.
2. Chạy lệnh cài đặt thư viện:
    ```bash
    npm install
    ```
3. Khởi chạy server phát triển cục bộ:
    ```bash
    npm run dev
    ```
4. Biên dịch đóng gói thành sản phẩm web chính thức:
    ```bash
    npm run build
    ```

---

## 🏆 CÁC TÍNH NĂNG CHÍNH ĐÃ TRIỂN KHAI

1.  **Tab Phanh Gấp (Tab 1):** 
    *   Check-in nhanh mood, chọn 1 trong 6 bối cảnh (`Bạn bè`, `Gia đình`, `Công việc`...).
    *   Bấm nút *"Sắp Vào Trận"* để hiện popup ngẫu nhiên 3 bài học và câu chuyện lịch sử. Kéo thanh trượt để cam kết và tắt popup.
    *   Mỗi lượt cam kết phanh được ghi nhận tần suất tự động.
2.  **Tab Vùng Xả Não (Tab 2):** 
    *   Nhập uất ức riêng tư, chọn chủ đề gây ức chế.
    *   Bấm *"Hủy Diệt"* $\rightarrow$ Chữ bốc hơi vĩnh viễn (hiệu ứng nuclear wipe).
    *   Lưu lại metadata tần suất xả và chủ đề ức chế lên Google Sheets để vẽ biểu đồ và AI tổng hợp.
3.  **Tab AI Oracle (Tab 3):**
    *   Vẽ biểu đồ Mood Trend 7 ngày tự động bằng SVG.
    *   Dashboard thống kê chi tiết nhảy số theo thời gian thực (Số lần phanh gấp, Số lần xả não, Năng lượng hưng phấn vs Sập nguồn, Nguồn cơn ức chế nhất).
    *   Bấm *"Nhận Lời Khuyên Từ Bản Thân"* để AI đối chiếu nhật ký tuần qua với trang tính `Master_Advice`, trả về chu kỳ tâm lý và 2 bản lời khuyên (👔 Nghiêm túc vs 🎭 Cợt nhả) kèm nút gạt chuyển đổi nhanh.
