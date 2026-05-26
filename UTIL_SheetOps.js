/**
 * ============================================================
 * FILE: UTIL_SheetOps.js
 * Chức năng: Tiện ích đọc/ghi sheet dùng chung
 * ============================================================
 */

/**
 * Đọc toàn bộ một sheet thành array of objects
 * @param {Spreadsheet} ss
 * @param {string} sheetName
 * @returns {Array<Object>}
 */
function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      const val = data[i][j];
      if (headers[j] === '') continue;
      if (val instanceof Date) {
        row[headers[j]] = val.toISOString();
      } else {
        row[headers[j]] = (val !== null && val !== undefined) ? val : '';
      }
      if (val !== '' && val !== null && val !== undefined) hasValue = true;
    }
    if (hasValue) rows.push(row);
  }
  return rows;
}

/**
 * Đọc sheet và lọc theo một cột = giá trị
 * @param {Spreadsheet} ss
 * @param {string} sheetName
 * @param {string} filterCol - tên cột để lọc
 * @param {string} filterVal - giá trị cần lọc
 * @returns {Array<Object>}
 */
function readSheetFiltered(ss, sheetName, filterCol, filterVal) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  const colIdx = headers.indexOf(filterCol);
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    if (colIdx >= 0 && String(data[i][colIdx]).trim() !== filterVal) continue;
    const row = {};
    let hasValue = false;
    for (let j = 0; j < headers.length; j++) {
      if (headers[j] === '') continue;
      const val = data[i][j];
      if (val instanceof Date) {
        row[headers[j]] = val.toISOString();
      } else {
        row[headers[j]] = (val !== null && val !== undefined) ? val : '';
      }
      if (val !== '' && val !== null && val !== undefined) hasValue = true;
    }
    if (hasValue) rows.push(row);
  }
  return rows;
}
