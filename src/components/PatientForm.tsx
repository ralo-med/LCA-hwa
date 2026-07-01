import { Stethoscope } from "lucide-react";
import PatientProfileFields from "@/components/PatientProfileFields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Gender, Histology, PatientProfile } from "@/types";

interface PatientFormProps {
  profile: PatientProfile;
  configured: boolean;
  setAge: (v: number | null) => void;
  setGender: (v: Gender | null) => void;
  setHistology: (v: Histology | null) => void;
  toggleMutation: (id: string) => void;
  resetMutations: () => void;
  setConfigured: (v: boolean) => void;
}

const PatientForm = ({
  profile,
  configured,
  setAge,
  setGender,
  setHistology,
  toggleMutation,
  resetMutations,
  setConfigured,
}: PatientFormProps) => {
  const markConfigured = () => {
    if (!configured) setConfigured(true);
  };

  return (
    <aside className="no-print space-y-6 lg:col-span-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-5 w-5 text-primary" />
            임상 프로필 입력
          </CardTitle>
        </CardHeader>

        <CardContent>
          <PatientProfileFields
            profile={profile}
            setAge={(v) => {
              markConfigured();
              setAge(v);
            }}
            setGender={(v) => {
              markConfigured();
              setGender(v);
            }}
            setHistology={(v) => {
              markConfigured();
              setHistology(v);
            }}
            toggleMutation={(id) => {
              markConfigured();
              toggleMutation(id);
            }}
            resetMutations={resetMutations}
          />
        </CardContent>
      </Card>
    </aside>
  );
};

export default PatientForm;
