function WorkHourHeaders() {
  return [["Date", "Day", "Start", "Finish", "Hours", "Rate", "Income", "Job"]];
}
function YTDHeaders() {
  return [
    [
      "Gross YTD",
      "Net YTD",
      "",
      "est Gross Income",
      "est Net Income",
      "est Tax YTD",
    ],
  ];
}

// UTILS
function GetTaxForYear(income: number): number {
  if (income > 45000) return (income - 45000) * 0.3 + 4288;
  if (income > 18200) return (income - 18200) * 0.16;
  return 0;
}

function GetNetIncomeForYear(grossIncome: number, tax: number = 0): number {
  const totalTax = !tax ? GetTaxForYear(grossIncome) : tax;
  return grossIncome - totalTax;
}

/**
 * Calculates the week number from the start of the Australian Financial Year (July 1st).
 *
 * @param {Date} dateObj The Date object to calculate the week number for.
 * @returns {number} The week number (1-53) since the start of the financial year.
 */
function GetFinancialYearWeekNumber(dateObj: Date): number {
  // 1. Determine the Financial Year Start Date
  const year = dateObj.getFullYear();

  // The financial year starts on July 1st.
  // If the date is July 1st or later, the FY starts in the current year.
  // If the date is before July 1st (i.e., Jan 1st - June 30th), the FY started in the previous year.
  let fyStartYear = year;
  if (dateObj.getMonth() < 6) {
    // Month is 0-indexed (Jan=0, June=5)
    fyStartYear = year - 1;
  }

  // Create a Date object for the start of the Financial Year: July 1st at midnight.
  const fyStartDate = new Date(fyStartYear, 6, 1); // 6 is July (0-indexed)

  // 2. Calculate the difference in milliseconds
  // Get the time difference from the FY start date to the given date
  const timeDifferenceMs = dateObj.getTime() - fyStartDate.getTime();

  // 3. Convert the difference to full weeks
  const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;

  // Calculate the number of full weeks passed (using floor to count only full weeks)
  const weeksPassed = Math.floor(timeDifferenceMs / millisecondsPerWeek);

  // The week number is 1-indexed (Week 1 starts on July 1st).
  return weeksPassed + 1;
}

/**
 * Compile week of work hours data
 * @param date Date in the week to compile
 * @param sourceSheetName Name of the sheet in which to take the dat from
 * @returns rows of work hours
 */
function WorkHours(
  date: Date,
  sourceSheetName: string = "Work",
  headers: boolean = false
) {
  const SS = SpreadsheetApp.getActiveSpreadsheet();

  // ============= UTILS ==============
  const padNum = (num: number): string => (num < 10 ? `0${num}` : `${num}`);

  const createDateColumn = (date: Date): string => {
    return `${padNum(date.getDate())}/${padNum(
      date.getMonth() + 1
    )}/${date.getFullYear()}`;
  };
  const createTimeString = (timeString: string): string => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return `${padNum(date.getHours())}:${padNum(date.getMinutes())}`;
  };

  const createWorkRow = (row: any[]) => {
    const dayOfTheWeek = row[0].toLocaleString("en-US", { weekday: "short" });

    const startTime = createTimeString(row[2]);
    const endTime = createTimeString(row[3]);
    return [
      createDateColumn(row[0]),
      dayOfTheWeek,
      startTime,
      endTime,
      row[4],
      row[5],
      row[6],
      row[7],
    ];
  };
  // ============= DATA VALUES ==============
  let sourceSheet = SS.getSheetByName(sourceSheetName);
  if (!sourceSheet) throw new Error(`sheet: ${sourceSheetName} not found`);

  let sourceRange = sourceSheet.getDataRange();
  let dataValues = sourceRange.getValues();
  // Remove headers
  dataValues.shift();
  // ============= ============= ============

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

  // ============ Filter Values by Dates ==============
  const weekData = dataValues.filter((row) =>
    filterByDateRange(row, startWeek, endWeek, 0)
  );
  // ============= ============= ============

  // ============ Filter Values by Dates ==============
  const finalRows = weekData.map((row) => createWorkRow(row));
  return headers ? [...WorkHourHeaders(), ...finalRows] : [...finalRows];
  // ============= ============= ============
}

function GetYTD(sourceSheetName: string = "Work", headers: boolean = false) {
  // ============= DATA VALUES ==============
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  let sourceSheet = SS.getSheetByName(sourceSheetName);
  if (!sourceSheet) throw new Error(`sheet: ${sourceSheetName} not found`);

  let sourceRange = sourceSheet.getDataRange();
  let dataValues = sourceRange.getValues();
  // Remove headers
  dataValues.shift();
  // ============= ============= ============
  const grossIncome = dataValues.reduce(
    (prev, current) => prev + Number(current[6]),
    0
  );
  const weekNum = GetFinancialYearWeekNumber(new Date());
  const totalTax = GetTaxForYear((grossIncome / weekNum) * 52);
  const netIncome = GetNetIncomeForYear(grossIncome, totalTax);
  const estGrossIncome = (grossIncome / weekNum) * 52;
  const estNetIncome = estGrossIncome - totalTax;

  return [
    [
      `${Math.round(grossIncome)}`,
      `${Math.round(netIncome)}`,
      ``,
      `${Math.round(estGrossIncome)}`,
      `${Math.round(estNetIncome)}`,
      `${Math.round(totalTax)}`,
    ],
  ];
}
