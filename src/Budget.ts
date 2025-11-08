function GetWeeklsBudget(
  date: Date,
  sourceSheetName: string = "Budget"
): any[][] {
  // ============= DATA VALUES ==============
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  let sourceSheet = SS.getSheetByName(sourceSheetName);
  if (!sourceSheet) throw new Error(`sheet: ${sourceSheetName} not found`);

  let sourceRange = sourceSheet.getDataRange();
  let dataValues = sourceRange.getValues();
  // Remove headers
  dataValues.shift();

  // ============ Calculate dates ==============
  const startWeek = new Date(date);
  const currentDayOfWeek = date.getDay();
  startWeek.setDate(
    date.getDate() - (currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1)
  );
  // Set time to the start of the day (00:00:00)
  startWeek.setHours(0, 0, 0, 0);
  const endWeek = new Date(startWeek);
  // Current week ends 6 days after the start (Monday + 6 days = Sunday)
  endWeek.setDate(startWeek.getDate() + 6);
  // Set time to the end of the day (23:59:59.999) for the Sunday boundary
  endWeek.setHours(23, 59, 59, 999);
  // ============= ============= ============

  const filteredData = dataValues.filter((row) => {
    const withdrawInterval = row[9];
    if (withdrawInterval === "Monthly") {
      const dateWithdrawn = Number(row[6]);
      if (
        dateWithdrawn >= startWeek.getDate() &&
        dateWithdrawn <= endWeek.getDate()
      )
        return true;
    }
  });

  return [[]];
}
