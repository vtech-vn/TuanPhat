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

  const opportunities = readSheet(ss, 'Opportunity');
  const oppLines      = readSheet(ss, 'OPP_Line');

  // Build map: Opp_ID → array of activity lines
  const activityMap = {};
  oppLines.forEach(function(line) {
    const id = String(line['Opp_ID'] || '').trim();
    if (!id) return;
    if (!activityMap[id]) activityMap[id] = [];
    activityMap[id].push({
      lineId:      line['OPP_Line_ID'] || '',
      description: line['Description'] || '',
      date:        line['Last_Update_Date'] || '',
      by:          line['Last_Updated_By'] || ''
    });
  });

  // Sort activities by date desc per opportunity
  Object.keys(activityMap).forEach(function(id) {
    activityMap[id].sort(function(a, b) {
      return new Date(b.date) - new Date(a.date);
    });
  });

  // Enrich opportunities with activity log & latest activity date
  const enriched = opportunities.map(function(opp) {
    const id = String(opp['Opp_ID'] || '').trim();
    const activities = activityMap[id] || [];
    return {
      id:           id,
      customerName: opp['Customer_Name'] || '',
      phone:        opp['Phone'] || '',
      address:      opp['Address'] || '',
      zone:         opp['Zone'] || '',
      category:     opp['Category'] || '',
      description:  opp['Description'] || '',
      note:         opp['Note'] || '',
      source:       opp['Source'] || '',
      score:        opp['Score'] || '',
      salesPic:     opp['Sales_PIC'] || '',
      status:       opp['Status'] || '',
      lastUpdate:   opp['Last_Update_Date'] || '',
      lastUpdatedBy:opp['Last_Updated_By'] || '',
      activities:   activities,
      activityCount: activities.length
    };
  });

  return JSON.stringify({
    success: true,
    data: {
      opportunities: enriched,
      total: enriched.length
    }
  });
}
