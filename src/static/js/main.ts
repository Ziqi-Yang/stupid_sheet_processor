import readFile from './lib/macros.ts' with {type: 'macro'};
import {debounce, generateElements, show_dialog, hide_dialog} from './lib/index.ts';
import State from './lib/state.ts';
import * as XLSX from 'xlsx';
import loader from '@monaco-editor/loader';
import { editor as EDITOR } from 'monaco-editor';

const XLSX_TYPE_DEFINITION = readFile("./node_modules/xlsx/types/index.d.ts");
const TEMPLATE = readFile("./src/static/js/templates.js");

let editor: EDITOR.IStandaloneCodeEditor;

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

function update_state_code() {
  const code = editor.getValue();
  if (window.ssp_state) {
    window.ssp_state.code = code;
    window.ssp_state.save_state();
  } else {
    console.error("Couldn't save state, since it is not initialized!");
  }
}

// sync editor content to cache (if too frequent (less than 1s), then do nothing)
const update_state_code_debounce = debounce(update_state_code, 1000);

async function initialize_editor() {
  let code = TEMPLATE;
  const state_code = window.ssp_state?.code;
  if (state_code && state_code != '') {
    code = state_code;
  }
  
  await loader.init().then(monaco => {
    editor = monaco.editor.create(document.querySelector("#editor")!, {
      value: code,
      language: 'javascript',
      minimap: { enabled: false },
    });

    // make a container for those functions
    const libSource = `
    declare module XLSX { ${XLSX_TYPE_DEFINITION} };
    let workbook: XLSX.WorkBook = XLSX.WorkBook;
    let res_workbook: XLSX.WorkBook = XLSX.WorkBook;`; 
    // var libSource = XLSX_TYPE_DEFINITION.replace(/export /g, ""); // directly expose functions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource);
    
    editor.onDidChangeModelContent(() => {
      update_state_code_debounce();
    });
  });
}

function render_preview_html_table() {
  const preview_table_container = document.getElementById('preview-table-container')!;
  // const { decode_range } = XLSX.utils;
  const decode_range = (...args: Parameters<typeof XLSX.utils.decode_range>) => XLSX.utils.decode_range(...args);
  const ws = window.workbook!.Sheets[window.workbook!.SheetNames[0]];
  const data = ws["!data"];
  if (data == null) return;
  const raw_range = ws["!ref"];
  if (raw_range == null) return;
  const range = decode_range(raw_range);
  
  const row_s = range.s.r;
  const row_e = range.e.r;
  for (let row = row_s; row <= row_e; row ++) {
    const content = data[row]?.map(cell => cell.w?.trim()).join(", ");
    preview_table_container.append(generateElements(`<p>${content}</p>`)[0]);
  }
}

function initailize_xlsx() {
  const drop_file_elem = document.getElementById("drop-file");
  const input_file_elem = document.getElementById("input-file");
  const indicator = document.getElementById("drop-file-indicator");

  async function handleDropAsync(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!e.dataTransfer) return;
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

  async function handleFileAsync(e: Event) {
    const file = (e.target as HTMLInputElement).files![0];
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

  drop_file_elem?.addEventListener("drop", e => {void handleDropAsync(e);});
  input_file_elem?.addEventListener("change", e => {void handleFileAsync(e);});
}

function toggle_sheet_preview() {
  const preview_panel_elm = document.getElementById("preview-panel")!;
  if (preview_panel_elm.classList.contains('hidden')) {
    preview_panel_elm.classList.remove('hidden')
  } else {
    preview_panel_elm.classList.add('hidden');
  }
}

function export_sheet() {
  if (!window.res_workbook) {
    show_dialog("Err", "res_workbook is empty!");
    return;
  }
  XLSX.writeFile(window.res_workbook, "res_workbook.xlsx", { compression: true });
}

function process() {
  const content = editor.getValue();
  eval(content)
}

async function share() {
  if (!window.ssp_state) {
    show_dialog("Error", "window.ssp_state is not set!");
  } else {
    update_state_code();
    const encoded_state = window.ssp_state.encode_pako();
    const url = `${window.location.origin}${window.location.pathname}?pako=${encoded_state}`;
    try {
      await navigator.clipboard.writeText(url);
      show_dialog("Copy Successfully", "The URL link is successfully copied to your clipboard!");
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
        show_dialog("Error", `${error.message}`);
      }
    }
  }
}

function reset() {
  window.ssp_state = new State();
  window.ssp_state.save_state();
  const url = `${window.location.origin}${window.location.pathname}`;
  window.open(url, '_self');
}

function bind_button_events() {
  const dialog_close_btn = document.getElementById("dialog-close-btn");
  dialog_close_btn?.addEventListener("click", hide_dialog);
  
  const execute_btn = document.getElementById("btn-execute");
  const preview_btn = document.getElementById("btn-preview");
  const preview_panel_close_preview_btn = document.getElementById("preview-panel-close-preview-button");
  const export_btn = document.getElementById("btn-export");
  const share_btn = document.getElementById("btn-share");
  const reset_btn = document.getElementById("btn-reset");

  
  execute_btn?.addEventListener("click", process);
  preview_btn?.addEventListener("click", toggle_sheet_preview);
  preview_panel_close_preview_btn?.addEventListener("click", toggle_sheet_preview);
  export_btn?.addEventListener("click", export_sheet);
  share_btn?.addEventListener("click", () => { void share(); });
  reset_btn?.addEventListener("click", reset);
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
    const state = State.retrieve_state();
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
    void initialize_editor();
    bind_button_events();
  });
})();


