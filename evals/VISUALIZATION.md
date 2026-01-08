# Eval Metrics Visualization Guide

> How to visualize and track Orchestrator Agent evaluation metrics

## Quick Start - View Current Results

### Option 1: Local HTML Reports (Recommended for Development)

**Generate and view HTML report:**

```bash
# Run evals with HTML report
./run_evals_with_report.sh

# Open the latest report in your browser
google-chrome reports/eval_report_*.html  # Linux
# or
open reports/eval_report_*.html  # macOS
# or
start reports/eval_report_*.html  # Windows
```

**What you'll see:**
- ✅/❌ Test results with pass/fail status
- 📊 Metric scores vs thresholds
- 📝 Detailed failure reasons
- ⏱️ Execution timeline
- 📋 Test metadata

### Option 2: Terminal Output with Rich Formatting

**Run with verbose output:**

```bash
python3 -m pytest test_cases/orchestrator/ -v --tb=long
```

**Example output:**
```
test_s1_blocks_plan_without_cd_init FAILED
  Gate Enforcement (score: 0.0, threshold: 0.9)
    ❌ Missing ⛔ blocking emoji
    ❌ Missing clear blocking language
    ❌ Response indicates action was taken
    ❌ Explanation too brief
    ❌ No suggested next step
```

---

## Option 3: Confident AI Cloud Dashboard (Production/Team Use)

### Setup (One-time)

1. **Sign up** at https://app.confident-ai.com
2. **Get API key** from dashboard settings
3. **Authenticate:**

```bash
# Method 1: Environment variable (recommended)
export CONFIDENT_API_KEY="your-api-key-here"

# Method 2: CLI login
deepeval login --api-key your-api-key-here
```

4. **Enable in pytest.ini:**

```ini
# Uncomment this line in pytest.ini:
addopts = -v --tb=short --confident-ai
```

### Run with Cloud Tracking

```bash
# Run evals and send results to Confident AI
python3 -m pytest test_cases/orchestrator/ -v
```

**Dashboard Features:**
- 📈 Metric trends over time
- 🔄 A/B test comparisons
- 📊 Historical test runs
- 👥 Team collaboration
- 🚨 Regression detection
- 📧 Email alerts on failures

### View Results

Visit: https://app.confident-ai.com/evals

---

## Tracking Progress Over Time

### Local CSV Tracking (Simple)

Create a script to log metrics to CSV:

```bash
# Create tracking script
cat > track_metrics.py << 'EOF'
import csv
from datetime import datetime

def log_metrics(metrics_dict):
    """Log metrics to CSV for tracking over time."""
    with open('reports/metrics_history.csv', 'a', newline='') as f:
        writer = csv.writer(f)

        # Write header if file is empty
        if f.tell() == 0:
            writer.writerow(['timestamp', 'metric_name', 'score', 'threshold', 'passed'])

        # Write metrics
        timestamp = datetime.now().isoformat()
        for name, data in metrics_dict.items():
            writer.writerow([
                timestamp,
                name,
                data['score'],
                data['threshold'],
                data['passed']
            ])

# Example usage:
log_metrics({
    'Gate Enforcement': {'score': 0.0, 'threshold': 0.9, 'passed': False},
    'Route Accuracy': {'score': 0.0, 'threshold': 0.95, 'passed': False},
    # ...
})
EOF
```

### Visualize Trends

```python
import pandas as pd
import matplotlib.pyplot as plt

# Load metrics history
df = pd.read_csv('reports/metrics_history.csv')
df['timestamp'] = pd.to_datetime(df['timestamp'])

# Plot metric trends
for metric in df['metric_name'].unique():
    metric_data = df[df['metric_name'] == metric]
    plt.plot(metric_data['timestamp'], metric_data['score'], label=metric)

plt.axhline(y=0.9, color='r', linestyle='--', label='Target (90%)')
plt.legend()
plt.title('Eval Metrics Over Time')
plt.xlabel('Date')
plt.ylabel('Score')
plt.savefig('reports/metrics_trend.png')
```

---

## Current Baseline (Pre-Implementation)

Run and view current failing state:

```bash
# Generate baseline report
./run_evals_with_report.sh

# Open report to see baseline metrics
```

**Expected Results (all failing):**

| Metric | Current Score | Threshold | Status |
|--------|---------------|-----------|--------|
| Gate Enforcement | 0.0 | 0.9 | ❌ FAIL |
| Route Accuracy | 0.0 | 0.95 | ❌ FAIL |
| Blocking Message Quality | 0.25 | 0.85 | ❌ FAIL |
| State File Correctness | 0.0 | 0.95 | ❌ FAIL |

---

## Comparing Before/After Agent Implementation

### 1. Save Baseline Report

```bash
# Rename current report
mv reports/eval_report_*.html reports/baseline_before_implementation.html
```

### 2. After Implementing Agent

```bash
# Generate new report
./run_evals_with_report.sh

# Compare with baseline
# (Open both reports in browser tabs)
```

### 3. View Improvement

The HTML reports show:
- Side-by-side metric comparisons
- Which metrics improved
- Which tests started passing
- Detailed failure → success transitions

---

## Recommended Workflow

### Daily Development Loop

```bash
# 1. Implement agent behavior
vim .claude/agents/orchestrator.md

# 2. Run evals with report
./run_evals_with_report.sh

# 3. Open HTML report
google-chrome reports/eval_report_*.html

# 4. Check which metrics improved
# 5. Iterate on agent implementation
```

### Weekly Progress Review

```bash
# 1. Run full eval suite
python3 -m pytest test_cases/ -v --html=reports/weekly_report.html --self-contained-html

# 2. Review trend
# Compare this week's report with last week's

# 3. Share with team
# HTML reports are self-contained - can be sent via email/Slack
```

---

## Advanced Visualization (Optional)

### Custom Dashboard with Streamlit

```python
# dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px

st.title('Orchestrator Agent Eval Dashboard')

# Load latest test results
df = pd.read_csv('reports/metrics_history.csv')

# Metric trends
fig = px.line(df, x='timestamp', y='score', color='metric_name')
st.plotly_chart(fig)

# Pass/Fail summary
pass_rate = df.groupby('metric_name')['passed'].mean()
st.bar_chart(pass_rate)
```

Run: `streamlit run dashboard.py`

---

## CI/CD Integration (Future)

When evals run in CI, artifacts can be:

```yaml
# .github/workflows/evals.yml
- name: Upload eval reports
  uses: actions/upload-artifact@v3
  with:
    name: eval-reports
    path: evals/reports/*.html

- name: Comment PR with results
  uses: daun/pytest-report-action@v1
  with:
    report-path: evals/reports/eval_report_*.html
```

---

## Troubleshooting

### HTML Report Not Generating

```bash
# Ensure pytest-html is installed
python3 -m pip install pytest-html

# Check pytest plugins
python3 -m pytest --version
# Should show: pytest-html-4.1.1
```

### Confident AI Not Uploading

```bash
# Verify API key
echo $CONFIDENT_API_KEY

# Test connection
deepeval test --help
```

---

## Summary

**For Local Development (Now):**
- ✅ Use `./run_evals_with_report.sh`
- ✅ Open HTML reports in browser
- ✅ Iterate quickly

**For Team/Production (Later):**
- Set up Confident AI dashboard
- Track metrics over time
- Enable CI/CD integration
- Share reports with stakeholders

**Current Status:**
- Baseline established (all tests failing)
- HTML report generation working
- Ready to implement agent and watch metrics improve!
