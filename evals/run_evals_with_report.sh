#!/bin/bash
# Run evals and generate HTML report

echo "Running Orchestrator evals with HTML report generation..."

# Run pytest with DeepEval and generate report
python3 -m pytest test_cases/orchestrator/test_initialization.py \
  -v \
  --html=reports/eval_report_$(date +%Y%m%d_%H%M%S).html \
  --self-contained-html \
  || true  # Don't fail script if tests fail (expected for now)

echo "Report generated in reports/ directory"
ls -lh reports/*.html | tail -1
