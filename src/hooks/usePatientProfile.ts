import { useEffect, useMemo, useState } from "react";
import type { Gender, Histology, PatientProfile } from "@/types";
import { usesNsclcBiomarkerPanel } from "@/lib/utils";

const STORAGE_KEY = "lca-patient-profile";

function loadStoredProfile(): Partial<PatientProfile> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<PatientProfile>) : null;
  } catch {
    return null;
  }
}

export function usePatientProfile() {
  const stored = loadStoredProfile();
  const [age, setAge] = useState<number>(stored?.age ?? 60);
  const [gender, setGender] = useState<Gender>(stored?.gender ?? "female");
  const [histology, setHistology] = useState<Histology>(
    stored?.histology ?? "adenocarcinoma",
  );
  const [selectedMutations, setSelectedMutations] = useState<string[]>(
    stored?.selectedMutations ?? ["none"],
  );
  const [pdl1, setPdl1] = useState<string>(stored?.pdl1 ?? "unknown");

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ age, gender, histology, selectedMutations, pdl1 }),
    );
  }, [age, gender, histology, selectedMutations, pdl1]);

  const setHistologyAndResetBiomarkers = (h: Histology) => {
    setHistology(h);
    if (!usesNsclcBiomarkerPanel(h)) {
      setSelectedMutations(["none"]);
      setPdl1("unknown");
    }
  };

  const toggleMutation = (id: string) => {
    if (!usesNsclcBiomarkerPanel(histology)) return;
    if (id === "none") {
      setSelectedMutations(["none"]);
      return;
    }
    let next = selectedMutations.filter((m) => m !== "none");
    if (next.includes(id)) next = next.filter((m) => m !== id);
    else next.push(id);
    if (next.length === 0) next = ["none"];
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
    setHistology: setHistologyAndResetBiomarkers,
    toggleMutation,
  };
}
