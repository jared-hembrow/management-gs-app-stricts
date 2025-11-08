interface IDates {
  today: Date;
  startPrevWeek: Date;
  endPrevWeek: Date;
  startCurrentWeek: Date;
  endCurrentWeek: Date;
}

function buildDashboard() {
  // ========== SETUP ==========
  //   Constants
  const SS = SpreadsheetApp.getActiveSpreadsheet();
  const TARGET_SHEET_NAME = "Dashboard";
  // WORK
  const workSourceSheetName = "Work";
  const budgetSourceSheetName = "Budget";
  const finalColumnCount = 9;

  let targetSheet = SS.getSheetByName(TARGET_SHEET_NAME);
  // Handle Target Sheet creation/cleanup
  if (targetSheet) {
    targetSheet.clear(); // Clear existing content for fresh report
  } else {
    targetSheet = SS.insertSheet(TARGET_SHEET_NAME);
  }

  // ========== Dates ==========
  const dates: IDates = getDates();
  console.log("Dates:", dates);

  // ========== BUDGET ==========
  let budgetSourceSheet = SS.getSheetByName(budgetSourceSheetName);
  if (!budgetSourceSheet)
    throw new Error(`sheet: ${budgetSourceSheetName} not found`);

  let budgetSourceRange = budgetSourceSheet.getDataRange();
  let budgetSourceRangeValues = budgetSourceRange.getValues();
  // Remove headers
  budgetSourceRangeValues.shift();
  const compileBudgetItems = (dataRows: any[][]) => {
    const intervalCol = 8;

    const newRows: any[][] = [];
    const YearlyItems = dataRows.filter((row) => {
      if (row.length < 9 || !row[intervalCol]) return false;
      if (row[intervalCol] === "Yearly") return true;
    });
    const monthlyItems = dataRows.filter((row) => {
      if (row.length < 9 || !row[intervalCol]) return false;
      if (row[intervalCol] === "Monthly") return true;
    });
    const quarterlyItems = dataRows.filter((row) => {
      if (row.length < 9 || !row[intervalCol]) return false;
      if (row[intervalCol] === "Quarterly") return true;
    });
    const weeklyItems = dataRows.filter((row) => {
      if (row.length < 9 || !row[intervalCol]) return false;
      if (row[intervalCol] === "Weekly199") return true;
    });
  };

  // ========== WORK DATA ==========
  let workSourceSheet = SS.getSheetByName(workSourceSheetName);
  if (!workSourceSheet)
    throw new Error(`sheet: ${workSourceSheetName} not found`);

  let workSourceRange = workSourceSheet.getDataRange();
  let workSourceRangeValues = workSourceRange.getValues();

  let { workRows, totalGrossIncome } = workData(workSourceRangeValues, dates);

  // Remove headers
  workSourceRangeValues.shift();

  const newRows = [...workRows].map((row) => {
    const newRow = [...row];
    while (newRow.length < finalColumnCount) {
      newRow.push("");
    }
    return newRow;
  });

  let targetRange = targetSheet.getRange(
    1,
    1,
    newRows.length,
    finalColumnCount
  );

  targetRange.setValues(newRows);
}

function workData(
  data: any[][],
  dates: IDates
): { workRows: any[]; totalGrossIncome: number } {
  const workWeekHeaders = [
    "Date",
    "Day",
    "Start",
    "End",
    "Hours",
    "Rate",
    "Income",
    "Job",
  ];
  const workWeekOverviewHeaders = [
    "Pay Rate",
    "Hours",
    "Gross Income",
    "Tax",
    "Net Icome",
  ];

  // Create Work OverView
  const totalGrossIncome = data.reduce((prev, current) => prev + current[6], 0);

  const dateColumnIndex = 0;

  // Filter two weeks
  const filteredData = data.filter((row) =>
    filterByDateRange(
      data,
      dates.startPrevWeek,
      dates.endCurrentWeek,
      dateColumnIndex
    )
  );
  const getTaxFromWeek = (weeklyIncome: number): number => {
    let estYearIncome = weeklyIncome * 52;
    if (estYearIncome > 45000) return (estYearIncome - 45000) * 0.3 + 4288;
    if (estYearIncome > 18200) return (estYearIncome - 18200) * 0.16;
    return 0;
  };

  const createWorkWeekOverview = (rows: any[][]) => {
    let totalHours = 0;
    let grossIncome = 0;
    let payRate = 0;
    rows.forEach((row) => {
      totalHours += Number(row[4]);
      grossIncome += Number(row[6]);
      if (row[5] > 0) payRate = row[5];
    });
    let tax = getTaxFromWeek(grossIncome);
    let netIncome = grossIncome - tax / 52;
    return [
      payRate,
      totalHours,
      `=ROUNDUP(${grossIncome},2)`,
      `=ROUNDUP(${tax / 52},2)`,
      `=ROUNDUP(${netIncome}, 2)`,
    ];
  };

  const createDateColumn = (date: Date): string => {
    return `=DATE(${date.getFullYear()}, ${
      date.getMonth() + 1
    }, ${date.getDate()})`;
  };

  const createTimeString = (timeString: string): string => {
    if (!timeString) return "";
    const date = new Date(timeString);
    return `${date.getHours()}:${date.getMinutes()}`;
  };

  const createWorkRow = (row: any[]) => {
    const dayOfTheWeek = `=TEXT("${row[0].getDate()}/${
      row[0].getMonth() + 1
    }/${row[0].getFullYear()}", "ddd")`;

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
    ];
  };

  // Create current Week View
  const currentWeekData = filteredData.filter((row) =>
    filterByDateRange(
      row,
      dates.startCurrentWeek,
      dates.endCurrentWeek,
      dateColumnIndex
    )
  );
  const currentWeekOverView = createWorkWeekOverview(currentWeekData);

  // Create Prev Week View
  const prevWeekData = filteredData.filter((row) =>
    filterByDateRange(
      row,
      dates.startPrevWeek,
      dates.endPrevWeek,
      dateColumnIndex
    )
  );
  const prevWeekOverView = createWorkWeekOverview(prevWeekData);

  const workRows: any[][] = [
    // ========== WORK WEEK ROWS ==========
    [...workWeekOverviewHeaders],
    currentWeekOverView,
    [...workWeekHeaders],
    ...currentWeekData.map((r) => createWorkRow(r)),
    [...workWeekOverviewHeaders],
    prevWeekOverView,
    [...workWeekHeaders],
    ...prevWeekData.map((r) => createWorkRow(r)),
  ];

  return { workRows, totalGrossIncome };
}

function getDates(): IDates {
  const today = new Date();

  // JavaScript's getDay() returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday.
  const currentDayOfWeek = today.getDay();

  // Calculate the number of days to subtract to get to the *Current Week's* **Monday**.
  // If today is Monday (1), subtract 0. If Tuesday (2), subtract 1, etc.
  // If today is Sunday (0), we need to go back 6 days to get to the preceding Monday.
  const daysToSubtractToCurrentMonday =
    currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;

  // --- Calculate Current Week ---

  const startCurrentWeek = new Date(today);
  startCurrentWeek.setDate(today.getDate() - daysToSubtractToCurrentMonday);
  // Set time to the start of the day (00:00:00)
  startCurrentWeek.setHours(0, 0, 0, 0);

  const endCurrentWeek = new Date(startCurrentWeek);
  // Current week ends 6 days after the start (Monday + 6 days = Sunday)
  endCurrentWeek.setDate(startCurrentWeek.getDate() + 6);
  // Set time to the end of the day (23:59:59.999) for the Sunday boundary
  endCurrentWeek.setHours(23, 59, 59, 999);

  // --- Calculate Previous Week ---

  const endPrevWeek = new Date(startCurrentWeek);
  // Previous week ends one day before the current week starts (Sunday)
  endPrevWeek.setDate(startCurrentWeek.getDate() - 1);
  endPrevWeek.setHours(23, 59, 59, 999); // Set time to end of day

  const startPrevWeek = new Date(endPrevWeek);
  // Previous week starts 6 days before it ends (Sunday - 6 days = Monday)
  startPrevWeek.setDate(endPrevWeek.getDate() - 6);
  startPrevWeek.setHours(0, 0, 0, 0); // Set time to start of day

  return {
    today,
    startPrevWeek,
    endPrevWeek,
    startCurrentWeek,
    endCurrentWeek,
  };
}

const filterByDateRange = (
  row: any[],
  start: Date,
  end: Date,
  dateColumnIndex: number
) => {
  const cellDateValue = row[dateColumnIndex];
  if (cellDateValue instanceof Date) {
    console.log("Is istance of date");
    // Normalize the row date to midnight for comparison against startDate
    const rowDate = new Date(cellDateValue);
    const rowTs = rowDate.getTime();
    const startTs = start.getTime();
    const endTs = end.getTime();
    // rowDate.setHours(1, 0, 0, 0);

    const afterEnd = rowTs >= startTs;
    const beforeStart = rowTs <= endTs;

    // Check if the date is greater than or equal to the start date AND
    // less than or equal to the end date.
    return afterEnd && beforeStart;
  }
  return false;
};
