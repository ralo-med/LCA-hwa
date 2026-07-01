import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_PATIENT_PROFILE,
  hasPatientProfileInfo,
} from "@/lib/patient-profile";
import { usesNsclcBiomarkerPanel } from "@/lib/utils";
import type { Gender, Histology, PatientProfile } from "@/types";

const STORAGE_KEY = "lca-patient-profile";

interface StoredProfile extends Partial<PatientProfile> {
  configured?: boolean;
}

function loadStoredProfile(): StoredProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

function inferConfigured(stored: StoredProfile | null): boolean {
  if (!stored) return false;
  if (stored.configured === false) return false;
  if (stored.configured === true) return true;
  return (
    stored.age != null || stored.gender != null || stored.histology != null
  );
}

function persistProfile(configured: boolean, profile: PatientProfile): void {
  if (!configured) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ configured: false }));
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      configured: true,
      age: profile.age,
      gender: profile.gender,
      histology: profile.histology,
      selectedMutations: profile.selectedMutations,
      pdl1: profile.pdl1,
    }),
  );
}

export function usePatientProfile() {
  const stored = loadStoredProfile();
  const initialConfigured = inferConfigured(stored);

  const [configured, setConfigured] = useState(initialConfigured);
  const [age, setAge] = useState<number | null>(
    initialConfigured ? (stored?.age ?? null) : null,
  );
  const [gender, setGender] = useState<Gender | null>(
    initialConfigured ? (stored?.gender ?? null) : null,
  );
  const [histology, setHistology] = useState<Histology | null>(
    initialConfigured ? (stored?.histology ?? null) : null,
  );
  const [selectedMutations, setSelectedMutations] = useState<string[]>(
    initialConfigured
      ? (stored?.selectedMutations ?? EMPTY_PATIENT_PROFILE.selectedMutations)
      : EMPTY_PATIENT_PROFILE.selectedMutations,
  );
  const [pdl1, setPdl1] = useState<string>(
    initialConfigured
      ? (stored?.pdl1 ?? EMPTY_PATIENT_PROFILE.pdl1)
      : EMPTY_PATIENT_PROFILE.pdl1,
  );

  const profile = useMemo<PatientProfile>(
    () => ({ age, gender, histology, selectedMutations, pdl1 }),
    [age, gender, histology, selectedMutations, pdl1],
  );

  useEffect(() => {
    if (!configured) return;
    persistProfile(true, profile);
  }, [configured, profile]);

  const setHistologyAndResetBiomarkers = (h: Histology | null) => {
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

  const resetMutations = () => {
    if (!usesNsclcBiomarkerPanel(histology)) return;
    setSelectedMutations(["none"]);
  };

  const skipProfile = () => {
    setConfigured(false);
    setAge(null);
    setGender(null);
    setHistology(null);
    setSelectedMutations(EMPTY_PATIENT_PROFILE.selectedMutations);
    setPdl1(EMPTY_PATIENT_PROFILE.pdl1);
    persistProfile(false, EMPTY_PATIENT_PROFILE);
  };

  const saveProfile = () => {
    if (!hasPatientProfileInfo(profile)) {
      skipProfile();
      return;
    }
    setConfigured(true);
    persistProfile(true, profile);
  };

  const applyProfile = (next: PatientProfile, nextConfigured: boolean) => {
    setAge(next.age);
    setGender(next.gender);
    setHistology(next.histology);
    setSelectedMutations(next.selectedMutations);
    setPdl1(next.pdl1);
    setConfigured(nextConfigured);
    persistProfile(nextConfigured, next);
  };

  return {
    profile,
    configured,
    setConfigured,
    setAge,
    setGender,
    setHistology: setHistologyAndResetBiomarkers,
    toggleMutation,
    resetMutations,
    setPdl1,
    skipProfile,
    saveProfile,
    applyProfile,
  };
}
