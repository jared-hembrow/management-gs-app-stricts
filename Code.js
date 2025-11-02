function getShoppingTransactions() {
let spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
let sourceSheet = spreadSheet.getSheetByName("Expanses2526");

let sourceRange = sourceSheet.getDataRange();
let sourceValues = sourceRange.getValues();
console.log(sourceValues)




let headers = ["Date", "Cost", "Description"]
let newValues = []

let approved = [
  "WOOLWORTHS", "CRAIG COOKS PRIME QUALITY"
]


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
      newValues.push(value)
    }

    }
  }
})

let formattedValues = [headers, ...newValues.map(v => ([v[0], v[2], v[4]]))]

let rowCount = sourceValues.length;
let columnCount = sourceValues[0].length;

let targetSheet = spreadSheet.getSheetByName("Shopping");
let targetRange = targetSheet.getRange(1,1, formattedValues.length, 3);

console.log(formattedValues)
targetRange.setValues(formattedValues);

}
