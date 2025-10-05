export function isDarkMode(): boolean {
    const element = document.querySelector('html');
    return element?.classList.contains('my-app-dark') || false;
  }