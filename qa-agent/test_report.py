"""Deterministic offline tests for the QA report aggregator."""
import json
from pathlib import Path
import tempfile
import unittest

from report import load_reports, summarize


class QAReportTests(unittest.TestCase):
    def test_newest_first_and_unverified_results_are_not_confirmed_bugs(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            for stamp, status, duration in [
                ("20261104T110000Z", "RELATO_NAO_VALIDADO", 12.5),
                ("20261104T120000Z", "BLOQUEADO", 7.5),
            ]:
                (directory / f"{stamp}.json").write_text(
                    json.dumps({
                        "schema_version": 1,
                        "timestamp_utc": stamp,
                        "scenario": "rpg-orbit",
                        "status": status,
                        "duration_seconds": duration,
                        "report_file": f"{stamp}.md",
                    }),
                    encoding="utf-8",
                )
            rows = load_reports(directory)
            self.assertEqual(rows[0]["status"], "BLOQUEADO")
            self.assertEqual(len(rows), 2)
            result = summarize(rows)
            self.assertEqual(result["executions"], 2)
            self.assertEqual(result["blocked"], 1)
            self.assertEqual(result["exploratory_unverified"], 1)
            self.assertEqual(result["total_duration_seconds"], 20)
            self.assertEqual(result["average_duration_seconds"], 10)
            self.assertIsNone(result["confirmed_bugs"])
            self.assertIsNone(result["cost_usd"])

    def test_missing_folder_and_invalid_metadata_are_ignored(self):
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            self.assertEqual(load_reports(directory / "missing"), [])
            (directory / "bad.json").write_text("not JSON", encoding="utf-8")
            (directory / "unsupported.json").write_text(
                json.dumps({"schema_version": 4, "status": "PASSOU"}),
                encoding="utf-8",
            )
            self.assertEqual(load_reports(directory), [])
            self.assertEqual(summarize([])["executions"], 0)


if __name__ == "__main__":
    unittest.main()
