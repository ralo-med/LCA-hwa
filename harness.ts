import fs from "node:fs";
import path from "node:path";
import {
  planChatResponse,
  resolveAnswerSources,
  answerDeniesGuidelineRelevance,
  filterRelevantCitations,
  stripDefensiveClosing,
} from "@/lib/rag";
import { callLlmChat } from "@/lib/llm-client";
import { DEFAULT_CHAT_MODEL_ID } from "@/lib/llm-models";
import type { GuidePatientContext } from "@/lib/guide-patient-context";
import type { GuideChatMessage, GuideSearchMode } from "@/types";

// '/data/*.json' 상대경로 fetch를 로컬 public 파일로 우회
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: any, init?: any) => {
  const u = typeof url === "string" ? url : url?.url;
  if (typeof u === "string" && u.startsWith("/")) {
    const p = path.join(process.cwd(), "public", u);
    const txt = fs.readFileSync(p, "utf8");
    return new Response(txt, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return realFetch(url, init);
}) as typeof fetch;

const ctx: GuidePatientContext = {
  profile: {
    age: 60,
    gender: "female",
    histology: "adenocarcinoma",
    selectedMutations: ["none"],
    pdl1: "unknown",
  },
  survival: null,
};

async function ask(
  question: string,
  history: GuideChatMessage[],
  mode: GuideSearchMode,
): Promise<GuideChatMessage> {
  const plan = await planChatResponse(question, ctx, history, mode);
  const raw = await callLlmChat(plan.messages, DEFAULT_CHAT_MODEL_ID, {
    maxTokens: 900,
    retries: 3,
  });
  const text = stripDefensiveClosing(raw || "");
  const resolved = resolveAnswerSources(
    plan.citations,
    text,
    plan.retrievalQuery,
    plan.searchedGuidelines,
  );
  const sources =
    plan.fromGuidelineRag && plan.citations.length > 0
      ? filterRelevantCitations(plan.citations, plan.retrievalQuery)
      : resolved.sources;
  const answerType = plan.fromSurvivalDashboard
    ? "survival"
    : plan.fromGuidelineRag &&
        plan.citations.length > 0 &&
        !answerDeniesGuidelineRelevance(text)
      ? "guideline"
      : resolved.answerType;
  return { role: "ai", text, sources, answerType };
}

interface Case {
  label: string;
  mode: GuideSearchMode;
  turns: string[]; // 멀티턴이면 여러 개
}

const CASES: Case[] = [
  { label: "범위밖-날씨", mode: "chat", turns: ["오늘 광주 날씨 어때요?"] },
  {
    label: "감정지지",
    mode: "chat",
    turns: ["폐암 진단 받았어요. 너무 무섭고 잠도 안 와요"],
  },
  {
    label: "응급-각혈",
    mode: "chat",
    turns: ["각혈을 했어요, 피가 나왔는데 어떡하죠?"],
  },
  {
    label: "용어설명-쉽게",
    mode: "chat",
    turns: ["EGFR이 뭔가요? 잘 몰라서 쉽게 설명해줘"],
  },
  {
    label: "보호자",
    mode: "chat",
    turns: ["아버지가 폐암 진단받았어요. 제가 어떻게 도와드리면 좋을까요?"],
  },
  {
    label: "잘못된정보-민간요법",
    mode: "chat",
    turns: ["민간요법이나 건강보조식품으로 폐암을 완치할 수 있나요?"],
  },
  { label: "잘못된전제-전염", mode: "chat", turns: ["폐암은 다른 사람에게 전염되나요?"] },
  { label: "생활-음식", mode: "chat", turns: ["김치나 회 같은 음식 먹어도 되나요?"] },
  {
    label: "멀티턴-표적치료→부작용",
    mode: "chat",
    turns: ["표적치료제가 뭐예요?", "그럼 부작용은 어떤 게 있어요?"],
  },
  {
    label: "멀티턴-종양표지자→종류",
    mode: "chat",
    turns: ["종양 표지자가 뭔가요?", "종류는 어떤 게 있어요?"],
  },
  {
    label: "정확모드-소세포치료",
    mode: "search",
    turns: ["소세포폐암 제한기의 표준 치료는 뭔가요?"],
  },
];

function fmtSources(m: GuideChatMessage): string {
  if (!m.sources || m.sources.length === 0) return "(근거 없음)";
  return m.sources
    .map((s) => `${s.fileName}·p${s.page}: ${s.excerpt.replace(/\s+/g, " ").slice(0, 70)}`)
    .join("\n     ");
}

async function main() {
  for (const c of CASES) {
    console.log("\n" + "=".repeat(90));
    console.log(`### [${c.label}] (mode=${c.mode})`);
    const history: GuideChatMessage[] = [];
    for (const q of c.turns) {
      console.log(`\nQ: ${q}`);
      const ai = await ask(q, history, c.mode);
      console.log(`[${ai.answerType}] ${ai.text}`);
      console.log(`  근거: ${fmtSources(ai)}`);
      history.push({ role: "user", text: q });
      history.push(ai);
    }
  }
}

main().catch((e) => {
  console.error("ERR", e);
  process.exit(1);
});
