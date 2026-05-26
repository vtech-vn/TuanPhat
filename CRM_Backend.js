/**
 * ============================================================
 * FILE: CRM_Backend.js
 * Chức năng: API backend cho CRM Dashboard
 * Được gọi từ MAIN_Router.js → handleCrmData()
 * ============================================================
 */

/**
 * Trả về toàn bộ dữ liệu CRM cho dashboard
 */
function getCrmData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 1. Build employee map: NV_ID → clean name ──────────
  const empMap = {};
  const empRows = readSheet(ss, 'Employees');
  empRows.forEach(function(emp) {
    const id   = String(emp['Employee_ID'] || '').trim();
    const raw  = String(emp['Name'] || '').trim();
    // Format: "NV05-Đào Thị Mai Trâm " → strip the "NVxx-" prefix
    const name = raw.replace(/^NV\d+[-–]\s*/, '').trim() || raw;
    if (id) empMap[id] = name;
  });

  // ── 2. Read Opportunity + OPP_Line ─────────────────────
  const opportunities = readSheet(ss, 'Opportunity');
  const oppLines      = readSheet(ss, 'OPP_Line');

  // Build map: Opp_ID → array of activity lines (sorted desc)
  const activityMap = {};
  oppLines.forEach(function(line) {
    const id = String(line['Opp_ID'] || '').trim();
    if (!id) return;
    if (!activityMap[id]) activityMap[id] = [];
    activityMap[id].push({
      lineId:      line['OPP_Line_ID']    || '',
      description: line['Description']    || '',
      date:        line['Last_Update_Date'] || '',
      by:          line['Last_Updated_By'] || '',
      byName:      empMap[String(line['Last_Updated_By'] || '').trim()] || line['Last_Updated_By'] || ''
    });
  });
  Object.keys(activityMap).forEach(function(id) {
    activityMap[id].sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  });

  // ── 3. Enrich opportunities ────────────────────────────
  const enriched = opportunities.map(function(opp) {
    const id     = String(opp['Opp_ID'] || '').trim();
    const picId  = String(opp['Sales_PIC'] || '').trim();
    const activities = activityMap[id] || [];
    return {
      id:            id,
      customerName:  opp['Customer_Name']   || '',
      phone:         opp['Phone']           || '',
      address:       opp['Address']         || '',
      zone:          opp['Zone']            || '',
      category:      opp['Category']        || '',
      description:   opp['Description']     || '',
      note:          opp['Note']            || '',
      source:        opp['Source']          || '',
      score:         opp['Score']           || '',
      salesPic:      picId,
      salesPicName:  empMap[picId] || picId, // real name from Employees sheet
      amount:        parseFloat(opp['Amount']) || 0, // pipeline value
      status:        opp['Status']           || '',
      lastUpdate:    opp['Last_Update_Date'] || '',
      lastUpdatedBy: opp['Last_Updated_By']  || '',
      activities:    activities,
      activityCount: activities.length
    };
  });

  return JSON.stringify({
    success: true,
    data: {
      opportunities: enriched,
      total: enriched.length,
      employeeMap: empMap
    }
  });
}
