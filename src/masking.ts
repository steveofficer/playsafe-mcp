import { Page } from 'playwright';

/**
 * Checks whether the given target selector matches any masked selector on the page.
 * Throws an error if the target resolves to a masked element.
 */
export async function assertNotMasked(
  page: Page,
  targetSelector: string,
  maskedSelectors: string[]
): Promise<void> {
  if (maskedSelectors.length === 0) return;

  const isMasked = await page.evaluate(
    ({ target, masked }: { target: string; masked: string[] }) => {
      let targetEl: Element | null = null;
      try {
        targetEl = document.querySelector(target);
      } catch {
        // invalid selector — let Playwright handle the error
        return false;
      }
      if (!targetEl) return false;
      for (const sel of masked) {
        try {
          if (targetEl.matches(sel)) return true;
          // also check if the target is a descendant of a masked element
          if (targetEl.closest(sel) !== null) return true;
        } catch {
          // ignore invalid masked selectors
        }
      }
      return false;
    },
    { target: targetSelector, masked: maskedSelectors }
  );

  if (isMasked) {
    throw new Error(
      `Interaction blocked: the element matching "${targetSelector}" is masked for safety.`
    );
  }
}

/**
 * Injects a <style> tag that hides all masked elements.
 * Returns a cleanup function that removes the injected style.
 */
export async function hideMaskedElements(
  page: Page,
  maskedSelectors: string[]
): Promise<() => Promise<void>> {
  if (maskedSelectors.length === 0) {
    return async () => {};
  }

  const styleId = `playsafe-mask-${Date.now()}`;
  const css = maskedSelectors
    .map((sel) => `${sel} { visibility: hidden !important; pointer-events: none !important; }`)
    .join('\n');

  await page.addStyleTag({ content: css, id: styleId } as Parameters<Page['addStyleTag']>[0]);

  return async () => {
    await page
      .evaluate((id: string) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      }, styleId)
      .catch(() => {});
  };
}

/**
 * Returns a sanitised HTML string with masked elements removed.
 */
export async function getFilteredContent(
  page: Page,
  maskedSelectors: string[]
): Promise<string> {
  if (maskedSelectors.length === 0) {
    return page.content();
  }

  return page.evaluate((masked: string[]) => {
    // Work on a deep clone so the live DOM is not mutated
    const clone = document.documentElement.cloneNode(true) as HTMLElement;
    for (const sel of masked) {
      try {
        clone.querySelectorAll(sel).forEach((el) => el.remove());
      } catch {
        // ignore invalid selectors
      }
    }
    return clone.outerHTML;
  }, maskedSelectors);
}
