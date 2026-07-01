import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/** 라우트 변경 시 짧은 fade·slide 등장 + 스크롤 맨 위 */
export function PageTransitionLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div
      key={pathname}
      className="animate-page-in flex min-h-0 flex-1 flex-col"
    >
      <Outlet />
    </div>
  );
}
