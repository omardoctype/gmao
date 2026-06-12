import { AlertCircle, ClipboardList, FileText, PackageSearch, Sparkles, Wrench } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiSource } from "@/types/ai-assistant";

const NO_INFO_MESSAGE = "Je n’ai pas trouvé d’information suffisante dans la base documentaire.";
const NO_PIECE_MESSAGE = "Aucune pièce spécifique n’est mentionnée dans les extraits sélectionnés.";
const NO_CAUSE_MESSAGE = "Les causes ne sont pas précisées explicitement dans les extraits sélectionnés.";

type SectionKey = "diagnosis" | "causes" | "actions" | "pieces" | "documents";

interface ParsedAnswer {
  diagnosis: string;
  causes: string[];
  actions: string[];
  pieces: string[];
  documents: string[];
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/é|è|ê|ë/g, "e")
    .replace(/à|â|ä/g, "a")
    .replace(/î|ï/g, "i")
    .replace(/ô|ö/g, "o")
    .replace(/ù|û|ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/œ/g, "oe")
    .replace(/’/g, "'")
    .trim();
}

function ensureSentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function dedupe(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    const key = normalizeForMatch(trimmed);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function stripListPrefix(value: string): string {
  return value.replace(/^[-*]\s+/, "").replace(/^\d+[\.)]\s+/, "").trim();
}

function getHeadingKey(line: string): SectionKey | null {
  const cleaned = normalizeForMatch(line.replace(/^#{1,6}\s*/, "").replace(/:$/, "").trim());

  if (cleaned === "diagnostic probable") {
    return "diagnosis";
  }
  if (cleaned === "causes possibles") {
    return "causes";
  }
  if (cleaned === "actions recommandees") {
    return "actions";
  }
  if (cleaned === "pieces recommandees") {
    return "pieces";
  }
  if (cleaned === "documents utilises") {
    return "documents";
  }

  return null;
}

function buildFallbackDocuments(sources: AiSource[]): string[] {
  return dedupe(sources.map((source) => source.file)).slice(0, 6);
}

function canonicalizeAnswer(answer: string): string {
  const markers = [
    "### Diagnostic probable",
    "Diagnostic probable :",
    "### Causes possibles",
    "Causes possibles :",
    "### Actions recommandées",
    "Actions recommandées :",
    "### Pièces recommandées",
    "Pièces recommandées :",
    "### Documents utilisés",
    "Documents utilisés :",
  ];

  return markers.reduce((current, marker) => {
    const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return current.replace(new RegExp(`\\s*(${escaped})`, "gi"), "\n$1");
  }, answer);
}

function parseStructuredAnswer(answer: string, sources: AiSource[]): ParsedAnswer {
  const normalizedAnswer = canonicalizeAnswer(answer).replace(/\r\n/g, "\n").trim();
  const lines = normalizedAnswer.split("\n");

  const diagnosisLines: string[] = [];
  const causes: string[] = [];
  const actions: string[] = [];
  const pieces: string[] = [];
  const documents: string[] = [];

  let currentSection: SectionKey | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const heading = getHeadingKey(line);
    if (heading) {
      currentSection = heading;
      continue;
    }

    const content = stripListPrefix(line);
    if (!content) {
      continue;
    }

    if (!currentSection) {
      diagnosisLines.push(content);
      continue;
    }

    if (currentSection === "diagnosis") {
      diagnosisLines.push(content);
      continue;
    }

    if (currentSection === "causes") {
      causes.push(ensureSentence(content));
      continue;
    }

    if (currentSection === "actions") {
      actions.push(ensureSentence(content));
      continue;
    }

    if (currentSection === "pieces") {
      pieces.push(ensureSentence(content));
      continue;
    }

    documents.push(content);
  }

  const diagnosis = diagnosisLines.join(" ").replace(/\s+/g, " ").trim();
  const normalizedDiagnosis = diagnosis || answer.trim();
  const fallbackDocuments = buildFallbackDocuments(sources);

  return {
    diagnosis: normalizedDiagnosis,
    causes: dedupe(causes),
    actions: dedupe(actions),
    pieces: dedupe(pieces),
    documents: dedupe(documents).length > 0 ? dedupe(documents) : fallbackDocuments,
  };
}

interface AiStructuredAnswerProps {
  answer: string;
  sources: AiSource[];
}

export function AiStructuredAnswer({ answer, sources }: AiStructuredAnswerProps) {
  const parsed = parseStructuredAnswer(answer, sources);

  if (parsed.diagnosis === NO_INFO_MESSAGE) {
    return (
      <Card className="border-border/90 bg-surface-elevated">
        <CardContent className="flex items-start gap-2 p-4 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{NO_INFO_MESSAGE}</span>
        </CardContent>
      </Card>
    );
  }

  const causes = parsed.causes.length > 0 ? parsed.causes : [NO_CAUSE_MESSAGE];
  const actions = parsed.actions;
  const pieces = parsed.pieces.length > 0 ? parsed.pieces : [NO_PIECE_MESSAGE];
  const documents = parsed.documents.length > 0 ? parsed.documents : ["inconnu"];

  return (
    <div className="space-y-3">
      <Card className="border-border/90 bg-surface-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Diagnostic probable
          </CardTitle>
          <CardDescription>Lecture synthétique et exploitable sur le terrain.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-foreground">{parsed.diagnosis}</p>
        </CardContent>
      </Card>

      <Card className="border-border/90 bg-surface-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 text-primary" />
            Causes possibles
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {causes.map((cause, index) => (
              <li key={`${cause}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                <span className="leading-relaxed">{cause}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-border/90 bg-surface-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-primary" />
            Actions recommandées
          </CardTitle>
          <CardDescription>Actions prioritaires pour un diagnostic et une remise en service sécurisés.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {actions.length > 0 ? (
            <ol className="space-y-2">
              {actions.map((action, index) => (
                <li key={`${action}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune action exploitable n’a été extraite de la réponse IA.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="border-border/90 bg-surface-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PackageSearch className="h-4 w-4 text-primary" />
              Pièces recommandées
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {pieces.length === 1 && normalizeForMatch(pieces[0]) === normalizeForMatch(NO_PIECE_MESSAGE) ? (
              <p className="text-sm leading-relaxed text-muted-foreground">{NO_PIECE_MESSAGE}</p>
            ) : (
              <ul className="space-y-2">
                {pieces.map((piece, index) => (
                  <li key={`${piece}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                    <span className="leading-relaxed">{piece}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/90 bg-surface-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-primary" />
              Documents utilisés
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              {documents.map((document, index) => (
                <li key={`${document}-${index}`} className="flex items-start gap-2 text-sm text-foreground">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="break-all leading-relaxed">{document}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
