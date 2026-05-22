import { MUTATION_OPTIONS, PDL1_OPTIONS } from '../constants';
import type { PatientProfile, SurvivalResult } from '../types';

export function calculateSurvival(profile: PatientProfile): SurvivalResult {
  const { age, gender, histology, selectedMutations, pdl1, isTreated } = profile;

  if (!isTreated) {
    return { year5: 1.2, year3: 5, year1: 15, median: 0.5 };
  }

  let baseRate = 10;
  if (gender === 'female') baseRate += 4;
  else baseRate -= 2;

  if (age < 55) baseRate += 5;
  else if (age > 75) baseRate -= 5;

  let totalBonus = 0;
  if (histology !== 'smallcell') {
    if (histology === 'adenocarcinoma') baseRate += 2;
    else if (histology === 'squamous') baseRate -= 2;

    const selectedBonuses = MUTATION_OPTIONS
      .filter((m) => selectedMutations.includes(m.id))
      .map((m) => m.bonus);
    const maxMutationBonus = selectedBonuses.length > 0 ? Math.max(...selectedBonuses) : 0;
    const pdl1Bonus = PDL1_OPTIONS.find((o) => o.id === pdl1)?.bonus ?? 0;
    totalBonus = maxMutationBonus + pdl1Bonus;
    if (selectedMutations.length > 1 && !selectedMutations.includes('none')) totalBonus += 3;
  } else {
    baseRate -= 6;
  }

  const final5Year = Math.max(2, baseRate + totalBonus);
  return {
    year5: final5Year,
    year3: Math.min(68, final5Year * 2.3 + 7),
    year1: Math.min(94, final5Year * 4.1 + 16),
    median: (final5Year / 10) * 1.55 + 1.1,
  };
}
