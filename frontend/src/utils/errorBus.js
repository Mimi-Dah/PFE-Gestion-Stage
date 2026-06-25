/**
 * A simple event bus for global errors.
 * Used to communicate between the API interceptor and the UI.
 */
class ErrorBus {
  constructor() {
    this.listeners = [];
  }

  emit(error) {
    this.listeners.forEach(listener => listener(error));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const errorBus = new ErrorBus();
