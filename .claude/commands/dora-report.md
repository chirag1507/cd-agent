# /dora-report - Display DORA Metrics Report

> Use this command to view current DORA metrics, trends, and performance band for your project.

## Rule Loading: Not Required

⚠️ **This command does NOT require rule loading.**

**Why:** The `/dora-report` command is for metrics reporting that:
- Reads .dora/ JSON files for metrics data
- Calculates performance bands and trends
- Displays dashboard with ASCII charts

**No application code generation** occurs, therefore no coding rules are needed.

---

## Purpose

Display real-time DORA metrics dashboard showing all 4 key metrics with:
- Current values and DORA performance band (Elite/High/Medium/Low)
- Trend indicators (improving/degrading/stable)
- Comparison to previous period
- Visual trend charts (ASCII)
- Actionable recommendations

## When to Use

- **Weekly standups**: Share metrics with team
- **Sprint reviews**: Show delivery performance improvements
- **Quarterly reviews**: Export metrics for stakeholder reports
- **After deployments**: Check impact on metrics
- **When investigating slowdowns**: Identify which metric degraded
- **Before demos**: Validate you're maintaining Elite band

## What This Command Does

The agent will:

1. **Read Current Data**:
   - Load `.dora/config.json` for settings
   - Read `.dora/deployments.json` for deployment history
   - Read `.dora/incidents.json` for incident data
   - Check for new data in `state/*.json` files

2. **Update Metrics** (if new data available):
   - Scan for new deployments since last calculation
   - Import new commits from git log
   - Refresh GitHub Actions data (if available)
   - Recalculate all 4 DORA metrics

3. **Calculate Trends**:
   - Compare current period vs previous period
   - Determine trend direction (↑ improving, ↓ degrading, → stable)
   - Calculate percentage change

4. **Display Report**:
   - Show all 4 metrics with current values
   - Display DORA band for each metric
   - Show ASCII trend charts
   - Provide improvement recommendations

5. **Optional Export**:
   - Export to JSON for programmatic access
   - Export to CSV for spreadsheet analysis
   - Generate markdown summary for documentation

## Output

### Default Report (30-day period)

```
╔════════════════════════════════════════════════════════════════╗
║                    DORA METRICS REPORT                          ║
║                   Period: Last 30 Days                          ║
║                   Updated: 2025-12-25 10:45                     ║
╚════════════════════════════════════════════════════════════════╝

┌────────────────────────────────────────────────────────────────┐
│ 1. Deployment Frequency                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Current:  1.8 deploys/day                    [Elite ✓]      │
│   Target:   > 1 deploy/day (Elite band)                       │
│   Trend:    ↑ +0.3 from previous period (+20%)                │
│                                                                │
│   Last 7 days:  ▁▂▃▄▅▆█ (increasing)                          │
│                                                                │
│   Breakdown:                                                   │
│     Production: 1.2 deploys/day                                │
│     UAT:        0.4 deploys/day                                │
│     QA:         0.2 deploys/day                                │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 2. Lead Time for Changes                                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Current:  42 minutes                         [Elite ✓]      │
│   Target:   < 1 hour (Elite band)                             │
│   Trend:    ↓ -8 minutes from previous period (-16%)          │
│                                                                │
│   Distribution:                                                │
│     p50 (median): 42 min                                       │
│     p75:          58 min                                       │
│     p95:          1.2 hours                                    │
│                                                                │
│   Slowest commit: abc123 (1.8 hours)                          │
│     Reason: Weekend merge, no one monitoring                  │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 3. Change Failure Rate                                         │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Current:  8.5%                               [Elite ✓]      │
│   Target:   < 15% (Elite band)                                │
│   Trend:    ↓ -2% from previous period (-19%)                 │
│                                                                │
│   Failed Deployments: 3 of 35 total                           │
│                                                                │
│   Recent Failures:                                             │
│     2025-12-20: Payment service timeout (hotfix: 15 min)      │
│     2025-12-18: Config typo in UAT (rollback: 8 min)          │
│     2025-12-15: Database migration issue (fix: 45 min)        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ 4. Mean Time to Restore Service (MTTR)                        │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Current:  24 minutes                         [Elite ✓]      │
│   Target:   < 1 hour (Elite band)                             │
│   Trend:    → stable (±2 minutes)                             │
│                                                                │
│   Incidents Resolved: 3                                        │
│     Fastest: 8 minutes (config rollback)                       │
│     Slowest: 45 minutes (database fix)                         │
│     Median:  24 minutes                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘

╔════════════════════════════════════════════════════════════════╗
║  🎉 Overall Performance: ELITE DORA Band                      ║
║                                                                 ║
║  All 4 metrics meet Elite band criteria!                      ║
║  You're in the top tier of software delivery performance.     ║
╚════════════════════════════════════════════════════════════════╝

📊 Trend Summary (vs Previous 30 Days):
  ✓ Deployment Frequency: Improving (+20%)
  ✓ Lead Time: Improving (-16%)
  ✓ Change Failure Rate: Improving (-19%)
  → MTTR: Stable

💡 Recommendations:
  • Continue current practices - all metrics in Elite band
  • Review weekend deployment process (1.8hr lead time outlier)
  • Document recent incident fixes for knowledge base
  • Consider increasing deployment frequency to 2+ per day

📈 Next Milestones:
  • Maintain Elite band for 3 consecutive months
  • Reduce p95 lead time to < 1 hour
  • Achieve 95%+ deployment success rate

─────────────────────────────────────────────────────────────────

Run '/dora-report --export report.csv' to export data
Run '/dora-report --period 7' for weekly metrics
Run '/dora-report --verbose' for detailed breakdown
```

### Compact Report

```bash
/dora-report --compact
```

```
DORA Metrics (Last 30 Days) - Updated 2025-12-25 10:45

  Deployment Frequency:  1.8/day    [Elite ✓] ↑ +20%
  Lead Time:             42 min     [Elite ✓] ↓ -16%
  Change Failure Rate:   8.5%       [Elite ✓] ↓ -19%
  MTTR:                  24 min     [Elite ✓] → stable

  Overall: ELITE DORA Band 🎉
```

### Export to JSON

```bash
/dora-report --export metrics.json
```

**`metrics.json`**:
```json
{
  "generated_at": "2025-12-25T10:45:00Z",
  "period": {
    "start": "2025-11-25T00:00:00Z",
    "end": "2025-12-25T23:59:59Z",
    "days": 30
  },
  "metrics": {
    "deployment_frequency": {
      "value": 1.8,
      "unit": "deploys_per_day",
      "band": "elite",
      "target": 1.0,
      "trend": {
        "direction": "improving",
        "change_percent": 20,
        "previous_value": 1.5
      },
      "breakdown": {
        "production": 1.2,
        "uat": 0.4,
        "qa": 0.2
      }
    },
    "lead_time": {
      "value": 42,
      "unit": "minutes",
      "band": "elite",
      "target": 60,
      "trend": {
        "direction": "improving",
        "change_percent": -16,
        "previous_value": 50
      },
      "percentiles": {
        "p50": 42,
        "p75": 58,
        "p95": 72
      }
    },
    "change_failure_rate": {
      "value": 0.085,
      "unit": "percentage",
      "band": "elite",
      "target": 0.15,
      "trend": {
        "direction": "improving",
        "change_percent": -19,
        "previous_value": 0.105
      },
      "failures": {
        "total_deployments": 35,
        "failed_deployments": 3,
        "recent": [
          {
            "date": "2025-12-20",
            "reason": "Payment service timeout",
            "resolution_time_minutes": 15
          }
        ]
      }
    },
    "mttr": {
      "value": 24,
      "unit": "minutes",
      "band": "elite",
      "target": 60,
      "trend": {
        "direction": "stable",
        "change_percent": 0,
        "previous_value": 22
      },
      "incidents": {
        "total": 3,
        "fastest": 8,
        "slowest": 45,
        "median": 24
      }
    }
  },
  "overall_band": "elite",
  "metrics_in_elite": 4,
  "metrics_in_high": 0,
  "metrics_in_medium": 0,
  "metrics_in_low": 0
}
```

### Export to CSV

```bash
/dora-report --export metrics.csv
```

**`metrics.csv`**:
```csv
Metric,Value,Unit,Band,Target,Trend,Change %,Previous Value
Deployment Frequency,1.8,deploys/day,elite,1.0,improving,20,1.5
Lead Time,42,minutes,elite,60,improving,-16,50
Change Failure Rate,8.5,%,elite,15,improving,-19,10.5
MTTR,24,minutes,elite,60,stable,0,22
```

## Usage Examples

### View Current Metrics

```bash
/dora-report
```

Default: 30-day period, full report with recommendations.

### Weekly Metrics

```bash
/dora-report --period 7
```

Show last 7 days (useful for sprint retrospectives).

### Quarterly Report

```bash
/dora-report --period 90
```

Show last 90 days (useful for quarterly reviews).

### Compact Summary

```bash
/dora-report --compact
```

One-line summary per metric (useful for terminal dashboards).

### Detailed Breakdown

```bash
/dora-report --verbose
```

Include:
- Individual deployment details
- All incident details
- Commit-by-commit lead times
- Full percentile distributions

### Force Recalculation

```bash
/dora-report --recalculate
```

Re-scan all data sources and recalculate from scratch.

### Export for Stakeholders

```bash
/dora-report --export quarterly-report.json --period 90
```

Generate exportable report for presentations.

### Specific Environment

```bash
/dora-report --environment production
```

Show metrics for production deployments only.

### Compare Periods

```bash
/dora-report --compare
```

Show side-by-side comparison of current vs previous period.

## Trend Indicators

### Direction Symbols

- **↑ Improving**: Metric is getting better
  - Deployment Frequency: Increasing
  - Lead Time: Decreasing
  - Change Failure Rate: Decreasing
  - MTTR: Decreasing

- **↓ Degrading**: Metric is getting worse
  - Deployment Frequency: Decreasing
  - Lead Time: Increasing
  - Change Failure Rate: Increasing
  - MTTR: Increasing

- **→ Stable**: Metric unchanged (< 5% change)

### Trend Calculation

```
Change % = ((Current - Previous) / Previous) * 100
```

Trend is "stable" if absolute change < 5%.

## ASCII Charts

### Deployment Frequency (7-day trend)

```
Days:     Mon  Tue  Wed  Thu  Fri  Sat  Sun
Deploys:   █    █    ▆    █    █    ▁    ▁
Count:     2    2    1    2    2    0    0
```

### Lead Time Distribution

```
  0-15m  ████████████████ 45%
 15-30m  ██████████ 28%
 30-60m  ████ 12%
  1-2h   ██ 8%
   2h+   █ 7%
```

## Recommendations Logic

The agent provides context-aware recommendations based on current metrics:

### Elite Band (All Metrics)

```
💡 Recommendations:
  • Excellent! Maintain current practices
  • Share your success story with other teams
  • Consider mentoring teams in lower bands
  • Document your practices for onboarding
```

### Mixed Performance

```
💡 Recommendations:
  • Deployment Frequency needs improvement (current: 0.3/day)
    → Reduce batch size: deploy smaller changes more often
    → Automate deployment approval process
    → Consider feature flags for gradual rollout

  • Lead Time is Elite - great job! (current: 35 min)
    → Maintain current CI/CD pipeline efficiency

  • Change Failure Rate needs improvement (current: 22%)
    → Increase test coverage (current: 68%, target: 90%+)
    → Add smoke tests to deployment pipeline
    → Review recent failures for patterns
```

### Degrading Trends

```
⚠️  Warning: Multiple metrics degrading

  • Deployment Frequency: Down 30% from last period
    → Check for blockers in release process
    → Review team capacity and workload

  • MTTR: Up 40% from last period
    → Review incident response procedures
    → Consider on-call rotation improvements
```

## Integration with Other Commands

### After `/ship`

```bash
/ship
# ... merge to main, triggers deployment ...

# Check impact on metrics
/dora-report --period 7
```

### During Sprint Planning

```bash
# Review last sprint's performance
/dora-report --period 14

# Set improvement goals for next sprint
```

### Before Quarterly Review

```bash
# Export 3-month report
/dora-report --period 90 --export q4-2024.json

# Generate CSV for spreadsheet
/dora-report --period 90 --export q4-2024.csv
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                  CONTINUOUS DEVELOPMENT                      │
│  Daily: /cycle, /commit, /ship                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                           │
│  Deployment triggers, state files updated                   │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              METRICS TRACKING (Automatic)                    │
│  .dora/deployments.json updated with new data               │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 VIEW METRICS (/dora-report)                  │
│  • Weekly: Sprint retrospectives                            │
│  • Monthly: Team reviews                                    │
│  • Quarterly: Stakeholder reports                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTINUOUS IMPROVEMENT                      │
│  Use recommendations to improve practices                   │
└─────────────────────────────────────────────────────────────┘
```

## Edge Cases Handled

### No Data Available

```
ℹ️  No DORA metrics data found.

Run /dora-init to initialize DORA tracking first.
```

### Insufficient Data

```
⚠️  Limited data available (only 5 deployments in period).

DORA metrics may not be representative.

Recommendation: Wait for more deployments or reduce period:
  /dora-report --period 7
```

### Stale Data

```
⚠️  Metrics last calculated 7 days ago.

Refreshing with latest data...
  ✓ Scanned state files
  ✓ Updated git history
  ✓ Fetched GitHub Actions data
  ✓ Recalculated metrics

Report updated!
```

### Missing State Files

```
⚠️  State files not found. Using git history only.

Deployment frequency and change failure rate may be inaccurate.

Recommendation: Set up release-stage pipeline to track deployments.
See: docs/rules/release-stage-pipeline.md
```

## Performance Optimization

### Caching Strategy

- **GitHub Actions data**: Cached for 1 hour (rate limit consideration)
- **Git log**: Re-parsed only if new commits detected
- **Metrics calculation**: Cached until new data available
- **State files**: Watched for changes, trigger recalculation

### Fast Mode

```bash
/dora-report --fast
```

Skip recalculation, use cached metrics (instant response).

## Output Formats

| Format | Flag | Use Case |
|--------|------|----------|
| **Terminal (default)** | _(none)_ | Interactive viewing |
| **Compact** | `--compact` | Terminal dashboards, scripts |
| **JSON** | `--export file.json` | Programmatic access, APIs |
| **CSV** | `--export file.csv` | Spreadsheets, data analysis |
| **Markdown** | `--export file.md` | Documentation, wikis |

## Best Practices

1. **Weekly Reviews**: Run `/dora-report` in weekly retrospectives
2. **Track Trends**: Focus on trend direction, not absolute values
3. **Share Success**: Export and share Elite band achievements
4. **Act on Recommendations**: Use provided suggestions for improvement
5. **Compare Periods**: Use `--compare` to validate improvement initiatives
6. **Export Regularly**: Keep quarterly snapshots for historical analysis

## Troubleshooting

### Metrics Look Wrong

```bash
# Force full recalculation
/dora-report --recalculate --verbose

# Check raw data
cat .dora/deployments.json
cat .dora/metrics.json
```

### Trend Shows "Unknown"

```
⚠️  Trend: Unknown (insufficient historical data)

Need at least 2 periods of data to calculate trends.

Wait for more deployments or reduce period:
  /dora-report --period 7
```

### Export Fails

```bash
# Check permissions
ls -la .

# Try different location
/dora-report --export ~/reports/dora-metrics.json
```

## Future Enhancements (GitHub MCP Integration)

**Current**: Local data sources (state files, git, gh CLI)

**Future with GitHub MCP**:
- Real-time metrics updates via webhooks
- Pull request metrics (PR lead time, review time)
- Team-level aggregation across multiple repos
- Automated Slack/email reports
- Custom metric thresholds per team
- Historical trend analysis (12+ months)

## Related Commands

- `/dora-init` - Initialize DORA metrics tracking
- `/dora-deploy` - Manually record deployment event
- `/dora-incident` - Track production incidents
- `/ship` - Merge to main (triggers deployment)

## See Also

- [DORA Metrics Vision](../../docs/features/dora-metrics/DORA-METRICS-VISION.md)
- [DORA Research](https://dora.dev)
- [State of DevOps Report](https://cloud.google.com/devops/state-of-devops)
