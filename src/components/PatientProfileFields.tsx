import { useState } from "react";
import { RotateCcw, User } from "lucide-react";
import { MUTATION_OPTIONS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { usesNsclcBiomarkerPanel } from "@/lib/utils";
import type { Gender, Histology, PatientProfile } from "@/types";

interface PatientProfileFieldsProps {
  profile: PatientProfile;
  setAge: (v: number | null) => void;
  setGender: (v: Gender | null) => void;
  setHistology: (v: Histology | null) => void;
  toggleMutation: (id: string) => void;
  resetMutations: () => void;
}

const MUTATION_DISPLAY_LABELS: Record<string, string> = {
  none: "없음 / 모름",
  egfr: "EGFR",
  alk: "ALK",
  ros1: "ROS1",
  braf: "BRAF",
  ntrk: "NTRK",
  met: "MET",
  ret: "RET",
  kras: "KRAS",
  egfr20: "EGFR ex20",
  her2: "HER2",
};

const PatientProfileFields = ({
  profile,
  setAge,
  setGender,
  setHistology,
  toggleMutation,
  resetMutations,
}: PatientProfileFieldsProps) => {
  const { age, gender, histology, selectedMutations } = profile;
  const biomarkerSelectable = usesNsclcBiomarkerPanel(histology);
  const mutationsAtDefault =
    selectedMutations.length === 1 && selectedMutations[0] === "none";
  const [ageInputOpen, setAgeInputOpen] = useState(age != null);

  const sliderAge = age ?? 60;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-base">
            진단 연령대
            <span className="ml-1.5 font-normal text-muted-foreground">
              (선택)
            </span>
          </Label>
          {ageInputOpen && (
            <Badge variant="secondary" className="font-mono">
              {age != null
                ? `${age}대 (${age}–${age + 9}세)`
                : "입력 안 함"}
            </Badge>
          )}
        </div>

        {!ageInputOpen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => setAgeInputOpen(true)}
          >
            연령 입력하기
          </Button>
        ) : (
          <>
            <Slider
              id="age-slider"
              min={30}
              max={80}
              step={10}
              value={[sliderAge]}
              onValueChange={(v) => setAge(v[0] ?? null)}
            />
            <div className="flex justify-between px-1 text-xs font-medium text-muted-foreground">
              <span>30대</span>
              <span>40대</span>
              <span>50대</span>
              <span>60대</span>
              <span>70대</span>
              <span>80대</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              onClick={() => {
                setAge(null);
                setAgeInputOpen(false);
              }}
            >
              연령 입력 안 함
            </Button>
          </>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-base">
          성별
          <span className="ml-1.5 font-normal text-muted-foreground">
            (선택)
          </span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((g) => (
            <Button
              key={g}
              type="button"
              variant={gender === g ? "default" : "outline"}
              size="sm"
              className="min-h-11"
              onClick={() => setGender(gender === g ? null : g)}
            >
              <User />
              {g === "male" ? "남성" : "여성"}
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="histology" className="text-base">
          암 조직형 분류
          <span className="ml-1.5 font-normal text-muted-foreground">
            (선택)
          </span>
        </Label>
        <Select
          value={histology ?? "unset"}
          onValueChange={(v) =>
            setHistology(v === "unset" ? null : (v as Histology))
          }
        >
          <SelectTrigger id="histology" className="min-h-11 text-base">
            <SelectValue placeholder="선택하지 않음" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">선택하지 않음</SelectItem>
            <SelectItem value="adenocarcinoma">선암</SelectItem>
            <SelectItem value="squamous">편평상피세포암</SelectItem>
            <SelectItem value="others">기타 비소세포암</SelectItem>
            <SelectItem value="smallcell">소세포암</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label
            className={
              biomarkerSelectable ? "text-base" : "text-base text-muted-foreground"
            }
          >
            유전자 변이
            <span className="ml-1.5 font-normal text-muted-foreground">
              (선택)
            </span>
          </Label>
          {biomarkerSelectable && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-10 shrink-0 gap-1 px-2 text-sm text-muted-foreground"
              onClick={resetMutations}
              disabled={mutationsAtDefault}
              aria-label="유전자 변이 초기화"
            >
              <RotateCcw className="h-4 w-4" />
              초기화
            </Button>
          )}
        </div>
        {histology == null && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            암 조직형을 선택하면 입력할 수 있습니다.
          </p>
        )}
        {histology != null && biomarkerSelectable && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            해당하는 항목을 선택해 주세요. 여러 개를 고를 수 있습니다.
          </p>
        )}
        {histology != null && !biomarkerSelectable && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            소세포암은 이 항목을 사용하지 않습니다.
          </p>
        )}
        <div
          className={
            biomarkerSelectable && histology != null
              ? "grid grid-cols-1 gap-2 sm:grid-cols-2"
              : "grid grid-cols-1 gap-2 sm:grid-cols-2 opacity-60 pointer-events-none"
          }
          aria-disabled={!biomarkerSelectable || histology == null}
        >
          {MUTATION_OPTIONS.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant={
                selectedMutations.includes(m.id) ? "default" : "outline"
              }
              size="default"
              className="min-h-11 w-full justify-start px-4 text-base font-medium"
              disabled={!biomarkerSelectable || histology == null}
              onClick={() => toggleMutation(m.id)}
            >
              {MUTATION_DISPLAY_LABELS[m.id] ?? m.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientProfileFields;
