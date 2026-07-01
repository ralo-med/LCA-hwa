export const CONTACT_EMAIL = 'ralomedi@gmail.com';

export const DOCTORS_URL =
  'https://www.cnuhh.com/medical/info/dept.cs?act=view&mode=doctorList&deptCd=IMP';

export interface Hotline {
  name: string;
  tel: string;
  note: string;
}

export const SUPPORT_HOTLINES: Hotline[] = [
  { name: '국립암센터 암정보상담', tel: '1577-8899', note: '치료·생활 상담' },
  { name: '정신건강 상담전화', tel: '1577-0199', note: '마음 돌봄 상담' },
];
