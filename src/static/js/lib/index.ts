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


