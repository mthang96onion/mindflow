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

  // Nhận yêu cầu cứu trợ tức thời qua GET để tránh lỗi CORS
  if (action === "getInstantAdvice") {
    const text = e.parameter.text;
    const tag = e.parameter.tag;
    return handleGetInstantAdvice(text, tag);
  }

  // Nhận yêu cầu phân tích sự kiện cụ thể qua GET để tránh lỗi CORS
  if (action === "analyzeEvent") {
    try {
      const log = JSON.parse(decodeURIComponent(e.parameter.log));
      return handleAnalyzeEvent(log);
    } catch(err) {
      return getCorsResponse({ error: "Lỗi giải mã tham số log: " + err.toString() });
    }
  }
  
  return getCorsResponse({ error: "Action không hợp lệ. Vui lòng sử dụng action=getLogs hoặc action=getAdvice" });
}

/**
 * POST Request: Lưu bài học mới (Check-in, Phanh Gấp hoặc Xả Não)
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    
    // Ghi log check-in bình thường vào sheet Daily_Logs (vẫn dùng POST no-cors tốt vì không cần đọc phản hồi)
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_DAILY_LOGS);
    
    // Nếu sheet chưa tồn tại, tự động tạo mới kèm header
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_DAILY_LOGS);
      sheet.appendRow(["id", "createdAt", "moodRating", "contextTag", "lessonNote", "storyDetail", "aiExplanation", "aiRecommendation"]);
    }
    
    // Ghi dữ liệu dòng mới
    sheet.appendRow([
      postData.id || Date.now().toString(),
      postData.createdAt || new Date().toISOString(),
      postData.moodRating,
      postData.contextTag,
      postData.lessonNote,
      postData.storyDetail || "",
      postData.aiExplanation || "",
      postData.aiRecommendation || ""
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
 * Endpoint AI: Cứu trợ tức thời khi xả uất ức ở Tab 2
 */
function handleGetInstantAdvice(text, tag) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      return getCorsResponse({ error: "Chưa cấu hình GEMINI_API_KEY trong Project Settings!" });
    }
    
    const systemPrompt = 
      "Người dùng vừa viết một văn bản xả giận/uất ức (Brain Dump) trong bối cảnh: '" + tag + "'.\n" +
      "Nhiệm vụ của bạn: Hãy phân tích nhanh văn bản xả giận này và trả về phản hồi tâm lý cứu trợ tức thời dưới dạng cấu trúc JSON chứa đúng các key sau:\n" +
      "- `seriousAdvice`: Lời khuyên nghiêm túc, thấu cảm, khoa học tâm lý và có giá trị thật giúp họ giải tỏa hoặc kéo não về thực tại ngay lập tức (ví dụ: rửa mặt nước đá, ngửi tinh dầu, hít thở sâu, uống nước lạnh...). Lời khuyên này nên hướng tới việc giải quyết hoặc làm nguội cảm xúc tức thời dựa vào nội dung uất ức họ gõ.\n" +
      "- `funnyAdvice`: Lời khuyên cợt nhả, hài hước, mang tính chất châm biếm nhẹ nhàng, troll vui vẻ từ một người bạn thân chí cốt để làm họ bật cười, giảm bớt sự căng thẳng của vấn đề.\n\n" +
      "Trả về kết quả định dạng JSON thuần, không bọc trong ```json và ```.";
      
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;
    const payload = {
      contents: [{
        parts: [{
          text: systemPrompt + "\n\nNội dung xả uất ức của người dùng: \"" + text + "\""
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
      if (rawText.startsWith("```json")) rawText = rawText.substring(7);
      if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length - 3);
      return getCorsResponse(JSON.parse(rawText.trim()));
    } else {
      return getCorsResponse({ error: "Lỗi từ Gemini API: " + JSON.stringify(resJson) });
    }
  } catch (err) {
    return getCorsResponse({ error: "Lỗi AI cứu trợ tức thời: " + err.toString() });
  }
}

/**
 * Endpoint AI: Phân tích một sự kiện giao tiếp chọn lọc ở Tab 3
 */
function handleAnalyzeEvent(log) {
  try {
    const apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
    if (!apiKey) {
      return getCorsResponse({ error: "Chưa cấu hình GEMINI_API_KEY trong Project Settings!" });
    }
    
    const systemPrompt = 
      "Người dùng muốn bạn phân tích một sự kiện giao tiếp/check-in cụ thể khiến họ bị tác động cảm xúc tiêu cực hoặc quá phấn khích.\n" +
      "Thông tin sự kiện:\n" +
      "- Bối cảnh: " + log.contextTag + "\n" +
      "- Cảm xúc: Mood " + log.moodRating + "/5\n" +
      "- Bài học xương máu tự rút ra: \"" + log.lessonNote + "\"\n" +
      "- Chi tiết bối cảnh câu chuyện: \"" + (log.storyDetail || "Không có chi tiết") + "\"\n\n" +
      "Nhiệm vụ của bạn:\n" +
      "1. Phân tích nguyên nhân tâm lý/khoa học não bộ đứng sau phản ứng cảm xúc của họ tại sự kiện này (ví dụ: Amygdala Hijack, phản ứng Freeze, cơ chế tự vệ, tư duy nhị nguyên, kỳ vọng phóng chiếu...).\n" +
      "2. Đưa ra phân tích sâu sắc và các hướng giải quyết, hành động cụ thể để khắc phục hoặc tránh lặp lại sai lầm trong tương lai.\n\n" +
      "Hãy viết phản hồi một cách thấu cảm, sâu sắc và thực tế, phân tích trực tiếp vào vấn đề của họ. Kết quả trả về dưới dạng JSON chứa đúng các key:\n" +
      "- `explanation`: Giải thích nguyên nhân tâm lý/khoa học não bộ đúc kết ngắn gọn, khoa học.\n" +
      "- `recommendation`: Khuyến nghị hành động cụ thể để giải quyết hoặc ngăn ngừa tái phát.\n\n" +
      "Trả về kết quả định dạng JSON thuần, không bọc trong ```json và ```.";
      
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;
    const payload = {
      contents: [{
        parts: [{
          text: systemPrompt
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
      if (rawText.startsWith("```json")) rawText = rawText.substring(7);
      if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length - 3);
      
      const parsed = JSON.parse(rawText.trim());
      // Tự động ghi lại kết quả phân tích của AI vào Sheet
      saveAnalysisToSheet(log.id, parsed.explanation, parsed.recommendation);
      
      return getCorsResponse(parsed);
    } else {
      return getCorsResponse({ error: "Lỗi từ Gemini API: " + JSON.stringify(resJson) });
    }
  } catch (err) {
    return getCorsResponse({ error: "Lỗi AI phân tích sự kiện: " + err.toString() });
  }
}

/**
 * Ghi đè kết quả phân tích AI vào đúng dòng trong Google Sheets
 */
function saveAnalysisToSheet(logId, explanation, recommendation) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_DAILY_LOGS);
    if (!sheet) return;
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const idCol = headers.indexOf("id");
    let expCol = headers.indexOf("aiExplanation");
    let recCol = headers.indexOf("aiRecommendation");
    
    // Nếu chưa có cột tiêu đề phân tích (bản sheet cũ), tự động thêm vào cuối
    if (expCol === -1 || recCol === -1) {
      const lastCol = headers.length;
      sheet.getRange(1, lastCol + 1).setValue("aiExplanation");
      sheet.getRange(1, lastCol + 2).setValue("aiRecommendation");
      expCol = lastCol;
      recCol = lastCol + 1;
    }
    
    // Tìm dòng có ID tương ứng để cập nhật
    for (let i = 1; i < data.length; i++) {
      const sheetIdStr = String(data[i][idCol]).replace(/\.0$/, "").trim();
      const targetIdStr = String(logId).replace(/\.0$/, "").trim();
      if (sheetIdStr === targetIdStr) {
        sheet.getRange(i + 1, expCol + 1).setValue(explanation);
        sheet.getRange(i + 1, recCol + 1).setValue(recommendation);
        break;
      }
    }
  } catch (err) {
    console.error("Lỗi ghi nhận phân tích AI vào Sheet: " + err.toString());
  }
}

/**
 * Trình gọi AI Oracle (Gemini 1.5 Flash) - Báo cáo Tổng Quan 7 Ngày
 */
function handleGetAdvice() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Đọc dữ liệu Daily_Logs
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
      logsData = allLogs.slice(-15); // Lấy 15 bản ghi gần nhất để phân tích
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
    
    // 4. Tạo Prompt gửi lên Gemini (Báo cáo tổng quan 7 ngày)
    const systemPrompt = 
      "Sử dụng cấu trúc dữ liệu JSON đính kèm từ hai trang tính Google Sheets của người dùng:\n" +
      "1. `Daily_Logs`: Chứa dữ liệu trạng thái tinh thần thực tế 7 ngày qua của người dùng.\n" +
      "2. `Master_Advice`: Bộ quy tắc giải pháp cốt lõi về tâm lý đã được đúc kết cho người dùng.\n\n" +
      "Nhiệm vụ của bạn: Hãy phân tích xu hướng tổng quan 7 ngày qua, số lần phanh gấp và số lần xả uất ức. Đưa ra báo cáo đúc kết tổng quan hành vi và bài học. Trả về cấu trúc JSON chứa đúng các key sau:\n" +
      "- `patternTitle`: Tiêu đề tóm tắt chu kỳ cảm xúc tuần qua (ví dụ: 'Quá tải cảm xúc & Đang sập nguồn (Đã xả não 3 lần, tự phanh 2 lần trước giờ G)').\n" +
      "- `patternDesc`: Phân tích chi tiết chu kỳ tâm lý 7 ngày qua, lý giải các diễn biến dựa trên số liệu ghi nhận.\n" +
      "- `seriousAdvice`: Đúc kết lời khuyên hành vi dài hạn dựa trên Master Advice của họ.\n" +
      "- `microAction`: Một hành động nhỏ cụ thể khuyến nghị họ thực hiện ngay hôm nay.\n\n" +
      "Trả về kết quả định dạng JSON thuần, không bọc trong ```json và ```.";

    const userPrompt = `Dữ liệu lịch sử: ${JSON.stringify(logsData)}\n\nBộ quy tắc Master Advice: ${JSON.stringify(adviceData)}`;
    
    // Gọi API Gemini
    const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + apiKey;
    
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
      if (rawText.startsWith("```json")) rawText = rawText.substring(7);
      if (rawText.endsWith("```")) rawText = rawText.substring(0, rawText.length - 3);
      
      const parsedAdvice = JSON.parse(rawText.trim());
      return getCorsResponse(parsedAdvice);
    } else {
      return getCorsResponse({ error: "Lỗi từ Gemini API: " + JSON.stringify(resJson) });
    }
  } catch (err) {
    return getCorsResponse({ error: "Lỗi gọi AI Oracle tổng quan: " + err.toString() });
  }
}
