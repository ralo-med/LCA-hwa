import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '@/constants/site';

const Footer = () => (
  <footer className="no-print border-t pb-20 pt-10 text-center text-xs text-muted-foreground">
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
        to="/guides"
        className="transition-colors hover:text-foreground"
      >
        가이드라인 PDF
      </Link>
      <Link
        to="/contact"
        className="transition-colors hover:text-foreground"
      >
        문의·제보
      </Link>
    </nav>
    <p>© 2026 화순전남대학교병원 폐암 정밀의료 플랫폼</p>
    <p className="mt-1">
      본 서비스는 AI 기반 보조 정보를 제공하며, 진료·치료 결정은 담당
      전문의의 판단을 우선합니다.
    </p>
    <p className="mt-2 text-pretty">
      플랫폼 오류, 콘텐츠 관련 문의 및 개선 제안은{' '}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
      >
        {CONTACT_EMAIL}
      </a>
      로 제출해 주시기 바랍니다.
    </p>
  </footer>
);

export default Footer;
