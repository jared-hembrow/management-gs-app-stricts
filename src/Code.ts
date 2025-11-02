function getShoppingTransactions() {
  //   Constants
  const sourceSheetName = "Expanses2526";
  const targetSheetName = "Shopping";
  const headers = ["Date", "Cost", "Description"];

  //   Get source
  let spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
  let sourceSheet = spreadSheet.getSheetByName(sourceSheetName);
  if (!sourceSheet) throw new Error(`sheet: ${sourceSheetName} not found`);

  let sourceRange = sourceSheet.getDataRange();
  let sourceValues = sourceRange.getValues();
  console.log(sourceValues);

  //   Filter and create new rows
  let newValues: string[][] = [];

  let approved = ["WOOLWORTHS", "CRAIG COOKS PRIME QUALITY"];

  /**
 * [ Fri Nov 07 2025 00:00:00 GMT+1100 (Australian Eastern Daylight Time),
    Fri Nov 07 2025 00:00:00 GMT+1100 (Australian Eastern Daylight Time),
    -104.24,
    '+555.22',
    'YORI KOREAN RESTAURA EPPING NSWAU',
    '' ],
    */
  sourceValues.forEach((value, index) => {
    if (value.length > 5) {
      for (const w of approved) {
        if (value[4].includes(w)) {
          newValues.push(value);
        }
      }
    }
  });

  let formattedValues = [headers, ...newValues.map((v) => [v[0], v[2], v[4]])];

  let rowCount = sourceValues.length;
  let columnCount = sourceValues[0].length;

  let targetSheet = spreadSheet.getSheetByName(targetSheetName);
  if (!targetSheet) throw new Error(`sheet: ${targetSheetName} not found`);
  let targetRange = targetSheet.getRange(1, 1, formattedValues.length, 3);

  console.log(formattedValues);
  targetRange.setValues(formattedValues);
}
