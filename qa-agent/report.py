"""Summarize local Nova Wing agent QA runs without requiring an LLM or API key.

A successful agent run is NOT a confirmed bug or a passed deterministic test.
Metadata contains no inferred token counts, prices or quality metrics.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

DEFAULT_FOLDER = Path(__file__).resolve().parents[1] / "artifacts" / "agent-qa"


def load_reports(folder: Path) -> list[dict]:
    records = []
    if not folder.exists():
        return records
    for path in folder.glob("*.json"):
        try:
            record = json.loads(path.read_text(encoding="utf-8"))
            if record.get("schema_version") != 1 or not record.get("timestamp_utc"):
                raise ValueError("metadata schema missing or unsupported")
            if record.get("status") not in ("BLOQUEADO", "RELATO_NAO_VALIDADO"):
                raise ValueError("invalid or unverified status")
            record["metadata_file"] = path.name
            records.append(record)
        except (OSError, ValueError, TypeError, AttributeError) as exc:
            print(f"Ignorando {path.name}: {exc}", file=sys.stderr)
    return sorted(records, key=lambda item: (item["timestamp_utc"], item["metadata_file"]), reverse=True)


def summarize(records: list[dict]) -> dict:
    seconds = [float(item["duration_seconds"]) for item in records
               if isinstance(item.get("duration_seconds"), (float, int))]
    return {
        "executions": len(records),
        "blocked": sum(item["status"] == "BLOQUEADO" for item in records),
        "exploratory_unverified": sum(
            item["status"] == "RELATO_NAO_VALIDADO" for item in records
        ),
        "total_duration_seconds": round(sum(seconds), 1),
        "average_duration_seconds": round(sum(seconds) / len(seconds), 1)
        if seconds else None,
        "confirmed_bugs": None,
        "tokens_actual": None,
        "cost_usd": None,
        "note": "Relatos nao homologados; custo, tokens e bugs confirmados nao medidos.",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Consolida resultados do QA agente Nova Wing")
    parser.add_argument("--directory", type=Path, default=DEFAULT_FOLDER)
    parser.add_argument("--latest", type=int, default=10)
    parser.add_argument("--json", action="store_true", help="Saida JSON para dashboard")
    args = parser.parse_args()
    if args.latest < 1:
        parser.error("--latest deve ser >= 1")
    rows = load_reports(args.directory)[:args.latest]
    metrics = summarize(rows)
    if args.json:
        print(json.dumps({"metrics": metrics, "runs": rows}, ensure_ascii=False, indent=2))
        return
    print(f"Nova Wing QA exploratorio | {args.directory}")
    print(f"Execucoes: {metrics['executions']} | Bloqueados: {metrics['blocked']} | "
          f"Relatos sem homologacao: {metrics['exploratory_unverified']}")
    print(f"Tempo total: {metrics['total_duration_seconds']}s | "
          f"Tempo medio: {metrics['average_duration_seconds']}s")
    if not rows:
        print("Nenhum arquivo JSON encontrado. Execute qa-agent/run.py primeiro.")
        return
    print("Data (UTC)       Cenario        Estado               Tempo(s)  Relatorio")
    for item in rows:
        print(
            f"{str(item['timestamp_utc']):16} "
            f"{str(item.get('scenario', '')):14} "
            f"{item['status']:20} "
            f"{str(item.get('duration_seconds', '?')):9} "
            f"{item.get('report_file', '?')}"
        )
    print(metrics["note"])


if __name__ == "__main__":
    main()
