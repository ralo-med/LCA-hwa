import { useMemo, useState } from 'react';
import type { Gender, Histology, PatientProfile } from '@/types';

export function usePatientProfile() {
  const [age, setAge] = useState<number>(60);
  const [gender, setGender] = useState<Gender>('female');
  const [histology, setHistology] = useState<Histology>('adenocarcinoma');
  const [selectedMutations, setSelectedMutations] = useState<string[]>(['none']);
  const [pdl1, setPdl1] = useState<string>('unknown');

  const toggleMutation = (id: string) => {
    if (id === 'none') {
      setSelectedMutations(['none']);
      return;
    }
    let next = selectedMutations.filter((m) => m !== 'none');
    if (next.includes(id)) next = next.filter((m) => m !== id);
    else next.push(id);
    if (next.length === 0) next = ['none'];
    setSelectedMutations(next);
  };

  const profile = useMemo<PatientProfile>(
    () => ({ age, gender, histology, selectedMutations, pdl1 }),
    [age, gender, histology, selectedMutations, pdl1],
  );

  return {
    profile,
    setAge,
    setGender,
    setHistology,
    setPdl1,
    toggleMutation,
  };
}
