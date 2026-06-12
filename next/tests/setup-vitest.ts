import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

interface EventSourceMockInstance {
  url: string;
  withCredentials: boolean;
  readyState: number;
  onopen: ((event: Event) => void) | null;
  onmessage: ((event: MessageEvent<string>) => void) | null;
  onerror: ((event: Event) => void) | null;
  dispatch: (type: string, event: Event) => void;
  close: () => void;
}

class EventSourceMock implements EventSourceMockInstance {
  static instances: EventSourceMock[] = [];
  url: string;
  withCredentials = false;
  readyState = 0;
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private listeners = new Map<string, Set<EventListener>>();

  constructor(url: string, options?: { withCredentials?: boolean }) {
    this.url = url;
    this.withCredentials = options?.withCredentials ?? false;
    // Always go through the global registry so tests can find us
    // even when vitest re-evaluates the class module between files.
    const registry = (globalThis as { __eventSourceMockInstances?: EventSourceMock[] }).__eventSourceMockInstances;
    if (registry) registry.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(listener);
  }

  removeEventListener(type: string, listener: EventListener) {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch = (type: string, event: Event) => {
    this.listeners.get(type)?.forEach((listener) => listener(event));
  };

  close = () => {
    this.readyState = 2;
    const registry = (globalThis as { __eventSourceMockInstances?: EventSourceMock[] }).__eventSourceMockInstances;
    if (registry) {
      const index = registry.indexOf(this);
      if (index !== -1) registry.splice(index, 1);
    }
  };
}

declare global {
  var __eventSourceMockInstances: EventSourceMock[];
}

globalThis.__eventSourceMockInstances ??= [];

vi.stubGlobal("ResizeObserver", ResizeObserverMock);
vi.stubGlobal("EventSource", EventSourceMock);
vi.stubGlobal("scrollTo", vi.fn());
