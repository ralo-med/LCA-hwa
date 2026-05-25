import { useState } from "react";
import { Stethoscope, User } from "lucide-react";
import { MUTATION_OPTIONS } from "@/constants";
import { getPdl1SurvivalReference } from "@/lib/pdl1-reference";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface PatientFormProps {
  profile: PatientProfile;
  setAge: (v: number) => void;
  setGender: (v: Gender) => void;
  setHistology: (v: Histology) => void;
  toggleMutation: (id: string) => void;
}

const PatientForm = ({
  profile,
  setAge,
  setGender,
  setHistology,
  toggleMutation,
}: PatientFormProps) => {
  const { age, gender, histology, selectedMutations } = profile;
  const biomarkerSelectable = usesNsclcBiomarkerPanel(histology);
  const pdl1Ref = getPdl1SurvivalReference(histology);
  const [pdl1TierId, setPdl1TierId] = useState<string | null>(null);

  const pdl1TierIds = new Set(pdl1Ref?.tiers.map((t) => t.id) ?? []);
  const activePdl1TierId =
    pdl1TierId && pdl1TierIds.has(pdl1TierId) ? pdl1TierId : null;

  const selectedPdl1Tier =
    pdl1Ref?.tiers.find((t) => t.id === activePdl1TierId) ?? null;

  return (
    <aside className="no-print space-y-6 lg:col-span-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope className="h-5 w-5 text-primary" />
            임상 프로필 입력
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 나이 + 성별 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="age-slider">진단 연령대</Label>
              <Badge variant="secondary" className="font-mono">
                {age}대 ({age}–{age + 9}세)
              </Badge>
            </div>
            <Slider
              id="age-slider"
              min={30}
              max={80}
              step={10}
              value={[age]}
              onValueChange={(v) => setAge(v[0])}
            />
            <div className="flex justify-between px-1 text-[10px] font-medium text-muted-foreground">
              <span>30대</span>
              <span>40대</span>
              <span>50대</span>
              <span>60대</span>
              <span>70대</span>
              <span>80대</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {(["male", "female"] as const).map((g) => (
                <Button
                  key={g}
                  variant={gender === g ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGender(g)}
                >
                  <User />
                  {g === "male" ? "남성" : "여성"}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 조직형 */}
          <div className="space-y-2">
            <Label htmlFor="histology">암 조직형 분류</Label>
            <Select
              value={histology}
              onValueChange={(v) => setHistology(v as Histology)}
            >
              <SelectTrigger id="histology">
                <SelectValue placeholder="조직형 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="adenocarcinoma">
                  선암 (Adenocarcinoma)
                </SelectItem>
                <SelectItem value="squamous">
                  편평상피세포암 (Squamous Cell)
                </SelectItem>
                <SelectItem value="others">
                  기타 조직형 (Other NSCLC)
                </SelectItem>
                <SelectItem value="smallcell">소세포암 (Small Cell)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label
              className={
                biomarkerSelectable ? undefined : "text-muted-foreground"
              }
            >
              드라이버 유전자 변이
              {biomarkerSelectable && (
                <span className="ml-1 font-normal text-muted-foreground">
                  (복수 선택)
                </span>
              )}
            </Label>
            {!biomarkerSelectable && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                소세포폐암은 선암·편평상피암과 달리, EGFR·ALK 같은 유전자로
                맞추는 치료(표적치료)를 보통 하지 않습니다.
              </p>
            )}
            <div
              className={
                biomarkerSelectable
                  ? "grid grid-cols-2 gap-2"
                  : "grid grid-cols-2 gap-2 opacity-50 pointer-events-none"
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
                  className="justify-start text-[11px]"
                  disabled={!biomarkerSelectable}
                  onClick={() => toggleMutation(m.id)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
          </div>

          {pdl1Ref && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>{pdl1Ref.title}</Label>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  검사 결과 구간을 누르면, 그때 흔히 논의되는 치료와 생존에 대한
                  쉬운 설명이 나옵니다.
                </p>
                <div
                  className={
                    biomarkerSelectable
                      ? "grid grid-cols-2 gap-2"
                      : "grid grid-cols-1 gap-2"
                  }
                >
                  {pdl1Ref.tiers.map((t) => (
                    <Button
                      key={t.id}
                      type="button"
                      variant={activePdl1TierId === t.id ? "default" : "outline"}
                      size="sm"
                      className="justify-start"
                      onClick={() =>
                        setPdl1TierId((prev) => (prev === t.id ? null : t.id))
                      }
                    >
                      {t.buttonLabel}
                    </Button>
                  ))}
                </div>
                {selectedPdl1Tier ? (
                  <div className="space-y-2 rounded-md border border-dashed bg-muted/30 px-3 py-3">
                    <p className="text-xs font-semibold text-foreground">
                      {selectedPdl1Tier.range}
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        어떤 치료를 말하나요?{" "}
                      </span>
                      {selectedPdl1Tier.treatment}
                    </p>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-medium text-foreground">
                        생존은 어떻게 이해하면 될까요?{" "}
                      </span>
                      {selectedPdl1Tier.survival}
                    </p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground/80">
                      {pdl1Ref.caveat}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/80">
                    {pdl1Ref.intro}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  );
};

export default PatientForm;
