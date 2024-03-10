export function debounce(func: Function, wait: number) {
  let timeout: number | undefined;

  return function executedFunction(...args: any) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = window.setTimeout(later, wait);
  };
}

export function generateElements(html: string) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.children;
}

