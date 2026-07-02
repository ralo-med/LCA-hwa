import { describe, expect, it } from 'vitest';
import {
  filterRelevantCitations,
  isDrugCatalogOrMonographText,
  isDrugMonographText,
  isGeneralSideEffectManagementQuery,
  isTreatmentProgramText,
  queryMentionsSpecificDrug,
} from './rag';

describe('isGeneralSideEffectManagementQuery', () => {
  it('넓은 부작용 관리 질문을 인식한다', () => {
    expect(
      isGeneralSideEffectManagementQuery(
        '항암치료 부작용은 어떻게 관리하나요?',
      ),
    ).toBe(true);
    expect(
      isGeneralSideEffectManagementQuery('항암 부작용 관리법 알려줘'),
    ).toBe(true);
  });

  it('특정 약제가 포함되면 일반 질문으로 보지 않는다', () => {
    expect(
      isGeneralSideEffectManagementQuery(
        '이리노테칸 부작용은 어떻게 관리하나요?',
      ),
    ).toBe(false);
  });
});

describe('queryMentionsSpecificDrug', () => {
  it('약제명을 감지한다', () => {
    expect(queryMentionsSpecificDrug('이리노테칸 설사')).toBe(true);
    expect(queryMentionsSpecificDrug('항암 부작용')).toBe(false);
  });
});

describe('isDrugMonographText', () => {
  it('약제 Q&A 형식을 감지한다', () => {
    expect(
      isDrugMonographText('Q 100\n이리노테칸은 어떤 약제인가요?\nA\n...'),
    ).toBe(true);
    expect(
      isDrugMonographText(
        'Q 109\n항암화학치료 후 일반적 주의사항은 무엇인가요?',
      ),
    ).toBe(false);
  });
});

describe('isDrugCatalogOrMonographText', () => {
  it('약제 종류 나열 Q&A도 감지한다', () => {
    expect(
      isDrugCatalogOrMonographText(
        'Q 95\n폐암에 사용되는 항암화학치료제의 종류는 무엇인가요? 세포독성 항암제...',
      ),
    ).toBe(true);
  });
});

describe('isTreatmentProgramText', () => {
  it('치료 시행·유지요법 Q&A를 감지한다', () => {
    expect(
      isTreatmentProgramText(
        'Q 93 어떤 환자가 항암화학치료를 받게 되는지요? 독성이 항암 효과보다 미미하다고 판단될 때 시행합니다.',
      ),
    ).toBe(true);
    expect(
      isTreatmentProgramText(
        'Q 109 항암화학치료 후 일반적 주의사항은 무엇인가요? 오심, 구토, 설사, 감염',
      ),
    ).toBe(false);
  });
});

describe('filterRelevantCitations', () => {
  const generalQuery = '항암치료 부작용은 어떻게 관리하나요?';

  it('일반 부작용 질문에서 치료 프로그램 인용을 제외한다', () => {
    const citations = [
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 113,
        excerpt:
          'Q 93 어떤 환자가 항암화학치료를 받게 되는지요? 독성이 항암 효과보다 미미하다고 판단될 때 시행합니다.',
      },
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 136,
        excerpt:
          'Q 109 항암화학치료 후 일반적 주의사항은 무엇인가요? 오심, 구토, 설사, 감염 등이 있을 수 있습니다.',
      },
    ];
    const filtered = filterRelevantCitations(
      citations,
      '부작용이 어떤것들이 있어요?',
    );
    expect(filtered.some((c) => c.page === 113)).toBe(false);
    expect(filtered.some((c) => c.page === 136)).toBe(true);
  });

  it('일반 부작용 질문에서 약물 Q&A 인용을 제외한다', () => {
    const citations = [
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 121,
        excerpt:
          'Q 100\n이리노테칸은 어떤 약제인가요?\nA\n아트로핀으로 예방하기도 합니다.',
      },
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 136,
        excerpt:
          'Q 109\n항암화학치료 후 일반적 주의사항은 무엇인가요? 부작용 관리를 잘해서 충분한 치료 용량과 치료 간격을 유지해야 합니다.',
      },
    ];

    const filtered = filterRelevantCitations(citations, generalQuery);
    expect(filtered.some((c) => c.page === 121)).toBe(false);
    expect(filtered.some((c) => c.page === 136)).toBe(true);
  });

  it('특정 약제 질문에서는 약물 Q&A를 유지한다', () => {
    const citations = [
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 121,
        excerpt:
          'Q 100\n이리노테칸은 어떤 약제인가요?\nA\n설사가 주요 부작용입니다.',
      },
    ];

    const filtered = filterRelevantCitations(
      citations,
      '이리노테칸 부작용은 어떻게 관리하나요?',
    );
    expect(filtered).toHaveLength(1);
  });

  it('영양 질문에서 석면·ALK·면역치료 인용을 제외한다', () => {
    const query = '먹어도 되는 음식과 피할 음식이 궁금해요.';
    const badCites = [
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 38,
        excerpt:
          'A 석면은 방화제(불타는 것 방지), 항부식제(물건이 시간이 지나 부식이 되는 것을 방지) 등의 여러 용도로 사용되었으나',
      },
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 130,
        excerpt:
          'A 역형성 림프종 키나아제(ALK)라는 유전자는 원래 림프종에서 알려져 있던 유전자인데',
      },
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 132,
        excerpt:
          '면역관문이라는 말은 예를 들어 전기포트로 물을 끓일 때 적정온도 에 도달하면',
      },
    ];
    const goodCites = [
      {
        docTitle: 'Q&A',
        fileName: 'lungca-patient-qa.pdf',
        page: 174,
        excerpt:
          'Q 138 항암치료 중 식사에 주의할 점은 무엇이 있나요? A 폐암 환자의 영양 관리의 원칙 중 첫 번째는, 음식의 종류를 가리지 않고',
      },
    ];

    expect(filterRelevantCitations(badCites, query)).toHaveLength(0);
    expect(filterRelevantCitations(goodCites, query)).toHaveLength(1);
  });
});
