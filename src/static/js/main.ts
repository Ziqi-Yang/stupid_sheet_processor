import readFile from './lib/macros.ts' with {type: 'macro'};
import {debounce, generateElements} from './lib/index.ts';
import * as XLSX from 'xlsx';
import loader, {type Monaco} from '@monaco-editor/loader';
import { editor as EDITOR } from 'monaco-editor';

const XLSX_TYPE_DEFINITION = readFile("./node_modules/xlsx/types/index.d.ts");
const CACHE_FILE_NAME = "EDITOR_CONTENT";

var editor: EDITOR.IStandaloneCodeEditor;

function ready(fn: () => void) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// sync editor content to cache (if too frequent (less than 1s), then do nothing)
const debounced_update_local_storage = debounce(() => {
  let content = editor.getValue();
  localStorage.setItem(CACHE_FILE_NAME, content);
}, 1000);

async function initialize_editor() {
  loader.init().then(monaco => {
    let cached_content = localStorage.getItem(CACHE_FILE_NAME);
    editor = monaco.editor.create(document.querySelector("#editor")!, {
      value: cached_content || '',
      language: 'javascript',
      minimap: { enabled: false },
    });

    // make a container for those functions
    var libSource = `
    declare module XLSX { ${XLSX_TYPE_DEFINITION} };
    let workbook = XLSX.WorkBook;`; 
    // var libSource = XLSX_TYPE_DEFINITION.replace(/export /g, ""); // directly expose functions
    monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource);

    
    editor.onDidChangeModelContent(_e => {
      debounced_update_local_storage();
    });
  });
}

function render_preview_html_table() {
  let preview_table_container = document.getElementById('preview-table-container')!;
  const ws = window.workbook.Sheets[window.workbook.SheetNames[0]];
  let data = ws["!data"];
  if (data == null) return;
  const { decode_range } = XLSX.utils;
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

function process() {
  let content = editor.getValue();
  eval(content)
}

async function bind_button_events() {
  let execute_btn = document.getElementById("btn-execute");
  let preview_btn = document.getElementById("btn-preview");
  let preview_panel_close_preview_button = document.getElementById("preview-panel-close-preview-button");
  execute_btn?.addEventListener("click", process);
  preview_btn?.addEventListener("click", toggle_sheet_preview);
  preview_panel_close_preview_button?.addEventListener("click", toggle_sheet_preview);
}

(function() {
  ready(() => {
    window.XLSX = XLSX;
    
    initailize_xlsx();
    initialize_editor();
    bind_button_events();
  });
})();


