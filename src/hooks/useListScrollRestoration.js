import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { listPathKey, rememberListPosition, restoreListPosition } from '@/lib/listNavigation';

/** Restore scroll / focused card when coming back to a list page. */
export function useListScrollRestoration(ready = true) {
  const location = useLocation();
  const pathKey = listPathKey(location.pathname, location.search);
  const restored = useRef(false);

  useLayoutEffect(() => {
    restored.current = false;
  }, [pathKey]);

  useLayoutEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    restoreListPosition(pathKey);
  }, [ready, pathKey]);

  useEffect(() => {
    return () => {
      rememberListPosition();
    };
  }, [pathKey]);
}
