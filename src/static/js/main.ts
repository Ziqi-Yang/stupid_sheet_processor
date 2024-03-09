import readFile from './lib/macros.ts' with {type: 'macro'};
import {debounce} from './lib/index.ts';
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

async function initailize_xlsx() {
  let drop_file_elem = document.getElementById("drop_file");
  let input_file_elem = document.getElementById("input_file");

  async function handleDropAsync(e: any) {
    e.stopPropagation();
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    const data = await f.arrayBuffer();
    window.workbook = XLSX.read(data, { dense: true });
  }

  async function handleFileAsync(e: any) {
    const file = e.target.files[0];
    const data = await file.arrayBuffer();
    window.workbook = XLSX.read(data, { dense: true });
  }

  drop_file_elem?.addEventListener("drop", handleDropAsync);
  input_file_elem?.addEventListener("change", handleFileAsync);
}

function process() {
  let content = editor.getValue();
  eval(content)
}

async function bind_button_events() {
  let execute_btn = document.getElementById("btn-execute");
  execute_btn?.addEventListener("click", process);
}

(function() {
  ready(() => {
    window.XLSX = XLSX;
    
    initailize_xlsx();
    initialize_editor();
    bind_button_events();
  });
})();


