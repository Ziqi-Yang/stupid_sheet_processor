import * as XLSX from 'xlsx';

declare global {
  interface Window {
    XLSX: XLSX,
    workbook: XLSX.WorkBook
  }
}
