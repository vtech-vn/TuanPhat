/**
 * ============================================================
 * FILE: DASH_Financial_Backend.js
 * Chức năng: Backend API cho Financial Dashboard Tuấn Phát
 * Sheets sử dụng:
 *   - AR_INV_HD / AR_INV_LINE : Doanh thu
 *   - AP_INV_HD / AP_INV_LINE : Chi phí
 *   - AR_PMT_HD               : Tiền thu vào (Cash Flow)
 *   - PAYMENT                 : Tiền chi ra  (Cash Flow)
 *   - Quote_HD / Quote_Line   : Báo giá
 *   - Banks                   : Danh sách tài khoản ngân hàng
 *   - Company_Profile         : Thông tin công ty
 * ============================================================
 */

const SPREADSHEET_ID = '1HhsUwse5xwGcCY9QqgG54s-RX9tNUhnqCis2vmmC-s0';

/**
 * Lấy toàn bộ data cho dashboard
 */
function getDashboardData() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const data = {};

    const sheetNames = [
      'AR_INV_HD', 'AR_INV_LINE',
      'AP_INV_HD', 'AP_INV_LINE',
      'AR_PMT_HD', 'PAYMENT',
      'Quote_HD', 'Quote_Line',
      'Banks', 'Company_Profile'
    ];

    sheetNames.forEach(name => {
      data[name] = readSheet(ss, name);
    });

    return JSON.stringify({ success: true, data: data });
  } catch (err) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

/**
 * Lấy dữ liệu Sổ Quỹ (Bank Statement) cho một ngân hàng, trong khoảng thời gian
 * @param {string} bankAccountId - ID của bank account (từ Banks.ID)
 * @param {string} startDateStr  - Ngày bắt đầu (ISO string hoặc dd/MM/yyyy)
 * @param {string} endDateStr    - Ngày kết thúc
 */
function getBankStatementData(bankAccountId, startDateStr, endDateStr) {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // Parse dates
    const startDate = parseFlexDate(startDateStr);
    const endDate = parseFlexDate(endDateStr);
    if (endDate) endDate.setHours(23, 59, 59, 999);

    // Đọc Banks để lấy tên bank
    const banks = readSheet(ss, 'Banks');
    let bankLabel = 'Tất cả tài khoản';
    if (bankAccountId) {
      const bank = banks.find(b => String(b.ID).trim() === bankAccountId);
      if (bank) bankLabel = bank.Bank_Account;
    }

    // Đọc AR_PMT_HD (thu vào)
    const arPmt = readSheet(ss, 'AR_PMT_HD');
    // Đọc PAYMENT (chi ra)
    const payments = readSheet(ss, 'PAYMENT');

    // Lọc theo bank và date range
    const transactions = [];

    arPmt.forEach(row => {
      const txDate = parseFlexDate(String(row.Date || ''));
      if (!txDate) return;
      if (bankAccountId && String(row.Bank_Account_ID || '').trim() !== bankAccountId) return;
      if (startDate && txDate < startDate) return;
      if (endDate && txDate > endDate) return;
      transactions.push({
        date: txDate.toISOString(),
        dateDisplay: formatDate(txDate),
        type: 'IN',
        amount: parseAmount(row.Amount),
        description: row.Note || row.Type || 'Thu tiền',
        ref: row.Payment_ID || '',
        customer: row.Customer_ID || ''
      });
    });

    payments.forEach(row => {
      const txDate = parseFlexDate(String(row.Date || ''));
      if (!txDate) return;
      if (bankAccountId && String(row.Bank_Account_ID || '').trim() !== bankAccountId) return;
      if (startDate && txDate < startDate) return;
      if (endDate && txDate > endDate) return;
      transactions.push({
        date: txDate.toISOString(),
        dateDisplay: formatDate(txDate),
        type: 'OUT',
        amount: parseAmount(row.Amount),
        description: row.Note || 'Chi tiền',
        ref: row.Payment_ID || '',
        supplier: row.Supplier_ID || ''
      });
    });

    // Sort theo ngày tăng dần
    transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Tính số dư đầu kỳ = tổng giao dịch TRƯỚC khoảng thời gian
    let openingBalance = 0;
    if (startDate) {
      const allArPmt = readSheet(ss, 'AR_PMT_HD');
      const allPayments = readSheet(ss, 'PAYMENT');

      allArPmt.forEach(row => {
        const txDate = parseFlexDate(String(row.Date || ''));
        if (!txDate || txDate >= startDate) return;
        if (bankAccountId && String(row.Bank_Account_ID || '').trim() !== bankAccountId) return;
        openingBalance += parseAmount(row.Amount);
      });

      allPayments.forEach(row => {
        const txDate = parseFlexDate(String(row.Date || ''));
        if (!txDate || txDate >= startDate) return;
        if (bankAccountId && String(row.Bank_Account_ID || '').trim() !== bankAccountId) return;
        openingBalance -= parseAmount(row.Amount);
      });
    }

    // Tính số dư cuối kỳ
    let runningBalance = openingBalance;
    const txWithBalance = transactions.map(tx => {
      if (tx.type === 'IN') runningBalance += tx.amount;
      else runningBalance -= tx.amount;
      return { ...tx, balance: runningBalance };
    });

    const closingBalance = runningBalance;

    return JSON.stringify({
      success: true,
      data: {
        bankLabel,
        bankAccountId,
        startDate: startDateStr,
        endDate: endDateStr,
        openingBalance,
        closingBalance,
        transactions: txWithBalance,
        totalIn: transactions.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0),
        totalOut: transactions.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0)
      }
    });

  } catch (err) {
    return JSON.stringify({ success: false, error: err.message });
  }
}

/**
 * Export sổ quỹ ra CSV base64 (download ở client)
 */
function exportBankStatementExcel(bankAccountId, startDateStr, endDateStr) {
  try {
    const stmtJson = getBankStatementData(bankAccountId, startDateStr, endDateStr);
    const stmt = JSON.parse(stmtJson);
    if (!stmt.success) {
      return jsonResponse({ success: false, error: stmt.error });
    }

    const d = stmt.data;
    const rows = [];

    // Header info
    rows.push(['SỔ QUỸ – TUẤN PHÁT']);
    rows.push(['Tài khoản:', d.bankLabel]);
    rows.push(['Kỳ:', d.startDate + ' – ' + d.endDate]);
    rows.push([]);
    rows.push(['Số dư đầu kỳ:', formatMoneyCSV(d.openingBalance)]);
    rows.push([]);
    rows.push(['Ngày', 'Diễn giải', 'Tham chiếu', 'Thu vào', 'Chi ra', 'Số dư']);

    d.transactions.forEach(tx => {
      rows.push([
        tx.dateDisplay,
        tx.description,
        tx.ref,
        tx.type === 'IN' ? formatMoneyCSV(tx.amount) : '',
        tx.type === 'OUT' ? formatMoneyCSV(tx.amount) : '',
        formatMoneyCSV(tx.balance)
      ]);
    });

    rows.push([]);
    rows.push(['Tổng thu vào:', formatMoneyCSV(d.totalIn)]);
    rows.push(['Tổng chi ra:', formatMoneyCSV(d.totalOut)]);
    rows.push(['Số dư cuối kỳ:', formatMoneyCSV(d.closingBalance)]);

    // Build CSV with BOM for Excel Vietnamese
    const csv = '\uFEFF' + rows.map(r => r.map(cell => {
      const s = String(cell || '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')).join('\r\n');

    const blob = Utilities.newBlob(csv, 'text/csv', 'SoQuy_TuanPhat.csv');
    const base64 = Utilities.base64Encode(blob.getBytes());

    return jsonResponse({
      success: true,
      filename: 'SoQuy_TuanPhat_' + startDateStr.replace(/\//g, '') + '_' + endDateStr.replace(/\//g, '') + '.csv',
      data: base64,
      mimeType: 'text/csv'
    });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Parse số tiền từ string "1,234,567" hoặc number
 */
function parseAmount(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(String(val).replace(/,/g, '')) || 0;
}

/**
 * Parse date từ nhiều định dạng: ISO, dd/MM/yyyy, MM/dd/yyyy
 */
function parseFlexDate(str) {
  if (!str || str === '' || str === 'undefined') return null;

  // Already a Date object
  if (str instanceof Date) return str;

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // dd/MM/yyyy format (Vietnamese)
  const parts = str.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      // Check if it's dd/MM/yyyy or MM/dd/yyyy
      if (day > 12) {
        // Must be dd/MM/yyyy
        return new Date(year, month - 1, day);
      } else {
        // Ambiguous – assume dd/MM/yyyy (Vietnamese convention)
        return new Date(year, month - 1, day);
      }
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format date thành dd/MM/yyyy
 */
function formatDate(d) {
  if (!d || !(d instanceof Date)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return dd + '/' + mm + '/' + yyyy;
}

/**
 * Format số tiền cho CSV
 */
function formatMoneyCSV(n) {
  if (!n && n !== 0) return '';
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
