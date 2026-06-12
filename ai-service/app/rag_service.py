from __future__ import annotations

import json
import logging
import re
from time import perf_counter
from typing import Any, Dict, List, Optional, Tuple

import requests

from app.config import Settings
from app.document_loader import chunk_documents, load_markdown_documents, sync_markdown_documents
from app.vector_store import VectorStore


logger = logging.getLogger(__name__)


NO_INFO_MESSAGE = "Je n’ai pas trouvé d’information suffisante dans la base documentaire."
NO_PIECE_MESSAGE = "Aucune pièce spécifique n’est mentionnée dans les extraits sélectionnés."
UNKNOWN_CAUSES_MESSAGE = "Les causes ne sont pas précisées explicitement dans les extraits sélectionnés."

NOT_PROVIDED_MESSAGE = "Non renseigné"
AI_EQUIPMENT_DOCUMENT_TYPE = "AI_GENERATED_EQUIPMENT_DOCUMENT"
SHORT_RESPONSE_INSTRUCTION = (
    "Réponds en français de façon courte, claire et structurée.\n"
    "Maximum 5 lignes.\n"
    "Ne répète pas le contexte.\n"
    "Donne uniquement la réponse utile, les causes principales et les actions recommandées.\n"
)

ACTION_VERB_HINTS = (
    "verifier",
    "controler",
    "nettoyer",
    "mesurer",
    "tester",
    "relever",
    "remplacer",
    "recalibrer",
    "reduire",
    "securiser",
    "consigner",
    "inspecter",
    "ajuster",
)

SURCHAUFFE_ACTION_RULES = [
    (("ventilation", "ventilateur", "ailettes", "refroidissement"), "Vérifier la ventilation moteur."),
    (("temperature", "thermique"), "Contrôler la température de fonctionnement."),
    (("ventilation", "ailettes", "debit d'air"), "Nettoyer les grilles d’aération."),
    (("capteur", "capteurs thermiques"), "Vérifier le capteur température."),
    (("charge", "surcharge", "point dur"), "Contrôler la charge mécanique."),
]

SURCHAUFFE_CAUSE_RULES = [
    (("ventilation", "ventilateur", "ailettes", "refroidissement"), "Ventilation moteur insuffisante."),
    (("temperature", "thermique", "alarme de temperature"), "Écart thermique anormal en fonctionnement."),
    (("capteur", "capteurs thermiques"), "Dérive ou défaut du capteur de température."),
    (("charge", "surcharge", "point dur"), "Charge mécanique excessive ou point dur sur l’organe entraîné."),
    (("lubrification", "roulement"), "Échauffement lié à la lubrification ou à l’usure des roulements."),
]

ALLOWED_ACTION_TERMS = (
    "ventilation",
    "ventilateur",
    "ailettes",
    "refroidissement",
    "temperature",
    "thermique",
    "capteur",
    "charge",
    "surcharge",
    "point dur",
    "lubrification",
    "roulement",
    "courant",
    "tension",
    "consignation",
    "debit d'air",
    "mesure",
    "diagnostic",
    "moteur",
    "alignement",
    "convoyeur",
    "courroie",
    "galet",
    "rouleau",
)


class RagService:
    def __init__(self, settings: Settings, vector_store: VectorStore) -> None:
        self.settings = settings
        self.vector_store = vector_store

    def ingest(self) -> Dict[str, Any]:
        total_started_at = perf_counter()
        sync_ms = 0.0
        load_ms = 0.0
        chunk_ms = 0.0
        upsert_ms = 0.0

        if self.settings.auto_sync_documents:
            sync_started_at = perf_counter()
            sync_markdown_documents(self.settings.source_documents_dir, self.settings.documents_dir)
            sync_ms = self._elapsed_ms(sync_started_at)

        load_started_at = perf_counter()
        documents = load_markdown_documents(self.settings.documents_dir)
        load_ms = self._elapsed_ms(load_started_at)

        chunk_started_at = perf_counter()
        chunks = chunk_documents(documents, chunk_size=self.settings.chunk_size, overlap=self.settings.chunk_overlap)
        chunk_ms = self._elapsed_ms(chunk_started_at)

        upsert_started_at = perf_counter()
        result = self.vector_store.upsert_chunks(chunks)
        upsert_ms = self._elapsed_ms(upsert_started_at)

        new_chunks = result["new_chunks"]
        total_chunks = result["total_chunks"]

        if not documents:
            already_indexed = False
            message = "Aucun document trouvé pour l'indexation."
        elif new_chunks == 0 and total_chunks > 0:
            already_indexed = True
            message = "Documents déjà indexés. Aucun nouveau chunk ajouté."
        else:
            already_indexed = False
            message = "Indexation terminée avec succès."

        logger.info(
            "AI ingest timing documentCount=%s chunkCount=%s newChunks=%s totalChunks=%s autoSync=%s syncMs=%.1f loadMs=%.1f chunkMs=%.1f upsertMs=%.1f totalMs=%.1f",
            len(documents),
            len(chunks),
            new_chunks,
            total_chunks,
            self.settings.auto_sync_documents,
            sync_ms,
            load_ms,
            chunk_ms,
            upsert_ms,
            self._elapsed_ms(total_started_at),
        )
        return {
            "indexedDocuments": len(documents),
            "newChunks": new_chunks,
            "totalChunks": total_chunks,
            "alreadyIndexed": already_indexed,
            "message": message,
        }

    def ask(self, question: str, equipment_code: Optional[str] = None) -> Dict:
        total_started_at = perf_counter()
        status = "success"
        sources: List[Dict] = []
        retrieval_ms = 0.0
        prompt_ms = 0.0
        ollama_ms = 0.0
        formatting_ms = 0.0

        try:
            retrieval_started_at = perf_counter()
            sources = self._retrieve_sources(question=question, equipment_code=equipment_code)
            retrieval_ms = self._elapsed_ms(retrieval_started_at)
            if not sources:
                status = "no_sources"
                return {"answer": NO_INFO_MESSAGE, "sources": []}

            prompt_started_at = perf_counter()
            prompt = self._build_qa_prompt(question=question, sources=sources, equipment_code=equipment_code)
            prompt_ms = self._elapsed_ms(prompt_started_at)

            ollama_started_at = perf_counter()
            raw_answer = self._generate_with_ollama(prompt=prompt).strip()
            ollama_ms = self._elapsed_ms(ollama_started_at)
            if not raw_answer:
                raw_answer = NO_INFO_MESSAGE

            formatting_started_at = perf_counter()
            if self._contains_no_info(raw_answer):
                status = "no_info"
                formatting_ms = self._elapsed_ms(formatting_started_at)
                return {"answer": NO_INFO_MESSAGE, "sources": self._format_sources(sources)}

            answer = self._format_structured_ask_answer(
                answer=raw_answer,
                question=question,
                sources=sources,
                equipment_code=equipment_code,
            )
            if not answer:
                answer = NO_INFO_MESSAGE

            formatting_ms = self._elapsed_ms(formatting_started_at)
            return {"answer": answer, "sources": self._format_sources(sources)}
        except Exception:
            status = "error"
            raise
        finally:
            logger.info(
                "AI RAG timing operation=ask status=%s equipmentCode=%s sourceCount=%s contextPreparationMs=0.0 retrievalMs=%.1f promptMs=%.1f ollamaMs=%.1f formattingMs=%.1f totalMs=%.1f",
                status,
                equipment_code or "-",
                len(sources),
                retrieval_ms,
                prompt_ms,
                ollama_ms,
                formatting_ms,
                self._elapsed_ms(total_started_at),
            )

    def diagnosis(self, equipment_code: str, breakdown_description: str) -> Dict:
        total_started_at = perf_counter()
        status = "success"
        sources: List[Dict] = []
        retrieval_ms = 0.0
        prompt_ms = 0.0
        ollama_ms = 0.0
        formatting_ms = 0.0

        try:
            query = f"Code equipement: {equipment_code}. Description de panne: {breakdown_description}"
            retrieval_started_at = perf_counter()
            sources = self._retrieve_sources(question=query, equipment_code=equipment_code)
            retrieval_ms = self._elapsed_ms(retrieval_started_at)
            if not sources:
                status = "no_sources"
                return {
                    "diagnosis": NO_INFO_MESSAGE,
                    "recommendedActions": [],
                    "sources": [],
                }

            prompt_started_at = perf_counter()
            prompt = self._build_diagnosis_prompt(
                equipment_code=equipment_code,
                breakdown_description=breakdown_description,
                sources=sources,
            )
            prompt_ms = self._elapsed_ms(prompt_started_at)

            ollama_started_at = perf_counter()
            raw_response = self._generate_with_ollama(prompt=prompt, force_json=True)
            ollama_ms = self._elapsed_ms(ollama_started_at)

            formatting_started_at = perf_counter()
            parsed = self._parse_json_object(raw_response)

            diagnosis = self._clean_text(str(parsed.get("diagnosis", ""))) if parsed else ""
            model_actions = self._normalize_actions(parsed.get("recommendedActions", []) if parsed else [])
            recommended_actions = self._build_actions_from_sources(
                breakdown_description=breakdown_description,
                sources=sources,
                model_actions=model_actions,
            )

            if not diagnosis or self._contains_no_info(diagnosis):
                diagnosis = self._fallback_diagnosis(breakdown_description=breakdown_description, sources=sources)

            if diagnosis == NO_INFO_MESSAGE:
                recommended_actions = []
            else:
                if "risque" not in self._normalize_for_search(diagnosis):
                    diagnosis = f"{diagnosis} Niveau de risque: a confirmer sur site."
                diagnosis = self._to_snippet(diagnosis, max_chars=260)
                recommended_actions = recommended_actions[:3]

            formatting_ms = self._elapsed_ms(formatting_started_at)
            return {
                "diagnosis": diagnosis,
                "recommendedActions": recommended_actions,
                "sources": self._format_sources(sources),
            }
        except Exception:
            status = "error"
            raise
        finally:
            logger.info(
                "AI RAG timing operation=diagnosis status=%s equipmentCode=%s sourceCount=%s contextPreparationMs=0.0 retrievalMs=%.1f promptMs=%.1f ollamaMs=%.1f formattingMs=%.1f totalMs=%.1f",
                status,
                equipment_code,
                len(sources),
                retrieval_ms,
                prompt_ms,
                ollama_ms,
                formatting_ms,
                self._elapsed_ms(total_started_at),
            )

    def generate_equipment_document(self, equipment_payload: Dict[str, Any]) -> Dict[str, str]:
        total_started_at = perf_counter()
        context_prepare_ms = 0.0
        retrieval_ms = 0.0
        prompt_ms = 0.0
        ollama_ms = 0.0
        formatting_ms = 0.0
        sources: List[Dict] = []
        status = "success"

        try:
            context_started_at = perf_counter()
            equipment = self._normalize_equipment_input(equipment_payload)
            title = f"Fiche technique IA - {equipment['code']}"

            query_parts = [
                equipment["code"],
                equipment["name"],
                equipment["category"],
                equipment["brand"],
                equipment["model"],
                equipment["description"],
            ]
            query = " ".join(part for part in query_parts if part != NOT_PROVIDED_MESSAGE).strip()
            if not query:
                query = "maintenance equipement industriel"
            context_prepare_ms = self._elapsed_ms(context_started_at)

            retrieval_started_at = perf_counter()
            sources = self._retrieve_sources_for_equipment_document(query=query, equipment_code=equipment["code"])
            retrieval_ms = self._elapsed_ms(retrieval_started_at)

            prompt_started_at = perf_counter()
            prompt = self._build_equipment_document_prompt(equipment=equipment, sources=sources)
            prompt_ms = self._elapsed_ms(prompt_started_at)

            ollama_started_at = perf_counter()
            raw_markdown = self._generate_with_ollama(prompt=prompt)
            ollama_ms = self._elapsed_ms(ollama_started_at)

            formatting_started_at = perf_counter()
            content = self._build_equipment_document_markdown(equipment=equipment, raw_markdown=raw_markdown, sources=sources)
            formatting_ms = self._elapsed_ms(formatting_started_at)
            return {"title": title, "content": content}
        except Exception:
            status = "error"
            raise
        finally:
            logger.info(
                "AI RAG timing operation=equipment_document status=%s sourceCount=%s contextPreparationMs=%.1f retrievalMs=%.1f promptMs=%.1f ollamaMs=%.1f formattingMs=%.1f totalMs=%.1f",
                status,
                len(sources),
                context_prepare_ms,
                retrieval_ms,
                prompt_ms,
                ollama_ms,
                formatting_ms,
                self._elapsed_ms(total_started_at),
            )

    def _retrieve_sources_for_equipment_document(self, query: str, equipment_code: str) -> List[Dict]:
        target_code = None if equipment_code == NOT_PROVIDED_MESSAGE else equipment_code
        primary_hits = self._retrieve_sources(question=query, equipment_code=target_code)
        if len(primary_hits) >= 2:
            return primary_hits

        fallback_hits = self._retrieve_sources(question=query, equipment_code=None)
        merged: List[Dict] = []
        seen = set()
        for hit in primary_hits + fallback_hits:
            metadata = hit.get("metadata", {})
            key = (
                str(metadata.get("source_file", "")),
                str(metadata.get("chunk_index", "")),
            )
            if key in seen:
                continue
            seen.add(key)
            merged.append(hit)
            if len(merged) >= self._effective_top_k():
                break
        return merged

    def _normalize_equipment_input(self, payload: Dict[str, Any]) -> Dict[str, str]:
        def normalize(value: Any) -> str:
            text = str(value).strip() if value is not None else ""
            if not text:
                return NOT_PROVIDED_MESSAGE
            return re.sub(r"\s+", " ", text)

        return {
            "code": normalize(payload.get("code")),
            "name": normalize(payload.get("name")),
            "category": normalize(payload.get("category")),
            "brand": normalize(payload.get("brand")),
            "model": normalize(payload.get("model")),
            "serialNumber": normalize(payload.get("serialNumber")),
            "location": normalize(payload.get("location")),
            "status": normalize(payload.get("status")),
            "criticality": normalize(payload.get("criticality")),
            "description": normalize(payload.get("description")),
        }

    def _build_equipment_document_prompt(self, equipment: Dict[str, str], sources: List[Dict]) -> str:
        context = self._build_context(sources) if sources else "Aucun extrait documentaire pertinent n'a ete retrouve."

        return (
            "Tu es un assistant de maintenance industrielle.\n"
            "Tu rediges une fiche technique professionnelle en francais pour un equipement GMAO.\n"
            "Utilise uniquement les informations du contexte documentaire et les informations equipement fournies.\n"
            "N'invente pas de donnees techniques precises absentes des sources.\n"
            f"Si une information est absente, ecris exactement: {NOT_PROVIDED_MESSAGE}\n"
            "Retourne uniquement du Markdown avec cette structure exacte:\n"
            f"# Fiche technique IA - {equipment['code']} - {equipment['name']}\n"
            "## Informations generales\n"
            "## Description technique\n"
            "## Risques principaux\n"
            "## Symptomes possibles\n"
            "## Procedure de maintenance preventive\n"
            "## Points de controle\n"
            "## Pieces recommandees\n"
            "## Consignes de securite\n"
            "## Informations utiles pour le RAG\n\n"
            "Informations equipement:\n"
            f"- Code: {equipment['code']}\n"
            f"- Nom: {equipment['name']}\n"
            f"- Categorie: {equipment['category']}\n"
            f"- Marque: {equipment['brand']}\n"
            f"- Modele: {equipment['model']}\n"
            f"- Numero de serie: {equipment['serialNumber']}\n"
            f"- Localisation: {equipment['location']}\n"
            f"- Statut: {equipment['status']}\n"
            f"- Criticite: {equipment['criticality']}\n"
            f"- Description: {equipment['description']}\n\n"
            f"Contexte documentaire:\n{context}\n"
        )

    def _build_equipment_document_markdown(
        self,
        equipment: Dict[str, str],
        raw_markdown: str,
        sources: List[Dict],
    ) -> str:
        normalized = self._normalize_markdown_fragment(raw_markdown)

        description = self._extract_markdown_section(
            normalized,
            headings=["Description technique"],
        ) or NOT_PROVIDED_MESSAGE

        risks = self._to_bullet_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Risques principaux"],
            )
        )
        symptoms = self._to_bullet_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Symptomes possibles", "Symptômes possibles"],
            )
        )
        preventive = self._to_numbered_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Procedure de maintenance preventive", "Procédure de maintenance préventive"],
            ),
            minimum_items=3,
        )
        control_points = self._to_bullet_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Points de controle", "Points de contrôle"],
            )
        )
        parts = self._to_bullet_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Pieces recommandees", "Pièces recommandées"],
            )
        )
        safety = self._to_bullet_lines(
            self._extract_markdown_section(
                normalized,
                headings=["Consignes de securite", "Consignes de sécurité"],
            )
        )

        keywords = [
            value
            for value in (
                equipment["code"],
                equipment["name"],
                equipment["category"],
                equipment["brand"],
                equipment["model"],
                equipment["status"],
                equipment["criticality"],
            )
            if value != NOT_PROVIDED_MESSAGE
        ]
        source_files = self._extract_source_document_names(sources)
        if source_files and source_files != ["inconnu"]:
            keywords.extend(source_files)
        keywords = self._dedupe_preserve_order(keywords)
        keyword_line = ", ".join(keywords) if keywords else NOT_PROVIDED_MESSAGE

        return (
            f"# Fiche technique IA - {equipment['code']} - {equipment['name']}\n\n"
            "## Informations générales\n"
            f"- Code : {equipment['code']}\n"
            f"- Nom : {equipment['name']}\n"
            f"- Catégorie : {equipment['category']}\n"
            f"- Marque : {equipment['brand']}\n"
            f"- Modèle : {equipment['model']}\n"
            f"- Numéro de série : {equipment['serialNumber']}\n"
            f"- Localisation : {equipment['location']}\n"
            f"- Statut : {equipment['status']}\n"
            f"- Criticité : {equipment['criticality']}\n\n"
            "## Description technique\n"
            f"{description}\n\n"
            "## Risques principaux\n"
            f"{chr(10).join(risks)}\n\n"
            "## Symptômes possibles\n"
            f"{chr(10).join(symptoms)}\n\n"
            "## Procédure de maintenance préventive\n"
            f"{chr(10).join(preventive)}\n\n"
            "## Points de contrôle\n"
            f"{chr(10).join(control_points)}\n\n"
            "## Pièces recommandées\n"
            f"{chr(10).join(parts)}\n\n"
            "## Consignes de sécurité\n"
            f"{chr(10).join(safety)}\n\n"
            "## Informations utiles pour le RAG\n"
            f"- équipement : {equipment['code']} - {equipment['name']}\n"
            f"- mots clés : {keyword_line}\n"
            f"- type document : {AI_EQUIPMENT_DOCUMENT_TYPE}\n"
        )

    def _extract_markdown_section(self, markdown: str, headings: List[str]) -> str:
        for heading in headings:
            pattern = rf"(?ims)^\s*##\s*{re.escape(heading)}\s*\n(?P<body>.*?)(?=^\s*##\s+|\Z)"
            match = re.search(pattern, markdown)
            if match:
                body = match.group("body").strip()
                if body:
                    return body
        return ""

    def _normalize_markdown_fragment(self, markdown: str) -> str:
        if not markdown:
            return ""
        normalized = markdown.replace("\r\n", "\n").strip()
        fence_match = re.search(r"(?is)^```(?:markdown|md)?\s*(.*?)\s*```$", normalized)
        if fence_match:
            normalized = fence_match.group(1).strip()
        return normalized

    def _to_bullet_lines(self, section_text: str) -> List[str]:
        if not section_text.strip():
            return [f"- {NOT_PROVIDED_MESSAGE}"]

        items: List[str] = []
        for raw_line in section_text.splitlines():
            line = raw_line.strip()
            if not line:
                continue
            line = re.sub(r"^[\-\*\d\.\)\( ]+", "", line).strip()
            if not line:
                continue
            line = self._ensure_sentence(line)
            items.append(f"- {line}")

        deduped = self._dedupe_preserve_order(items)
        return deduped if deduped else [f"- {NOT_PROVIDED_MESSAGE}"]

    def _to_numbered_lines(self, section_text: str, minimum_items: int = 1) -> List[str]:
        items: List[str] = []
        if section_text.strip():
            for raw_line in section_text.splitlines():
                line = raw_line.strip()
                if not line:
                    continue
                line = re.sub(r"^[\-\*\d\.\)\( ]+", "", line).strip()
                if not line:
                    continue
                items.append(self._ensure_sentence(line))

        items = self._dedupe_preserve_order(items)
        while len(items) < minimum_items:
            items.append(NOT_PROVIDED_MESSAGE)

        return [f"{index}. {value}" for index, value in enumerate(items, start=1)]

    def _retrieve_sources(self, question: str, equipment_code: Optional[str]) -> List[Dict]:
        target_code = (equipment_code or "").strip().upper()
        top_k = self._effective_top_k()
        hit_limit = max(top_k * 2, top_k)
        query_text = f"{target_code} {question}" if target_code else question
        hits = self.vector_store.query(query_text, n_results=hit_limit)

        filtered_hits: List[Dict] = []
        seen = set()
        seen_documents = set()

        for hit in hits:
            distance = hit.get("distance")
            if distance is not None and distance > self.settings.max_distance:
                continue

            metadata = hit.get("metadata", {})
            document_text = hit.get("document", "")

            if target_code:
                equipment_text = " ".join(
                    [
                        str(metadata.get("equipment_codes", "")),
                        str(metadata.get("meta_equipements", "")),
                        str(metadata.get("meta_equipment_codes", "")),
                        document_text,
                    ]
                ).upper()
                if target_code not in equipment_text:
                    continue

            raw_chunk_index = metadata.get("chunk_index", -1)
            try:
                chunk_index = int(raw_chunk_index)
            except (TypeError, ValueError):
                chunk_index = -1

            unique_key = (str(metadata.get("source_file", "")), chunk_index)
            if unique_key in seen:
                continue
            seen.add(unique_key)

            document_key = self._to_snippet(document_text, max_chars=180).lower()
            if document_key in seen_documents:
                continue
            seen_documents.add(document_key)

            filtered_hits.append(hit)
            if len(filtered_hits) >= top_k:
                break

        logger.info(
            "AI retrieval timing equipmentCode=%s requestedHits=%s acceptedHits=%s effectiveTopK=%s fastMode=%s",
            target_code or "-",
            len(hits),
            len(filtered_hits),
            top_k,
            self.settings.fast_mode,
        )
        return filtered_hits

    def _build_qa_prompt(self, question: str, sources: List[Dict], equipment_code: Optional[str]) -> str:
        context = self._build_context(sources)
        equipment_hint = f"Equipement cible: {equipment_code}\n" if equipment_code else ""

        return (
            SHORT_RESPONSE_INSTRUCTION +
            "Assistant maintenance GMAO. Utilise uniquement le contexte.\n"
            "Si le contexte est insuffisant, reponds exactement:\n"
            f"\"{NO_INFO_MESSAGE}\"\n"
            "N'invente rien. Markdown uniquement, tres concis:\n"
            "### Diagnostic probable\n"
            "### Causes possibles\n"
            "### Actions recommandées\n"
            "### Pièces recommandées\n"
            "### Documents utilisés\n"
            "Une phrase de diagnostic, 2 causes maximum, 3 actions maximum.\n"
            f"{equipment_hint}"
            f"Contexte:\n{context}\n\n"
            f"Question: {question}\n\n"
            "Reponse finale:"
        )

    def _build_diagnosis_prompt(self, equipment_code: str, breakdown_description: str, sources: List[Dict]) -> str:
        context = self._build_context(sources)
        overheating_hint = ""
        if self._is_motor_overheating(breakdown_description=breakdown_description, sources=sources):
            overheating_hint = (
                "Si c'est une surchauffe moteur, inclure des actions explicites sur:\n"
                "- ventilation moteur\n"
                "- controle temperature\n"
                "- nettoyage grilles d'aeration\n"
                "- verification capteur temperature\n"
                "- controle charge mecanique\n"
            )

        return (
            SHORT_RESPONSE_INSTRUCTION +
            "Assistant diagnostic maintenance. Utilise uniquement les extraits.\n"
            "Si les extraits sont insuffisants, retourne exactement:\n"
            f'{{"diagnosis":"{NO_INFO_MESSAGE}","recommendedActions":[]}}\n'
            'JSON strict seulement: {"diagnosis": string, "recommendedActions": string[]}.\n'
            "Dans diagnosis, mentionne: Diagnostic probable, Causes possibles, Niveau de risque.\n"
            "Actions: 3 phrases courtes et concretes maximum.\n\n"
            f"Code equipement: {equipment_code}\n"
            f"Description de panne: {breakdown_description}\n\n"
            f"Contexte:\n{context}\n\n"
            f"{overheating_hint}"
        )

    def _format_structured_ask_answer(
        self,
        answer: str,
        question: str,
        sources: List[Dict],
        equipment_code: Optional[str],
    ) -> str:
        diagnosis = self._extract_diagnosis_text(answer)
        causes, extracted_actions, pieces = self._extract_operational_items_from_sources(question=question, sources=sources)
        documents = self._extract_source_document_names(sources)

        actions = self._normalize_actions(extracted_actions)
        if len(actions) < 3:
            actions = self._normalize_actions(actions + self._extract_action_candidates_from_sources(sources))
        if len(actions) < 3:
            actions = self._normalize_actions(actions + self._generic_actions_from_sources(sources))

        overheating_case = self._is_motor_overheating(
            breakdown_description=f"{equipment_code or ''} {question}".strip(),
            sources=sources,
        )
        if overheating_case:
            diagnosis = self._fallback_diagnosis(
                breakdown_description=f"{equipment_code or ''} {question}".strip(),
                sources=sources,
            )
            causes = self._build_surchauffe_causes_from_sources(sources)
            actions = self._normalize_actions([action for _, action in SURCHAUFFE_ACTION_RULES] + actions)

        causes = self._sanitize_causes(causes)
        actions = self._clean_action_list(actions)

        if len(actions) < 3 and causes:
            cause_actions = [f"Vérifier le point suivant: {cause.rstrip('.')}. " for cause in causes[:3]]
            actions = self._clean_action_list(self._normalize_actions(actions + cause_actions))

        if not diagnosis or self._is_vague_diagnosis(diagnosis) or self._looks_like_instruction_text(diagnosis):
            diagnosis = self._build_diagnosis_from_causes(causes)
            if not diagnosis:
                diagnosis = self._fallback_diagnosis(
                    breakdown_description=f"{equipment_code or ''} {question}".strip(),
                    sources=sources,
                )

        if not causes:
            causes = [UNKNOWN_CAUSES_MESSAGE]
        if not actions:
            actions = ["Vérifier les éléments mentionnés dans les extraits documentaires disponibles."]

        pieces = self._dedupe_preserve_order(pieces)[:2]

        cause_lines = [f"- {cause}" for cause in causes[:2]]
        action_lines = [f"{idx}. {item}" for idx, item in enumerate(actions[:3], start=1)]
        document_lines = [f"- {doc}" for doc in documents[:3]]
        pieces_block = NO_PIECE_MESSAGE if not pieces else "\n".join(f"- {piece}" for piece in pieces)

        return (
            "### Diagnostic probable\n"
            f"{diagnosis}\n\n"
            "### Causes possibles\n"
            f"{chr(10).join(cause_lines)}\n\n"
            "### Actions recommandées\n"
            f"{chr(10).join(action_lines)}\n\n"
            "### Pièces recommandées\n"
            f"{pieces_block}\n\n"
            "### Documents utilisés\n"
            f"{chr(10).join(document_lines)}"
        )

    def _extract_diagnosis_text(self, answer: str) -> str:
        clean = answer.replace("\r\n", "\n").strip()
        if not clean:
            return ""

        section_match = re.search(
            r"(?is)(?:^|\n)\s*#{1,3}\s*Diagnostic probable\s*:?\s*\n(?P<body>.*?)(?=\n\s*#{1,3}\s*Causes possibles|\Z)",
            clean,
        )
        candidate = section_match.group("body").strip() if section_match else clean

        for marker in (
            "### Causes possibles",
            "Causes possibles",
            "### Actions recommandées",
            "Actions recommandées",
            "### Pièces recommandées",
            "Pièces recommandées",
            "### Documents utilisés",
            "Documents utilisés",
        ):
            if marker in candidate:
                candidate = candidate.split(marker, 1)[0].strip()

        candidate = re.sub(r"^Diagnostic probable\s*:?\s*", "", candidate, flags=re.IGNORECASE).strip()
        candidate = self._clean_text(candidate)
        if not candidate:
            return ""

        sentences = re.split(r"(?<=[\.\!\?])\s+", candidate)
        diagnosis = " ".join(sentences[:2]).strip()
        return diagnosis[:260].rstrip()

    def _extract_operational_items_from_sources(self, question: str, sources: List[Dict]) -> Tuple[List[str], List[str], List[str]]:
        causes: List[str] = []
        actions: List[str] = []
        pieces: List[str] = []

        cause_keywords = (
            "cause",
            "defaut",
            "usure",
            "surcharge",
            "fuite",
            "derive",
            "encrassement",
            "desalignement",
            "lubrification",
            "cavitation",
            "patinage",
            "temperature",
            "surchauffe",
        )

        lines: List[str] = []
        for source in sources:
            text = str(source.get("document", ""))
            lines.extend([line.strip() for line in text.splitlines() if line.strip()])

        for raw_line in lines:
            candidate = re.sub(r"^[\-\*\d\.\)\( ]+", "", raw_line).strip()
            if len(candidate) < 8 or candidate.startswith("#"):
                continue

            normalized_candidate = re.sub(r"\s+", " ", candidate).strip()
            normalized_candidate_low = self._normalize_for_search(normalized_candidate)

            if (
                any(keyword in normalized_candidate_low for keyword in cause_keywords)
                and not self._is_unusable_cause_line(normalized_candidate, normalized_candidate_low)
                and not self._line_starts_with_action_verb(normalized_candidate_low)
            ):
                causes.append(self._ensure_sentence(normalized_candidate))

            if self._line_starts_with_action_verb(normalized_candidate_low):
                actions.append(self._ensure_sentence(normalized_candidate))

            piece_codes = re.findall(r"\bSP-\d+\b", normalized_candidate.upper())
            if piece_codes:
                detailed_piece = re.search(r"\b(SP-\d+)\b\s*[-–]\s*(.+)", normalized_candidate, re.IGNORECASE)
                if detailed_piece:
                    pieces.append(f"{detailed_piece.group(1).upper()} - {detailed_piece.group(2).strip().rstrip('.')}.")
                else:
                    for code in piece_codes:
                        pieces.append(f"{code.upper()}.")

        if self._is_motor_overheating(breakdown_description=question, sources=sources):
            actions.extend([action for _, action in SURCHAUFFE_ACTION_RULES])
            causes.extend(self._build_surchauffe_causes_from_sources(sources))

        source_blob_upper = self._sources_blob(sources).upper()
        if not pieces and "SP-" in source_blob_upper:
            for code in re.findall(r"\bSP-\d+\b", source_blob_upper):
                pieces.append(f"{code.upper()}.")

        return (
            self._dedupe_preserve_order(causes),
            self._dedupe_preserve_order(self._normalize_actions(actions)),
            self._dedupe_preserve_order(pieces),
        )

    def _build_actions_from_sources(
        self,
        breakdown_description: str,
        sources: List[Dict],
        model_actions: List[str],
    ) -> List[str]:
        source_blob = self._sources_blob(sources)
        actions: List[str] = []

        if self._is_motor_overheating(breakdown_description=breakdown_description, sources=sources):
            actions.extend([action for _, action in SURCHAUFFE_ACTION_RULES])

        actions.extend(self._extract_action_candidates_from_sources(sources))
        actions.extend(self._generic_actions_from_sources(sources))
        actions.extend(self._filter_model_actions(model_actions=model_actions, source_blob=source_blob))
        actions = self._clean_action_list(self._normalize_actions(actions))

        if len(actions) < 3:
            causes, _, _ = self._extract_operational_items_from_sources(question=breakdown_description, sources=sources)
            actions.extend([f"Vérifier le point suivant: {cause.rstrip('.')}." for cause in causes[:3]])
            actions = self._clean_action_list(self._normalize_actions(actions))

        return actions[:3]

    def _extract_action_candidates_from_sources(self, sources: List[Dict]) -> List[str]:
        candidates: List[str] = []
        for source in sources:
            text = str(source.get("document", ""))
            for raw_line in text.splitlines():
                line = raw_line.strip(" -\t")
                if len(line) < 10 or line.startswith("#"):
                    continue
                line_low = self._normalize_for_search(line)
                if not self._line_starts_with_action_verb(line_low):
                    continue
                candidates.append(self._ensure_sentence(line))
        return candidates

    def _generic_actions_from_sources(self, sources: List[Dict]) -> List[str]:
        source_blob = self._sources_blob(sources)
        generic_rules = [
            (("temperature", "thermique"), "Contrôler la température de fonctionnement."),
            (("ventilation", "ventilateur", "ailettes", "refroidissement"), "Vérifier la ventilation moteur."),
            (("capteur", "mesure redondante"), "Vérifier la cohérence du capteur de température."),
            (("charge", "surcharge", "point dur"), "Contrôler la charge mécanique et les points durs."),
            (("lubrification", "roulement"), "Vérifier la lubrification et l’état des roulements."),
            (("alignement", "convoyeur", "bande"), "Contrôler l’alignement et la tension de la bande."),
        ]
        actions: List[str] = []
        for keywords, action in generic_rules:
            if any(keyword in source_blob for keyword in keywords):
                actions.append(action)
        return actions

    def _build_surchauffe_causes_from_sources(self, sources: List[Dict]) -> List[str]:
        source_blob = self._sources_blob(sources)
        causes: List[str] = []
        for keywords, cause in SURCHAUFFE_CAUSE_RULES:
            if any(keyword in source_blob for keyword in keywords):
                causes.append(cause)
        return self._dedupe_preserve_order(causes)

    def _sanitize_causes(self, causes: List[str]) -> List[str]:
        cleaned = [
            self._ensure_sentence(cause)
            for cause in causes
            if not self._is_unusable_cause_line(cause, self._normalize_for_search(cause))
            and not self._line_starts_with_action_verb(self._normalize_for_search(cause))
        ]
        return self._dedupe_preserve_order(cleaned)

    def _normalize_actions(self, raw_actions: Any) -> List[str]:
        if isinstance(raw_actions, list):
            candidates = [str(item).strip() for item in raw_actions if str(item).strip()]
        elif isinstance(raw_actions, str):
            split_items = re.split(r"[\n;]+", raw_actions)
            candidates = [item.strip(" -*\t") for item in split_items if item.strip()]
        else:
            candidates = []

        normalized: List[str] = []
        seen = set()
        for action in candidates:
            action = re.sub(r"\s+", " ", action).strip()
            action = re.sub(r"^[\-\*\d\.\)\( ]+", "", action).strip()
            if len(action) < 6:
                continue
            if not action.endswith("."):
                action = f"{action}."
            action = action[0].upper() + action[1:]
            dedupe_key = self._normalize_for_search(action)
            if dedupe_key in seen:
                continue
            seen.add(dedupe_key)
            normalized.append(action)
        return normalized

    def _filter_model_actions(self, model_actions: List[str], source_blob: str) -> List[str]:
        filtered: List[str] = []
        source_blob_normalized = self._normalize_for_search(source_blob)
        for action in model_actions:
            normalized = self._normalize_for_search(action)
            if not self._line_starts_with_action_verb(normalized):
                continue
            if not any(term in normalized and term in source_blob_normalized for term in ALLOWED_ACTION_TERMS):
                continue
            filtered.append(action)
        return filtered

    def _fallback_diagnosis(self, breakdown_description: str, sources: List[Dict]) -> str:
        if self._is_motor_overheating(breakdown_description=breakdown_description, sources=sources):
            return (
                "Le symptôme décrit correspond à une surchauffe moteur probablement liée à une ventilation "
                "insuffisante, une dérive du capteur de température ou une charge mécanique excessive."
            )

        snippet = self._to_snippet(sources[0].get("document", ""), max_chars=220)
        if snippet:
            return f"Les extraits documentaires indiquent un dysfonctionnement probable lié à: {snippet}"
        return NO_INFO_MESSAGE

    def _build_diagnosis_from_causes(self, causes: List[str]) -> str:
        if not causes:
            return ""
        selected = [cause.rstrip(".") for cause in causes[:3] if cause.strip()]
        if not selected:
            return ""
        if len(selected) == 1:
            return f"Les extraits documentaires indiquent principalement: {selected[0]}."
        if len(selected) == 2:
            return f"Les extraits documentaires indiquent principalement: {selected[0]} et {selected[1]}."
        return (
            "Les extraits documentaires indiquent principalement: "
            f"{selected[0]}, {selected[1]} et {selected[2]}."
        )

    def _is_motor_overheating(self, breakdown_description: str, sources: List[Dict]) -> bool:
        breakdown = self._normalize_for_search(breakdown_description)
        source_blob = self._normalize_for_search(self._sources_blob(sources))
        text = f"{breakdown} {source_blob}"
        return any(
            keyword in text
            for keyword in ("surchauffe", "moteur chauffe", "temperature moteur", "alarme de temperature")
        )

    def _is_vague_diagnosis(self, diagnosis: str) -> bool:
        normalized = self._normalize_for_search(diagnosis)
        vague_patterns = (
            "le dispositif cible",
            "l'equipement cible",
            "information generale",
            "il est recommande de consulter",
            "il semble que",
            "il pourrait etre utile",
            "pas de detail specifique",
            "bien qu'il n'y ait pas",
            "en l'absence d",
        )
        return any(pattern in normalized for pattern in vague_patterns)

    def _is_unusable_cause_line(self, original: str, normalized: str) -> bool:
        if "?" in original:
            return True
        if normalized.startswith(("'", "\"", "`")):
            return True
        blocked_fragments = (
            "failure_mode=",
            "spare_parts=",
            "quelles pieces",
            "etapes de diagnostic",
            "documents utilises",
            "question:",
        )
        return any(fragment in normalized for fragment in blocked_fragments)

    def _looks_like_instruction_text(self, value: str) -> bool:
        normalized = self._normalize_for_search(value)
        instruction_patterns = (
            "paragraphe court",
            "phrase complete",
            "respecte strictement",
            "format markdown",
            "3 a 6 actions",
            "2 a 5 causes",
            "liste les pieces",
        )
        return any(pattern in normalized for pattern in instruction_patterns)

    def _clean_action_list(self, actions: List[str]) -> List[str]:
        filtered = [action for action in actions if not self._is_incomplete_action(action)]
        result: List[str] = []
        normalized_items: List[str] = []

        for action in filtered:
            normalized = self._normalize_for_search(action).rstrip(".")
            if not normalized:
                continue

            replaced = False
            for index, existing in enumerate(normalized_items):
                if normalized.startswith(existing) and len(normalized) > len(existing):
                    result[index] = action
                    normalized_items[index] = normalized
                    replaced = True
                    break
                if existing.startswith(normalized):
                    replaced = True
                    break

            if replaced:
                continue

            result.append(action)
            normalized_items.append(normalized)

        return result

    def _is_incomplete_action(self, action: str) -> bool:
        normalized = self._normalize_for_search(action).strip()
        if len(normalized) < 8:
            return True
        if self._looks_like_instruction_text(normalized):
            return True

        incomplete_endings = (
            " et les.",
            " et la.",
            " et le.",
            " et l'.",
            " avec.",
            " ou.",
            " de la.",
            " de l'.",
            " des.",
            " du.",
        )
        return any(normalized.endswith(ending) for ending in incomplete_endings)

    def _sources_blob(self, sources: List[Dict]) -> str:
        parts: List[str] = []
        for source in sources:
            parts.append(str(source.get("document", "")).lower())
            parts.append(str(source.get("metadata", {})).lower())
        return " ".join(parts)

    def _effective_top_k(self) -> int:
        configured_top_k = max(1, int(self.settings.top_k))
        return min(configured_top_k, 3)

    def _context_snippet_chars(self) -> int:
        fast_cap = 320 if self.settings.fast_mode else 500
        return max(220, min(int(self.settings.max_chunk_chars), fast_cap))

    def _ollama_num_predict(self) -> int:
        value = self.settings.ollama_fast_num_predict if self.settings.fast_mode else self.settings.ollama_num_predict
        return max(32, int(value))

    @staticmethod
    def _elapsed_ms(started_at: float) -> float:
        return (perf_counter() - started_at) * 1000

    def _build_context(self, sources: List[Dict]) -> str:
        blocks: List[str] = []
        snippet_chars = self._context_snippet_chars()
        for idx, hit in enumerate(sources, start=1):
            snippet = self._to_snippet(hit.get("document", ""), max_chars=snippet_chars)
            blocks.append(f"[{idx}] {snippet}")
        return "\n\n".join(blocks)

    def _format_sources(self, sources: List[Dict]) -> List[Dict[str, str]]:
        return [
            {
                "file": str(hit.get("metadata", {}).get("source_file", "inconnu")),
                "snippet": self._to_snippet(hit.get("document", ""), max_chars=260),
            }
            for hit in sources
        ]

    @staticmethod
    def _to_snippet(text: str, max_chars: int) -> str:
        normalized = re.sub(r"\s+", " ", text).strip()
        if len(normalized) <= max_chars:
            return normalized
        return normalized[: max_chars - 3].rstrip() + "..."

    @staticmethod
    def _extract_source_document_names(sources: List[Dict]) -> List[str]:
        names: List[str] = []
        seen = set()
        for source in sources:
            file_name = str(source.get("metadata", {}).get("source_file", "inconnu")).strip()
            if not file_name:
                continue
            key = file_name.lower()
            if key in seen:
                continue
            seen.add(key)
            names.append(file_name)
        return names if names else ["inconnu"]

    @staticmethod
    def _dedupe_preserve_order(items: List[str]) -> List[str]:
        result: List[str] = []
        seen = set()
        for item in items:
            value = item.strip()
            if not value:
                continue
            key = value.lower()
            if key in seen:
                continue
            seen.add(key)
            result.append(value)
        return result

    @staticmethod
    def _clean_text(text: str) -> str:
        return re.sub(r"\s+", " ", text).strip()

    @staticmethod
    def _ensure_sentence(text: str) -> str:
        clean = re.sub(r"\s+", " ", text).strip()
        if clean.endswith("."):
            return clean
        return f"{clean}."

    def _contains_no_info(self, value: str) -> bool:
        return self._normalize_for_search(NO_INFO_MESSAGE) in self._normalize_for_search(value)

    @staticmethod
    def _normalize_for_search(text: str) -> str:
        lowered = text.lower()
        replacements = {
            "é": "e",
            "è": "e",
            "ê": "e",
            "ë": "e",
            "à": "a",
            "â": "a",
            "ä": "a",
            "î": "i",
            "ï": "i",
            "ô": "o",
            "ö": "o",
            "ù": "u",
            "û": "u",
            "ü": "u",
            "ç": "c",
            "œ": "oe",
            "’": "'",
        }
        for source, target in replacements.items():
            lowered = lowered.replace(source, target)
        return lowered

    @staticmethod
    def _line_starts_with_action_verb(line: str) -> bool:
        stripped = re.sub(r"^[\-\*\d\.\)\( ]+", "", line).strip()
        return any(stripped.startswith(verb) for verb in ACTION_VERB_HINTS)

    def _generate_with_ollama(self, prompt: str, force_json: bool = False) -> str:
        url = f"{self.settings.ollama_url.rstrip('/')}/api/generate"
        payload: Dict[str, object] = {
            "model": self.settings.ollama_model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": self.settings.ollama_keep_alive,
            "options": {
                "num_predict": self._ollama_num_predict(),
                "temperature": self.settings.ollama_temperature,
                "top_p": self.settings.ollama_top_p,
            },
        }
        if force_json:
            payload["format"] = "json"

        started_at = perf_counter()
        try:
            response = requests.post(url, json=payload, timeout=self.settings.ollama_timeout_seconds)
            response.raise_for_status()
        except requests.RequestException as exc:
            logger.info(
                "AI Ollama timing status=error forceJson=%s promptChars=%s numPredict=%s topP=%.2f totalMs=%.1f",
                force_json,
                len(prompt),
                self._ollama_num_predict(),
                self.settings.ollama_top_p,
                self._elapsed_ms(started_at),
            )
            raise RuntimeError(f"Ollama indisponible: {exc}") from exc

        data = response.json()
        response_text = str(data.get("response", "")).strip()
        logger.info(
            "AI Ollama timing status=success forceJson=%s promptChars=%s responseChars=%s numPredict=%s topP=%.2f totalMs=%.1f ollamaTotalDurationMs=%.1f",
            force_json,
            len(prompt),
            len(response_text),
            self._ollama_num_predict(),
            self.settings.ollama_top_p,
            self._elapsed_ms(started_at),
            float(data.get("total_duration", 0) or 0) / 1_000_000,
        )
        return response_text

    @staticmethod
    def _parse_json_object(text: str) -> Optional[Dict]:
        if not text:
            return None

        try:
            payload = json.loads(text)
            return payload if isinstance(payload, dict) else None
        except json.JSONDecodeError:
            pass

        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            return None

        try:
            payload = json.loads(match.group(0))
            return payload if isinstance(payload, dict) else None
        except json.JSONDecodeError:
            return None
