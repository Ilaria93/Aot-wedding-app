import type { ScrollView } from 'react-native';

type ScrollableHost = ScrollView | HTMLElement | null | undefined;

function isScrollableOverflow(overflowY: string): boolean {
  return overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
}

function canScrollVertically(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (!isScrollableOverflow(style.overflowY)) {
    return false;
  }

  return element.scrollHeight > element.clientHeight + 1;
}

function findScrollableDescendant(root: HTMLElement): HTMLElement | undefined {
  const queue: HTMLElement[] = [root];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (canScrollVertically(current)) {
      return current;
    }

    for (const child of Array.from(current.children)) {
      if (child instanceof HTMLElement) {
        queue.push(child);
      }
    }
  }

  return undefined;
}

function resolveScrollableNode(node: HTMLElement): HTMLElement {
  if (canScrollVertically(node)) {
    return node;
  }

  const descendant = findScrollableDescendant(node);
  if (descendant) {
    return descendant;
  }

  let current: HTMLElement | null = node.parentElement;

  while (current) {
    if (canScrollVertically(current)) {
      return current;
    }
    current = current.parentElement;
  }

  if (canScrollVertically(document.documentElement)) {
    return document.documentElement;
  }

  return node;
}

/**
 * Resolves a ScrollView ref (or raw HTMLElement) to the DOM node GSAP should scroll.
 */
export function getScrollableElement(host: ScrollableHost): HTMLElement | undefined {
  if (!host) {
    return undefined;
  }

  if (host instanceof HTMLElement) {
    return resolveScrollableNode(host);
  }

  const scrollView = host as ScrollView & {
    getScrollableNode?: () => HTMLElement;
    getInnerViewNode?: () => HTMLElement;
  };

  const candidate =
    scrollView.getScrollableNode?.() ??
    scrollView.getInnerViewNode?.() ??
    (scrollView as unknown as { _component?: HTMLElement })._component;

  if (!(candidate instanceof HTMLElement)) {
    return undefined;
  }

  return resolveScrollableNode(candidate);
}

/** Reads vertical scroll offset from a scroll container or the window. */
export function readScrollOffset(scroller: HTMLElement | Window): number {
  if (scroller instanceof Window) {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  return scroller.scrollTop;
}
