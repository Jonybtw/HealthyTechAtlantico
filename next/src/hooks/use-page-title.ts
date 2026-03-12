import { useEffect } from "react";

/** Sets document.title with the HTA template pattern for client pages. */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · HTA`;
  }, [title]);
}
