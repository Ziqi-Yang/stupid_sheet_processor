import readFile from './lib/macros.ts' with {type: 'macro'};
import {debounce, generateElements} from './lib/index.ts';
import State from './lib/state.ts';
import * as XLSX from 'xlsx';
import loader, {type Monaco} from '@monaco-editor/loader';
import { editor as EDITOR } from 'monaco-editor';

const XLSX_TYPE_DEFINITION = readFile("./node_modules/xlsx/types/index.d.ts");
const TEMPLATE = readFile("./src/static/js/templates.js");
const CACHE_KEY_EDITOR_CONTENT = "EDITOR_CONTENT";

var editor: EDITOR.IStandaloneCodeEditor;

function ready(fn: () => void) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function getPakoStringFromURL(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('pako');
}

// sync editor content to cache (if too frequent (less than 1s), then do nothing)
const update_state_code = debounce(() => {
  let code = editor.getValue();
  if (window.ssp_state) {
    window.ssp_state.code = code;
    window.ssp_state.save_state();
  } else {
    console.error("Couldn't save state, since it is not initialized!");
  }
}, 1000);

async function initialize_editor() {
  let code = TEMPLATE;
  let url_code = window.ssp_state?.code;
  if (url_code && url_code != '') {
    code = url_code;
  } else {
    let cached_code = localStorage.getItem(CACHE_KEY_EDITOR_CONTENT);
    if (cached_code && cached_code != '') code = cached_code;
  }
  
  loader.init().then(monaco => {
    editor = monaco.editor.create(document.querySelector("#editor")!, {
      value: code,
      language: 'javascript',
      minimap: { enabled: false },
    });

    // make a container for those functions
    var libSource = `
    declare module XLSX { ${XLSX_TYPE_DEFINITION} };
    let workbook: XLSX.WorkBook = XLSX.WorkBook;
    let res_workbook: XLSX.WorkBook = XLSX.WorkBook;`; 
    // var libSource = XLSX_TYPE_DEFINITION.replace(/export /g, ""); // directly expose functions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource);
    
    editor.onDidChangeModelContent(_e => {
      update_state_code();
    });
  });
}

async function render_preview_html_table() {
  let preview_table_container = document.getElementById('preview-table-container')!;
  const { decode_range } = XLSX.utils;
  const ws = window.workbook!.Sheets[window.workbook!.SheetNames[0]];
  let data = ws["!data"];
  if (data == null) return;
  let raw_range = ws["!ref"];
  if (raw_range == null) return;
  let range = decode_range(raw_range);
  
  let row_s = range.s.r;  let col_s = range.s.c;
  let row_e = range.e.r;  let col_e = range.e.c;
  for (let row = row_s; row <= row_e; row ++) {
    let content = data[row]?.map(cell => cell.w?.trim()).join(", ");
    preview_table_container.append(generateElements(`<p>${content}</p>`)[0]);
  }
}

async function initailize_xlsx() {
  let drop_file_elem = document.getElementById("drop-file");
  let input_file_elem = document.getElementById("input-file");
  let indicator = document.getElementById("drop-file-indicator");

  async function handleDropAsync(e: any) {
    e.stopPropagation();
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    const data = await file.arrayBuffer();
    try {
      window.workbook = XLSX.read(data, { dense: true });
      indicator!.textContent = `Successfully load '${file.name}'`;
    } catch (_: unknown) {
      console.error(`Load '${file.name}' ERROR!`);
      indicator!.textContent = `Load '${file.name}' ERROR!`;
    }
    render_preview_html_table();
  }

  async function handleFileAsync(e: any) {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    try {
      window.workbook = XLSX.read(data, { dense: true });
      indicator!.textContent = `Successfully load '${file.name}'`;
    } catch (_: unknown) {
      console.error(`Load '${file.name}' ERROR!`);
      indicator!.textContent = `Load '${file.name}' ERROR!`;
    }
    render_preview_html_table();
  }

  drop_file_elem?.addEventListener("drop", handleDropAsync);
  input_file_elem?.addEventListener("change", handleFileAsync);
}

function toggle_sheet_preview() {
  let preview_panel_elm = document.getElementById("preview-panel")!;
  if (preview_panel_elm.classList.contains('hidden')) {
    preview_panel_elm.classList.remove('hidden')
  } else {
    preview_panel_elm.classList.add('hidden');
  }
}

function export_sheet() {
  if (!window.res_workbook) return;
  XLSX.writeFile(window.res_workbook, "res_workbook.xlsx", { compression: true });
}

function process() {
  let content = editor.getValue();
  eval(content)
}

async function bind_button_events() {
  let execute_btn = document.getElementById("btn-execute");
  let preview_btn = document.getElementById("btn-preview");
  let preview_panel_close_preview_btn = document.getElementById("preview-panel-close-preview-button");
  let export_btn = document.getElementById("btn-export");
  execute_btn?.addEventListener("click", process);
  preview_btn?.addEventListener("click", toggle_sheet_preview);
  preview_panel_close_preview_btn?.addEventListener("click", toggle_sheet_preview);
  export_btn?.addEventListener("click", export_sheet);
}

/**
 * restore state from url or local storage
 * if no state is found, then create a brand new state.
 */
function restore_state() {
  const raw_state = getPakoStringFromURL();
  if (raw_state) {
    window.ssp_state = State.decode_pako(raw_state);
  } else {
    let state = State.retrieve_state();
    if (state) {
      window.ssp_state = state;
    } else {
      window.ssp_state = new State("");
    }
  }
}

(function() {
  ready(() => {
    window.ssp_state = null;
    window.workbook = null;
    window.res_workbook = null;
    window.XLSX = XLSX;
    
    restore_state();
    initailize_xlsx();
    initialize_editor();
    bind_button_events();
  });
})();


