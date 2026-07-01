import { Link } from 'react-router-dom';
import { CONTACT_EMAIL } from '@/constants/site';

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
        문의하기
      </Link>
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="transition-colors hover:text-foreground"
      >
        {CONTACT_EMAIL}
      </a>
    </nav>
    <p className="font-semibold">
      © 2026 화순전남대학교병원 폐암 정밀의료 플랫폼 | 환자 맞춤형 항암 교육 대시보드
    </p>
    <p className="mt-1">
      모든 분석 및 가이드 결과는 AI 정밀의료 보조 정보이며 실제 진료 계획은 전문의의 소견을 우선합니다.
    </p>
  </footer>
);

export default Footer;
