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
          <Label>
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
            <div className="flex justify-between px-1 text-[10px] font-medium text-muted-foreground">
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
        <Label>
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
        <Label htmlFor="histology">
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
          <SelectTrigger id="histology" className="min-h-11">
            <SelectValue placeholder="선택하지 않음" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unset">선택하지 않음</SelectItem>
            <SelectItem value="adenocarcinoma">
              선암 (Adenocarcinoma)
            </SelectItem>
            <SelectItem value="squamous">
              편평상피세포암 (Squamous Cell)
            </SelectItem>
            <SelectItem value="others">기타 조직형 (Other NSCLC)</SelectItem>
            <SelectItem value="smallcell">소세포암 (Small Cell)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {histology != null && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label
                className={
                  biomarkerSelectable ? undefined : "text-muted-foreground"
                }
              >
                드라이버 유전자 변이
                <span className="ml-1.5 font-normal text-muted-foreground">
                  (선택)
                </span>
              </Label>
              {biomarkerSelectable && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 gap-1 px-2 text-[10px] text-muted-foreground"
                  onClick={resetMutations}
                  disabled={mutationsAtDefault}
                  aria-label="드라이버 유전자 변이 초기화"
                >
                  <RotateCcw className="h-3 w-3" />
                  초기화
                </Button>
              )}
            </div>
            {biomarkerSelectable && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                여러 개 선택 시 모두 가진 환자만 집계합니다.
              </p>
            )}
            {!biomarkerSelectable && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                소세포폐암은 표적치료 대상이 아니라 변이 선택이 없습니다.
              </p>
            )}
            <div
              className={
                biomarkerSelectable
                  ? "grid min-w-0 grid-cols-2 gap-2"
                  : "grid min-w-0 grid-cols-2 gap-2 opacity-50 pointer-events-none"
              }
              aria-disabled={!biomarkerSelectable}
            >
              {MUTATION_OPTIONS.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  variant={
                    selectedMutations.includes(m.id) ? "default" : "outline"
                  }
                  size="sm"
                  className="min-w-0 w-full justify-start px-1.5 text-[10px] leading-tight"
                  disabled={!biomarkerSelectable}
                  onClick={() => toggleMutation(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PatientProfileFields;
