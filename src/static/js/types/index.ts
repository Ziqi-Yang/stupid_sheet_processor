import * as XLSX from 'xlsx';
import State from '../lib/state.ts';

declare global {
  interface Window {
    XLSX: any,
    workbook: XLSX.WorkBook | null,
    res_workbook: XLSX.WorkBook | null,
    ssp_state: State | null, // stupid sheet processor state
  }
}

