export function debounce(func: () => void, wait: number) {
  let timeout_id: number | undefined;

  return function executedFunction() {
    const later = () => {
      clearTimeout(timeout_id);
      func();
    };

    clearTimeout(timeout_id);
    timeout_id = window.setTimeout(later, wait);
  };
}

export function generateElements(html: string): HTMLCollection {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.children;
}

export function show_dialog(title: string, content: string) {
  const dialog_elem = document.getElementById("dialog");
  if (!dialog_elem) return;
  const dialog_title_elem = document.getElementById("dialog-title");
  const dialog_content_elem = document.getElementById("dialog-content");
  if (dialog_title_elem) {
    dialog_title_elem.textContent = title;
  }
  if (dialog_content_elem) {
    dialog_content_elem.textContent = content;
  }
  dialog_elem.classList.add("modal-open");
}

export function hide_dialog() {
  const dialog_elem = document.getElementById("dialog");
  if (!dialog_elem) return;
  dialog_elem.classList.remove("modal-open");
}





