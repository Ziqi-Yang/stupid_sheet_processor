// predefined variables
// workbook: the sheet you upload through `Drop file here` area
// res_workbook: the workbook to be exported (you should copy the result workbook to this variable)
// XLSX: sheet.js object. See its documentation at https://docs.sheetjs.com/

// useful links:
// Common Spreadsheet Format: https://docs.sheetjs.com/docs/csf/

(function() {
    const { decode_range } = XLSX.utils;
    
    const ws = workbook.Sheets[window.workbook.SheetNames[0]];
    let data = ws["!data"];
    if (data == null) return;
    let raw_range = ws["!ref"];
    if (raw_range == null) return;
    let range = decode_range(raw_range);

    let row_s = range.s.r;  // let col_s = range.s.c;
    let row_e = range.e.r;  // let col_e = range.e.c;
    for (let row = row_s; row <= row_e; row ++) {
        let content = data[row]?.map(cell => cell.w?.trim()).join(", ");
        console.log(content);
    }

    res_workbook = workbook; // then click on `export` button
    // or you can use the following expression to directly download the result worksheet
    // XLSX.writeFile(window.res_workbook, "res_workbook.xlsx", { compression: true });
})();
