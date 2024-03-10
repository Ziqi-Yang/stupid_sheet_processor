(function() {
    const { decode_range } = XLSX.utils;
    
    const ws = workbook.Sheets[window.workbook.SheetNames[0]];
    let data = ws["!data"];
    if (data == null) return;
    let raw_range = ws["!ref"];
    if (raw_range == null) return;
    let range = decode_range(raw_range);

    let row_s = range.s.r;  let col_s = range.s.c;
    let row_e = range.e.r;  let col_e = range.e.c;
    for (let row = row_s; row <= row_e; row ++) {
        let content = data[row]?.map(cell => cell.w?.trim()).join(", ");
        console.log(content);
    }
})();
