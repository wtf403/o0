declare module 'bindings' {
  function bindings(path: string): any;
  export = bindings;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

declare module 'window_tracker' {
  export class WindowTracker {
    getChromeWindowBounds(): WindowBounds | null;
  }
} 