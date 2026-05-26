/**
 * ============================================================
 * FILE: MAIN_Router.js
 * Chức năng: Điều phối chung (Router) cho toàn bộ Web App Tuấn Phát
 * Mọi request HTTP gửi tới Apps Script đều đi qua hàm doGet này.
 * ============================================================
 */

function doGet(e) {

  // --- API ROUTING CHO DASHBOARD (GitHub Pages) ---

  // 1. Yêu cầu OTP
  if (e.parameter.api === 'request_otp') {
    return handleRequestOtp(e);
  }

  // 2. Xác thực OTP → tạo session
  if (e.parameter.api === 'verify_otp') {
    return handleVerifyOtp(e);
  }

  // 3. Lấy data dashboard (cần session hợp lệ)
  if (e.parameter.api === 'dashboardData') {
    return handleDashboardData(e);
  }

  // 4. Lấy sổ quỹ (drilldown, cần session)
  if (e.parameter.api === 'bankStatement') {
    return handleBankStatement(e);
  }

  // 5. Export Excel sổ quỹ
  if (e.parameter.api === 'exportExcel') {
    return handleExportExcel(e);
  }

  // --- ROUTE MẶC ĐỊNH: In Báo Giá ---
  // Nếu không có api param → vào chức năng in báo giá
  return handleQuotePrint(e);
}

/**
 * Hàm hỗ trợ cấp quyền (Chạy một lần trong Editor nếu gặp lỗi Permission)
 */
function authorizeApp() {
  MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Xác thực Apps Script Tuấn Phát', 'Bạn đã cấp quyền thành công.');
  console.log('Cấp quyền thành công!');
}

/**
 * Verify session từ request, trả về email nếu hợp lệ, null nếu không
 * Session không có TTL – tồn tại cho đến khi user đăng xuất hoặc xóa thủ công
 */
function verifySession(session) {
  if (!session) return null;
  const raw = PropertiesService.getScriptProperties().getProperty('SESSION_' + session);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data.email || null;
  } catch (e) {
    return null;
  }
}

/**
 * API: Yêu cầu OTP
 */
function handleRequestOtp(e) {
  const email = (e.parameter.email || '').toLowerCase().trim();
  if (!email) {
    return jsonResponse({ success: false, error: 'Vui lòng nhập email.' });
  }
  if (!isEmailAllowed(email)) {
    return jsonResponse({ success: false, error: 'Email không có quyền xem báo cáo.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  PropertiesService.getScriptProperties().setProperty('OTP_' + email, otp);

  try {
    MailApp.sendEmail({
      to: email,
      subject: '🔐 Mã xác thực Đăng nhập Dashboard – Tuấn Phát',
      htmlBody:
        '<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;border:1px solid #e5e7eb;border-radius:12px;">' +
        '<div style="text-align:center;margin-bottom:24px;">' +
        '<div style="width:60px;height:60px;background:#1E7C34;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">' +
        '<span style="color:white;font-size:28px;font-weight:900;">TP</span></div>' +
        '<h2 style="color:#1E7C34;margin:0;font-size:20px;">Tuấn Phát Dashboard</h2></div>' +
        '<p style="color:#374151;margin-bottom:8px;">Mã xác thực (OTP) của bạn là:</p>' +
        '<div style="background:#f0fdf4;border:2px dashed #1E7C34;border-radius:8px;padding:20px;text-align:center;margin:16px 0;">' +
        '<span style="font-size:36px;font-weight:900;color:#1E7C34;letter-spacing:8px;">' + otp + '</span></div>' +
        '<p style="color:#6b7280;font-size:13px;">Mã có hiệu lực trong 10 phút. Không chia sẻ mã này cho người khác.</p>' +
        '</div>'
    });
    return jsonResponse({ success: true, message: 'Đã gửi mã OTP đến email của bạn.' });
  } catch (err) {
    return jsonResponse({ success: false, error: 'Lỗi gửi email: ' + err.message });
  }
}

/**
 * API: Xác thực OTP → tạo session
 */
function handleVerifyOtp(e) {
  const email = (e.parameter.email || '').toLowerCase().trim();
  const otp = (e.parameter.otp || '').trim();

  if (!email || !otp) {
    return jsonResponse({ success: false, error: 'Thiếu email hoặc OTP.' });
  }

  const savedOtp = PropertiesService.getScriptProperties().getProperty('OTP_' + email);
  if (!savedOtp || savedOtp !== otp) {
    return jsonResponse({ success: false, error: 'Mã OTP không đúng hoặc đã hết hạn.' });
  }

  // Xóa OTP đã dùng
  PropertiesService.getScriptProperties().deleteProperty('OTP_' + email);

  // Tạo session vĩnh viễn (không TTL – như HiepLuc)
  const sessionId = Utilities.getUuid();
  const sessionData = {
    email: email,
    createdAt: Date.now()
  };
  PropertiesService.getScriptProperties().setProperty('SESSION_' + sessionId, JSON.stringify(sessionData));

  return jsonResponse({ success: true, session: sessionId, email: email });
}

/**
 * API: Lấy data dashboard
 */
function handleDashboardData(e) {
  const email = verifySession(e.parameter.session);
  if (!email) {
    return jsonResponse({ success: false, error: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.' });
  }
  return ContentService.createTextOutput(getDashboardData()).setMimeType(ContentService.MimeType.JSON);
}

/**
 * API: Lấy sổ quỹ (drilldown)
 */
function handleBankStatement(e) {
  const email = verifySession(e.parameter.session);
  if (!email) {
    return jsonResponse({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
  }
  const bankAccountId = e.parameter.bankAccountId || '';
  const startDate = e.parameter.startDate || '';
  const endDate = e.parameter.endDate || '';
  return ContentService.createTextOutput(getBankStatementData(bankAccountId, startDate, endDate))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * API: Export Excel sổ quỹ
 */
function handleExportExcel(e) {
  const email = verifySession(e.parameter.session);
  if (!email) {
    return jsonResponse({ success: false, error: 'Phiên đăng nhập không hợp lệ.' });
  }
  const bankAccountId = e.parameter.bankAccountId || '';
  const startDate = e.parameter.startDate || '';
  const endDate = e.parameter.endDate || '';
  return exportBankStatementExcel(bankAccountId, startDate, endDate);
}

/**
 * Route in báo giá (chuyển sang QUOTE_Backend)
 */
function handleQuotePrint(e) {
  return getQuotePrintPage(e);
}

/**
 * Kiểm tra email có trong whitelist Report_Email
 */
function isEmailAllowed(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Report_Email');
  if (!sheet) return false;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase().trim() === email) {
      return true;
    }
  }
  return false;
}

/**
 * Helper: trả về JSON response
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
