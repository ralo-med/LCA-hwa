import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  Cloud,
  History,
  ListPlus,
  LogIn,
  MessageCircle,
  UserRound,
  Volume2,
} from 'lucide-react';

export type PatientToolStatus = 'available' | 'coming-soon';

export interface PatientTool {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  status: PatientToolStatus;
  to?: string;
  href?: string;
}

/**
 * 환자·보호자용 확장 기능 목록.
 * 구현 후 status를 'available'로 바꾸고 to/href를 연결하면 됩니다.
 */
export const PATIENT_TOOLS: PatientTool[] = [
  {
    id: 'login',
    icon: LogIn,
    title: '로그인 · 회원가입',
    description:
      '휴대폰 번호나 이메일로 로그인해, 이 기기가 아니어도 내 기록을 이어서 볼 수 있어요.',
    status: 'coming-soon',
  },
  {
    id: 'my-info',
    icon: UserRound,
    title: '내 정보 기록',
    description:
      '나이, 병기, 치료 이력, 메모 등 나에게 맞는 정보를 저장해 두고 챗봇·대시보드에 반영해요.',
    status: 'coming-soon',
  },
  {
    id: 'tts',
    icon: Volume2,
    title: '답변 음성 듣기 (TTS)',
    description:
      '챗봇 답변이나 안내 글을 소리로 들을 수 있어요. 글 읽기가 힘들 때 도움이 됩니다.',
    status: 'coming-soon',
  },
  {
    id: 'kakao-share',
    icon: MessageCircle,
    title: '카카오톡으로 보내기',
    description:
      '챗봇 답변, 생존 분석 요약, 안내 내용을 카카오톡으로 바로 보내 가족과 나눌 수 있어요.',
    status: 'coming-soon',
  },
  {
    id: 'chat-history',
    icon: History,
    title: '대화 · 기록 보관',
    description:
      '챗봇 대화와 저장한 정보를 날짜별로 모아 두었다가, 나중에 다시 확인할 수 있어요.',
    status: 'coming-soon',
  },
  {
    id: 'cloud-sync',
    icon: Cloud,
    title: '기기 간 동기화',
    description:
      '집 태블릿, 병원에서 쓰는 폰 등 다른 기기에서도 같은 내 정보와 기록을 불러올 수 있어요.',
    status: 'coming-soon',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: '알림 · 리마인더',
    description:
      '복약 시간, 외래 일정, 검사 전 안내 등 필요한 알림을 받을 수 있어요.',
    status: 'coming-soon',
  },
];

export const PATIENT_TOOLS_INTRO = {
  eyebrow: '안내',
  title: '추가 예정 기능',
  subtitle:
    '환자·보호자 편의를 위해 준비 중인 기능입니다. 순차적으로 제공될 예정입니다.',
  icon: ListPlus,
} as const;

export const PATIENT_TOOLS_PRICING_NOTE = {
  title: '기능 제공 안내',
  body:
    '현재 환자 안내 챗봇, 생존 분석, 가이드라인 PDF는 모두 무료로 이용하실 수 있습니다. 챗봇 답변과 가이드라인 검색에 쓰이는 AI 이용료는 개발자가 자체 부담하고 있습니다. 아래 추가 예정 기능은 서버·AI·음성(TTS) 등 운영 비용이 함께 발생하므로, 도입이 된다면 지금과 같은 조건으로만 제공하기 어려울수도 있습니다.',
} as const;
