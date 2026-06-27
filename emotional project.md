# PRODUCT REQUIREMENT DOCUMENT (PRD) & ARCHITECTURE
## Project Name: VibeCheck / MindFlow (Personal Guardrail & AI Psychological Oracle)
## Platform: Responsive Web App (Mobile-First)
## Database Backend: Google Sheets (via Apps Script Web App API)
## Core Engine: LLM API Integration (Gemini / OpenAI)

---

## 1. TỔNG QUAN HỆ THỐNG & BỐI CẢNH (CONTEXT)

Ứng dụng được thiết kế riêng nhằm mục đích điều hòa hành vi giao tiếp, kiểm soát năng lượng nội tâm, và khắc phục triệt để tính mau quên thông qua 3 trạng thái cốt lõi:
1.  **High Energy Peak (Nhiều chuyện/Vạ miệng):** Khi không khí vui dễ bị cuốn theo, nói quá đà, sau đó hối hận và cố đóng vai lạnh lùng làm sượng trân không khí.
2.  **Emotional Displacement & Freeze (Trút tiêu cực & Sập nguồn):** Tâm trạng thay đổi nhanh vì suy nghĩ nhỏ nhặt, tự động trút tiêu cực lên người khác dù biết là sai, sau đó hệ thần kinh bị quá tải dẫn đến trạng thái đóng băng, thả trôi cơ thể, mất sức sống.
3.  **High Forgetting Rate (Nút Reset tự động):** Cơ chế mau quên xóa sạch các cảm giác hối hận hoặc thất vọng cũ quá nhanh, khiến bản thân liên tục vấp ngã tại cùng một cái hố hành vi ở các cuộc gặp tiếp theo.

---

## 2. KIẾN TRÚC DỮ LIỆU (GOOGLE SHEETS DATABASE)

Hệ thống sử dụng một file Google Spreadsheet duy nhất gồm 2 Trang tính (Sheets) hoạt động độc lập nhưng liên kết ngữ cảnh qua AI.

### Sheet 1: `Daily_Logs` (Lưu lịch sử thô & Nhật ký)
Cập nhật liên tục mỗi khi người dùng Check-in. Gồm các cột sau:
*   `A: id` (String - chuỗi Timestamp)
*   `B: createdAt` (Datetime - Định dạng YYYY-MM-DD HH:mm:ss)
*   `C: moodRating` (Integer - Thang đo từ 1 đến 5)
    *   *1: Sập nguồn / Đóng băng (Freeze)*
    *   *3: Bình thường / Cân bằng*
    *   *5: Quá phấn khích / Dễ vạ miệng (High energy)*
*   `D: contextTag` (String - Giá trị: `Bạn bè` | `Gia đình` | `Công việc` | `Đám đông` | `Một mình` | `Người khác`)
*   `E: lessonNote` (String - Bài học xương máu tự rút ra trong 1 dòng)
*   `F: storyDetail` (String - Nhật ký chi tiết: Kể lại câu chuyện hoặc bối cảnh thực tế đã xảy ra)

### Sheet 2: `Master_Advice` (Kho lưu trữ tư vấn và giải pháp gốc)
Dữ liệu cố định được nạp sẵn từ các cuộc hội thoại phân tích tâm lý trước đó để làm "Context Injection" cho AI. Gồm các cột khớp thực tế với Google Sheets của bạn:
*   `A: STT` (Số thứ tự)
*   `B: Vấn đề & Biểu hiện cụ thể` (Biểu hiện hành vi cần phanh)
*   `C: Bản chất tâm lý` (Phân tích nguyên nhân sâu xa)
*   `D: Giải pháp tức thời (Cấp cứu tại chỗ)` (Các chỉ dẫn hành động nhanh trước/trong cuộc gặp)
*   `E: Giải pháp dài hạn (Bẻ gãy vòng lặp)` (Định hướng thay đổi hành vi dài hạn)

---

## 3. THIẾT KẾ CÁC TÍNH NĂNG VÀ GIAO DIỆN (UI/UX)

Ứng dụng sử dụng cấu trúc giao diện Dark Mode (Chủ đạo: Xám mờ `#121212`, Xanh Deep Blue, chữ Trắng/Xám nhạt) nhằm mục đích làm dịu kích thích thị giác khi người dùng đang ở trạng thái quá tải cảm xúc. Cấu trúc gồm 3 Tab điều hướng chính:

### Tab 1: 🛑 HỘP PHANH KHẨN CẤP (Pre-Meeting Buffer & Nhật Ký)
*   **Widget Tiên Phong - Một chạm dùng ngay (One-shot, không ma sát):**
    *   Nút bấm lớn màu đỏ nổi bật: **"SẮP VÀO TRẬN / CHUẨN BỊ GẶP MẶT"**.
    *   *Cơ chế:* Khi bấm, app hiển thị popup ngay lập tức (không hỏi thêm gì). Popup hiện ra **3 bài học xương máu ngẫu nhiên gần nhất** của bạn từ lịch sử, kèm các chỉ dẫn cấp cứu tâm lý tương ứng từ `Master_Advice`.
    *   *Hạn chế tiêu cực & Tránh phớt lờ chỉ dẫn:* 
        *   **Tông giọng tích cực (Framing):** Trình bày nhẹ nhàng dưới dạng *"Thư gửi bản thân"*, xen kẽ lời khuyên động viên và thành tích tích cực của lần gặp trước để không gây ức chế tâm lý.
        *   **Cam kết bằng thanh trượt (Interactive Slider):** Bạn kéo **thanh trượt cam kết** ghi *"Tôi đã khắc cốt ghi tâm và sẵn sàng vào trận"* sang bên phải để đóng popup.
*   **Form Nhật Ký Kết Hợp (Tối ưu hóa UI/UX theo hình ảnh mẫu):**
    *   **Thao tác kéo/chọn nhanh không ma sát:**
        *   *Tâm trạng hiện tại:* Chọn nhanh bằng slider hoặc 5 emoji lớn từ 1 (Sập nguồn) đến 5 (Phấn khích).
        *   *Bối cảnh:* Các badge chọn nhanh chỉ bằng 1 lần click: `Bạn bè` | `Gia đình` | `Công việc` | `Đám đông` | `Một mình` | `Người khác`.
        *   *Ghi chú 1 dòng (Bài học):* Ô nhập văn bản ngắn ghi lại bài học "vết sẹo" (Ví dụ: *"Nói quá đà với hội A"*, *"Bạn C trung lập, bớt kỳ vọng"*).
    *   **Phần nhật ký chi tiết (Mở rộng):** Một nút "Kể chi tiết câu chuyện" mở ra ô nhập liệu `storyDetail` để bạn kể lại sự việc cụ thể.
    *   Nút bấm **"Khóa Bài Học" (Save Log)** $\rightarrow$ Đẩy toàn bộ data lên Sheet 1.

### Tab 2: 🌋 VÙNG XẢ NÃO (Brain Dump Zone - Bảo mật & Cấp cứu cảm xúc bằng AI)
*   **Giao diện:** Một ô nhập liệu văn bản lớn tối giản và một nút đỏ rực **"HỦY DIỆT (Nuclear Wipe)"**.
*   **Cơ chế cấp cứu cảm xúc bằng AI (Privacy-Preserved AI First-Aid):**
    *   **Phân tích & Ra đơn thuốc vật lý:** Khi bấm nút *"HỦY DIỆT"*, trước khi xóa chữ, ứng dụng sẽ gửi nhanh nội dung văn bản lên AI (Gemini). AI sẽ đọc nội dung (chỉ chạy trong bộ nhớ đệm, không lưu lại) để nhận diện trạng thái cụ thể của bạn và đưa ra một **"Đơn thuốc cấp cứu vật lý"** ngay lập tức:
        *   *Nếu bạn đang Phẫn nộ/Tức giận cực độ (Amygdala Hijack):* AI khuyên bạn **Shock bộ cảm giác** (Rửa mặt nước đá, ngửi tinh dầu mạnh, uống nước lạnh).
        *   *Nếu bạn đang Buồn bã/Kiệt sức (Đóng băng/Sập nguồn):* AI khuyên bạn **Sập nguồn chủ động** (Nằm xuống nghỉ ngơi 30 phút không tự trách) hoặc viết **Tuyên bố nhường đường** cho người thân.
    *   **Bảo mật tuyệt đối nội dung:** Sau khi nhận phản hồi từ AI và hiển thị "Đơn thuốc cấp cứu" lên màn hình dưới dạng popup, toàn bộ text bạn gõ sẽ bị **xóa sạch vĩnh viễn khỏi client và KHÔNG lưu vào bất kỳ database nào**.
    *   **Đo lường tần suất:** Hệ thống chỉ lưu lại dòng metadata vô hại lên Google Sheets: ngày giờ xả, độ dài chữ và loại cảm xúc chủ đạo mà AI vừa phân tích được (Ví dụ: *"Xả não: Công việc - Trạng thái: Kiệt sức"*).
*   **Hiển thị:** Một popup hiện lên chứa "Đơn thuốc cấp cứu từ AI" kèm theo thông báo: *"Đã hủy diệt nội dung xả não thành công!"*.

### Tab 3: 🔮 AI ORACLE (Bảng Số Liệu Cảm Xúc & Phản Hồi AI 7 Ngày)
*   **Giao diện - Hệ thống thống kê cảm xúc trực quan:**
    *   **1. Biểu đồ đường cảm xúc (Mood Trend):** Theo dõi xu hướng trồi sụt cảm xúc 7 ngày qua của người dùng.
    *   **2. Bảng chỉ số "Tự soi chiếu" (Self-Reflection Metrics) - Thu thập từ mọi hoạt động:**
        *   *Chỉ số Phanh Gấp (Brakes):* Đếm số lượt người dùng bấm *"Sắp vào trận"* và kéo thanh trượt cam kết thành công (Khi kéo xong, app tự động gửi 1 dòng log ẩn lên Sheets với `contextTag` = `Trước giờ G` để đếm số lượt).
        *   *Chỉ số Xả Áp (Brain Dumps):* Đếm tổng số lượt đã nhấn nút *"Hủy Diệt"*. Hiển thị tỷ lệ phần trăm **Nguồn cơn gây ức chế nhất** (`dumpTag`: `Công việc` | `Bạn bè` | `Gia đình` | `Bản thân`) dưới dạng phần trăm trực quan.
        *   *Chỉ số Trồi sụt năng lượng:* Đếm số lần rơi vào vùng hưng phấn (Mood 4-5) so với vùng sập nguồn (Mood 1-2) trong tuần.
    *   **3. Nút Kích Hoạt Tối Cao:** **"Nhận Lời Khuyên Từ Bản Thân"**.
    *   **4. Khung phản hồi AI Oracle (Với nút gạt 👔 Nghiêm túc / 🎭 Cợt nhả):**
        *   AI Oracle sẽ đọc toàn bộ nhật ký sự kiện 7 ngày qua (kể cả b bối cảnh từ check-in và các thống kê xả não/phanh gấp).
        *   Trả về báo cáo phân tích chu kỳ tâm lý 7 ngày, chỉ rõ nguyên nhân và đưa ra lời khuyên + hành động khuyến nghị thực tế.

---

## 4. API BẮC CẦU: GOOGLE APPS SCRIPT CODE

Đoạn mã dưới đây cần được dán vào phần `Extensions -> Apps Script` trên file Google Sheets của bạn và Deploy dưới dạng `Web App` (truy cập: Anyone). Mã này đóng vai trò là API endpoint xử lý việc đọc/ghi dữ liệu cho ứng dụng React/Frontend của bạn.

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Daily_Logs");
  var params = JSON.parse(e.postData.contents);
  
  // Ghi log mới vào Daily_Logs
  sheet.appendRow([
    params.id,
    params.createdAt,
    params.moodRating,
    params.contextTag,
    params.lessonNote,
    params.storyDetail || ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var action = e.parameter.action;
  
  // Trả về dữ liệu thô từ Daily_Logs
  if (action === "getLogs") {
    var sheetLogs = ss.getSheetByName("Daily_Logs");
    var dataLogs = sheetLogs.getDataRange().getValues();
    var headersLogs = dataLogs[0];
    var jsonArray = [];
    
    for (var i = 1; i < dataLogs.length; i++) {
      var obj = {};
      for (var j = 0; j < headersLogs.length; j++) {
        obj[headersLogs[j]] = dataLogs[i][j];
      }
      jsonArray.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify(jsonArray))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // Trả về bộ quy tắc giải pháp từ Master_Advice
  if (action === "getMasterAdvice") {
    var sheetAdvice = ss.getSheetByName("Master_Advice");
    var dataAdvice = sheetAdvice.getDataRange().getValues();
    var headersAdvice = dataAdvice[0];
    var adviceArray = [];
    
    for (var k = 1; k < dataAdvice.length; k++) {
      var objAdvice = {};
      for (var l = 0; l < headersAdvice.length; l++) {
        objAdvice[headersAdvice[l]] = dataAdvice[k][l];
      }
      adviceArray.push(objAdvice);
    }
    return ContentService.createTextOutput(JSON.stringify(adviceArray))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

---

## 5. HƯỚNG DẪN PROMPT GỌI AI ORACLE (Dành cho Logic App)

Khi người dùng bấm nút "Nhận Lời Khuyên Từ Bản Thân" tại Tab 3, Frontend sẽ gửi một payload chứa `Daily_Logs` (7 ngày gần nhất) + `Master_Advice` cho AI API với System Prompt nghiêm ngặt sau:

> **SYSTEM PROMPT:**
>
> Sử dụng cấu trúc dữ liệu JSON đính kèm từ hai trang tính Google Sheets của người dùng:
> 1. `Daily_Logs`: Chứa dữ liệu trạng thái tinh thần thực tế 7 ngày qua của người dùng.
> 2. `Master_Advice`: Bộ quy tắc giải pháp cốt lõi về tâm lý đã được đúc kết cho người dùng.
>
> **Nhiệm vụ của bạn:** Đóng vai trò là một "Bộ nhớ ngoài khách quan", đối chiếu hành vi thực tế tuần qua của người dùng với Bộ quy tắc giải pháp để đưa ra một phản hồi DUY NHẤT có cấu trúc cực ngắn (không quá 250 từ) được chia làm 4 phần rõ ràng:
> - **[Nhận diện mẫu hành vi]:** Chỉ ra xu hướng thất thường trong tuần qua (ví dụ: liên tục sập nguồn, hoặc liên tục có chỉ số mood cao dễ vạ miệng).
> - **[Lời khuyên nghiêm túc & giá trị thực]:** Đưa ra lời nhắc nhở thực tế từ `Master_Advice` phù hợp nhất với trạng thái mood hiện tại của họ ngay hôm nay, giải thích nguyên nhân và cách xử lý theo khoa học tâm lý.
> - **[Lời khuyên cợt nhả & hài hước]:** Nói năng như một người bạn thân chí cốt, dùng văn phong cợt nhả, hài hước, châm biếm nhẹ nhàng nhưng thực tế để chọc cười hoặc "tát tỉnh" người dùng khỏi cơn u uất hay phấn khích quá đà.
> - **[Hành động khuyến nghị hôm nay]:** Đưa ra một hành động cụ thể, dễ thực hiện ngay lập tức (Micro-action) để điều hòa cảm xúc và giữ năng lượng ở mức cân bằng nhất.
>
> **Yêu cầu về văn phong:** Linh hoạt giữa nghiêm túc và hài hước ở các phần tương ứng, đi thẳng vào cốt lõi vấn đề, không dông dài lý thuyết.