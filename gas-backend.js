/**
 * MINDFLOW BACKEND - GOOGLE APPS SCRIPT
 * Hướng dẫn lắp đặt:
 * 1. Mở Google Sheets của bạn.
 * 2. Chọn Tiện ích mở rộng (Extensions) > Apps Script.
 * 3. Xóa hết code cũ và dán toàn bộ đoạn code này vào.
 * 4. Vào mục Cấu hình Dự án (Project Settings - biểu tượng bánh răng bên trái) > Script Properties > Thêm thuộc tính:
 *    - Name: GEMINI_API_KEY
 *    - Value: (Mã API Key bạn lấy từ Google AI Studio)
 * 5. Bấm Deploy (Triển khai) > New deployment (Triển khai mới) > Select type: Web App.
 *    - Execute as: Me (Tài khoản của bạn)
 *    - Who has access: Anyone (Mọi người)
 * 6. Copy URL Web App nhận được và dán vào phần Cài đặt của ứng dụng MindFlow.
 */

// Tên các Sheets
const SHEET_DAILY_LOGS = "Daily_Logs";
const SHEET_MASTER_ADVICE = "Master_Advice";

// Cấu hình CORS (Google Apps Script tự động hỗ trợ CORS Redirect)
function getCorsResponse(content) {
  return ContentService.createTextOutput(JSON.stringify(content))
    .setMimeType(ContentService.MimeType.JSON);
}

// Xử lý Preflight Request cho CORS
function doOptions(e) {
  return ContentService.createTextOutput("");
}

/**
 * GET Request: Đọc dữ liệu hoặc lấy lời khuyên AI
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getLogs") {
    return handleGetLogs();
  }
  
  if (action === "getAdvice") {
    return handleGetAdvice();
  }
  
  return getCorsResponse({ error: "Action không hợp lệ. Vui lòng sử dụng action=getLogs hoặc action=getAdvice" });
}

/**
 * POST Request: Lưu bài học mới (Check-in, Phanh Gấp hoặc Xả Não)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_DAILY_LOGS);
    
    // Nếu sheet chưa tồn tại, tự động tạo mới kèm header
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_DAILY_LOGS);
      sheet.appendRow(["id", "createdAt", "moodRating", "contextTag", "lessonNote", "storyDetail"]);
    }
    
    // Ghi dữ liệu dòng mới
    sheet.appendRow([
      postData.id || Date.now().toString(),
      postData.createdAt || new Date().toISOString(),
      postData.moodRating,
      postData.contextTag,
      postData.lessonNote,
      postData.storyDetail || ""
    ]);
    
    return getCorsResponse({ success: true, message: "Đã lưu thành công!" });
  } catch (err) {
    return getCorsResponse({ error: "Lỗi lưu dữ liệu: " + err.toString() });
  }
}

/**
 * Đọc toàn bộ Logs trong Sheet Daily_Logs
 */
function handleGetLogs() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_DAILY_LOGS);
    if (!sheet) {
      return getCorsResponse([]);
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const logs = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const log = {};
      headers.forEach((header, index) => {
        log[header] = row[index];
      });
      logs.push(log);
    }
    
    return getCorsResponse(logs);
  } catch (err) {
    return getCorsResponse({ error: "Lỗi lấy danh sách logs: " + err.toString() });
  }
}

/**
 * Trình gọi AI Oracle (Gemini 1.5 Flash)
 */
function handleGetAdvice() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Đọc dữ liệu Daily_Logs (7 ngày gần nhất)
    const logsSheet = ss.getSheetByName(SHEET_DAILY_LOGS);
    let logsData = [];
    if (logsSheet) {
      const allRows = logsSheet.getDataRange().getValues();
      const headers = allRows[0];
      const allLogs = [];
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        const log = {};
        headers.forEach((h, idx) => { log[h] = row[idx]; });
        allLogs.push(log);
      }
      // Lấy 7 bản ghi cuối
      logsData = allLogs.slice(-15); // Lấy nhiều hơn một chút để lọc ra đủ 7 ngày checkin
    }
    
    // 2. Đọc dữ liệu Master_Advice
    const adviceSheet = ss.getSheetByName(SHEET_MASTER_ADVICE);
    let adviceData = [];
    if (adviceSheet) {
      const allRows = adviceSheet.getDataRange().getValues();
      const headers = allRows[0];
      for (let i = 1; i < allRows.length; i++) {
        const row = allRows[i];
        const item = {};
        headers.forEach((h, idx) => { item[h] = row[idx]; });
        adviceData.push(item);
      }
    }
    
    // 3. Đọc Gemini API Key từ Script Properties
    const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      return getCorsResponse({
        error: "Chưa cấu hình GEMINI_API_KEY trong Project Settings của Google Apps Script!"
      });
    }
    
    // 4. Tạo Prompt gửi lên Gemini
    const systemPrompt = 
      "Sử dụng cấu trúc dữ liệu JSON đính kèm từ hai trang tính Google Sheets của người dùng:\n" +
      "1. `Daily_Logs`: Chứa dữ liệu trạng thái tinh thần thực tế 7 ngày qua của người dùng.\n" +
      "2. `Master_Advice`: Bộ quy tắc giải pháp cốt lõi về tâm lý đã được đúc kết cho người dùng.\n\n" +
      "Nhiệm vụ của bạn: Đóng vai trò là một 'Bộ nhớ ngoài khách quan', đối chiếu hành vi thực tế tuần qua của người dùng với Bộ quy tắc giải pháp để đưa ra một phản hồi DUY NHẤT dưới dạng cấu trúc JSON sạch chứa đúng các key sau:\n" +
      "- `patternTitle`: Tiêu đề tóm tắt chu kỳ cảm xúc tuần qua (ví dụ: 'Quá tải cảm xúc & Đang sập nguồn (Đã xả não 3 lần, tự phanh 2 lần trước giờ G)').\n" +
      "- `patternDesc`: Phân tích chu kỳ tâm lý 7 ngày qua, giải thích nguyên nhân dựa vào các sự kiện check-in và thống kê xả não/phanh gấp của họ.\n" +
      "- `seriousAdvice`: Lời khuyên nghiêm túc, sâu sắc từ Master Advice, giải thích nguyên nhân và cách điều hòa theo tâm lý học.\n" +
      "- `funnyAdvice`: Lời khuyên cợt nhả, hài hước, châm biếm nhẹ nhàng như một người bạn thân chí cốt troll để 'tát tỉnh' người dùng.\n" +
      "- `microAction`: Một hành động cụ thể, dễ thực hiện ngay lập tức (Micro-action) để điều hòa cảm xúc của ngày hôm nay.\n\n" +
      "Trả về kết quả định dạng JSON thuần, không bọc trong ```json và ```.";

    const userPrompt = `Dữ liệu lịch sử 7 ngày: ${JSON.stringify(logsData)}\n\nBộ quy tắc Master Advice: ${JSON.stringify(adviceData)}`;
    
    // Gọi API Gemini
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
    
    const payload = {
      contents: [{
        parts: [{
          text: systemPrompt + "\n\n" + userPrompt
        }]
      }]
    };
    
    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const resText = response.getContentText();
    const resJson = JSON.parse(resText);
    
    if (resJson.candidates && resJson.candidates[0].content.parts[0].text) {
      let rawText = resJson.candidates[0].content.parts[0].text.trim();
      // Làm sạch nếu Gemini vẫn trả về markdown block
      if (rawText.startsWith("```json")) {
        rawText = rawText.substring(7);
      }
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3);
      }
      
      const parsedAdvice = JSON.parse(rawText.trim());
      return getCorsResponse(parsedAdvice);
    } else {
      return getCorsResponse({ error: "Lỗi từ Gemini API: " + JSON.stringify(resJson) });
    }
    
  } catch (err) {
    return getCorsResponse({ error: "Lỗi gọi AI Oracle: " + err.toString() });
  }
}
