import { Stethoscope, User } from "lucide-react";
import { MUTATION_OPTIONS, PDL1_OPTIONS } from "@/constants";
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
  setPdl1: (v: string) => void;
  toggleMutation: (id: string) => void;
}

const PatientForm = ({
  profile,
  setAge,
  setGender,
  setHistology,
  setPdl1,
  toggleMutation,
}: PatientFormProps) => {
  const { age, gender, histology, selectedMutations, pdl1 } = profile;
  const biomarkerSelectable = usesNsclcBiomarkerPanel(histology);

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

          {/* PD-L1 (NSCLC만) */}
          <div className="space-y-2">
            <Label
              className={
                biomarkerSelectable ? undefined : "text-muted-foreground"
              }
            >
              PD-L1 발현율
            </Label>
            {!biomarkerSelectable && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                소세포폐암은 비소세포폐암과 달리, PD-L1 %에 따라 1차 약을 고르는
                경우가 많지 않습니다.
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
              {PDL1_OPTIONS.map((o) => (
                <Button
                  key={o.id}
                  type="button"
                  variant={pdl1 === o.id ? "default" : "outline"}
                  size="sm"
                  className="justify-start"
                  disabled={!biomarkerSelectable}
                  onClick={() => setPdl1(o.id)}
                >
                  {o.label}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* 드라이버 유전자 변이 (NSCLC만) */}
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
                  ? "custom-scrollbar grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1"
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
        </CardContent>
      </Card>
    </aside>
  );
};

export default PatientForm;
