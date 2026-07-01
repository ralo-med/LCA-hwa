import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="no-print mt-16 border-t pb-20 pt-8 text-center text-xs text-muted-foreground">
    <nav
      className="mb-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      aria-label="하단 링크"
    >
      <Link
        to="/about"
        className="transition-colors hover:text-foreground"
      >
        서비스 소개
      </Link>
      <Link
        to="/contact"
        className="transition-colors hover:text-foreground"
      >
        문의·제보
      </Link>
      <Link
        to="/guides"
        className="transition-colors hover:text-foreground"
      >
        가이드라인 PDF
      </Link>
    </nav>
    <p>© 2026 화순전남대학교병원 폐암 정밀의료 플랫폼</p>
    <p className="mt-1">
      AI 보조 정보이며, 실제 진료 계획은 전문의 소견을 따릅니다.
    </p>
  </footer>
);

export default Footer;
