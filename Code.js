// ====================== CONFIG ======================
const SHEET_CREDENTIALS = 'Credentials';
const SHEET_PARAMETERS  = 'Parameters';
const SHEET_HEADERS     = 'Headers';
const SHEET_LINES       = 'Lines';

// ====================== MENU (bấm trực tiếp) ======================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🚀 MISA Inbot')
    .addItem('Lấy hóa đơn đầu vào', 'getInboundInvoices')   // bấm menu là chạy luôn
    .addToUi();
}

// ====================== REFRESH TOKEN ======================
function refreshTokens() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const credSheet = ss.getSheetByName(SHEET_CREDENTIALS);
  const data = credSheet.getDataRange().getValues();
  const cred = {};
  data.forEach(row => { if (row[0]) cred[row[0]] = String(row[1]).trim(); });

  if (!cred.password) throw new Error('❌ Chưa điền password trong sheet Credentials!');

  // Bước 1: validateUser
  const validateUrl = 'https://api.meinvoice.vn/api2/validateuser';
  const validateRes = UrlFetchApp.fetch(validateUrl, {
    method: 'POST',
    headers: { 'AppID': cred.appid, 'CompanyTaxCode': cred.taxcode, 'UserName': cred.username, 'Content-Type': 'application/json' },
    payload: JSON.stringify({ PassWord: cred.password }),
    muteHttpExceptions: true
  });

  const validateJson = JSON.parse(validateRes.getContentText());
  if (!validateJson.Success || !validateJson.Data) {
    throw new Error(`❌ Lỗi validateUser: ${validateJson.Message || JSON.stringify(validateJson)}`);
  }

  const secureToken = validateJson.Data.split(';')[1];
  if (!secureToken) throw new Error('❌ SecureToken rỗng. Kiểm tra username/password.');

  // Bước 2: lấy JWT
  const jwtUrl = 'https://api.meinvoice.vn/api2/auth/jwttoken';
  const jwtRes = UrlFetchApp.fetch(jwtUrl, {
    method: 'POST',
    headers: { 'AppID': cred.appid, 'CompanyTaxCode': cred.taxcode, 'UserName': cred.username, 'securetoken': secureToken },
    muteHttpExceptions: true
  });

  const jwtJson = JSON.parse(jwtRes.getContentText());
  if (!jwtJson.Success || !jwtJson.Data?.AccessToken) {
    throw new Error(`❌ Lỗi lấy JWT: ${jwtJson.Message || JSON.stringify(jwtJson)}`);
  }

  const jwtToken = jwtJson.Data.AccessToken;

  // Cập nhật lại sheet
  credSheet.getRange('B6').setValue(secureToken);   // securetoken
  credSheet.getRange('B7').setValue(jwtToken);      // jwttoken

  return { secureToken, jwtToken };
}

// ====================== MAIN FUNCTION ======================
function getInboundInvoices() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Tự động refresh token
    refreshTokens();
    
    const credSheet = ss.getSheetByName(SHEET_CREDENTIALS);
    const credData = credSheet.getDataRange().getValues();
    const cred = {};
    credData.forEach(row => { if (row[0]) cred[row[0]] = String(row[1]).trim(); });

    // Đọc Parameters
    const paramSheet = ss.getSheetByName(SHEET_PARAMETERS);
    const paramData = paramSheet.getDataRange().getValues();
    const param = {};
    paramData.forEach(row => { if (row[0]) param[row[0]] = row[1]; });

    // Chuyển Date sang ISO +07:00
    let fromStr = param.from;
    let toStr = param.to;
    if (param.from instanceof Date) fromStr = param.from.toISOString().replace('Z', '+07:00').replace('.000', '');
    if (param.to instanceof Date)   toStr   = param.to.toISOString().replace('Z', '+07:00').replace('.000', '');

    // Xóa dữ liệu cũ
    ss.getSheetByName(SHEET_HEADERS).clearContents();
    ss.getSheetByName(SHEET_LINES).clearContents();

    // Gọi API
    const baseUrl = `https://app.meinvoice.vn/inbot/api/${cred.subscriberid}/${cred.organizationid}/invoices/v2/modified`;
    const query = `?from=${encodeURIComponent(fromStr)}&to=${encodeURIComponent(toStr)}&take=${param.take || 100}&skip=${param.skip || 0}&IsFilterInvDate=${param.IsFilterInvDate || false}`;

    const response = UrlFetchApp.fetch(baseUrl + query, {
      method: 'GET',
      headers: { 'ClientId': cred.clientid, 'Authorization': `Bearer ${cred.jwttoken}` },
      muteHttpExceptions: true
    });

    const json = JSON.parse(response.getContentText());
    if (!json.Success || !json.Data?.Data) throw new Error('Lỗi API: ' + (json.Message || JSON.stringify(json)));

    const invoices = json.Data.Data;

    // Dữ liệu Header
    const headersData = [[
      'InvoiceId', 'InvoiceNo', 'InvoiceDate', 'SignedDate', 'SellerTaxCode', 'SellerName',
      'BuyerTaxCode', 'BuyerName', 'TotalAmountWithoutVat', 'TotalVATAmount', 'TotalAmount',
      'PaymentMethod', 'CcyCode', 'Status', 'MCCQT', 'SearchCode', 'LinkSearch'
    ]];

    const linesData = [[
      'InvoiceId', 'InvoiceNo', 'LineNumber', 'ItemCode', 'ItemName', 'UnitName',
      'Quantity', 'UnitPrice', 'AmountWithoutVat', 'VatRate', 'VatAmount', 'Amount'
    ]];

    invoices.forEach(inv => {
      headersData.push([
        inv.InvoiceId || '', inv.InvoiceNo || '',
        inv.InvoiceDate ? new Date(inv.InvoiceDate) : '',
        inv.SignedDate ? new Date(inv.SignedDate) : '',
        inv.SellerTaxCode || '', inv.SellerName || '',
        inv.BuyerTaxCode || '', inv.BuyerName || '',
        inv.TotalAmountWithoutVat || 0, inv.TotalVATAmount || 0, inv.TotalAmount || 0,
        inv.PaymentMethod || '', inv.CcyCode || '', inv.Status || '',
        inv.MCCQT || '', inv.SearchCode || '', inv.LinkSearch || ''
      ]);

      if (inv.Items && inv.Items.length > 0) {
        inv.Items.forEach(item => {
          linesData.push([
            inv.InvoiceId || '', inv.InvoiceNo || '',
            item.LineNumber || '', item.ItemCode || '', item.ItemName || '', item.UnitName || '',
            item.Quantity || 0, item.UnitPrice || 0,
            item.AmountWithoutVat || 0, item.VatRate || 0,
            item.VatAmount || 0, item.Amount || 0
          ]);
        });
      }
    });

    // Ghi dữ liệu
    const headerSheet = ss.getSheetByName(SHEET_HEADERS);
    const lineSheet   = ss.getSheetByName(SHEET_LINES);

    headerSheet.getRange(1, 1, headersData.length, headersData[0].length).setValues(headersData);
    lineSheet.getRange(1, 1, linesData.length, 12).setValues(linesData);

    // === BUỘC ĐỊNH DẠNG TEXT CHO CÁC CỘT CẦN THIẾT ===
    headerSheet.getRange('A2:A').setNumberFormat('@');   // InvoiceId
    headerSheet.getRange('B2:B').setNumberFormat('@');   // InvoiceNo
    headerSheet.getRange('E2:E').setNumberFormat('@');   // SellerTaxCode

    // Format header
    headerSheet.getRange('A1:Q1').setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');
    lineSheet.getRange('A1:L1').setFontWeight('bold').setBackground('#4a86e8').setFontColor('white');

    SpreadsheetApp.getUi().alert(`✅ Đã import thành công ${invoices.length} hóa đơn!`);

  } catch (e) {
    SpreadsheetApp.getUi().alert('❌ LỖI: ' + e.message);
    console.error(e);
  }
}