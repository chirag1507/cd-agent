# /dora-init - Initialize DORA Metrics Tracking

> Use this command to initialize DORA metrics tracking in your project, enabling real-time visibility into your software delivery performance.

## Rule Loading: Not Required

⚠️ **This command does NOT require rule loading.**

**Why:** The `/dora-init` command is for metrics setup that:
- Creates .dora/ directory structure with JSON files
- Aggregates deployment data from state files
- Parses git history for metrics calculation

**No application code generation** occurs, therefore no coding rules are needed.

---

## Purpose

Automatically scan and aggregate existing deployment data, git history, and CI/CD information to calculate and track the 4 key DORA metrics:
- **Deployment Frequency** - How often you deploy to production
- **Lead Time for Changes** - Time from commit to production
- **Change Failure Rate** - Percentage of deployments causing failures
- **Time to Restore Service** - Mean time to recovery (MTTR)

## When to Use

- **New project setup**: Initialize DORA tracking when starting a new cd-agent project
- **Existing project**: Add DORA tracking to projects already using cd-agent
- **After infrastructure changes**: Re-initialize if you've changed deployment tracking mechanisms
- **Baseline measurement**: Establish current DORA band before improvement initiatives

## What This Command Does

The agent will:

1. **Scan Existing Data Sources**:
   - Check for `state/*.json` deployment tracking files
   - Parse git commit history (default: last 90 days)
   - Query GitHub Actions workflow runs (if `gh` CLI available)

2. **Create `.dora/` Directory Structure**:
   ```
   .dora/
   ├── config.json          # Environment mappings, thresholds
   ├── deployments.json     # Aggregated deployment events
   ├── incidents.json       # Tracked incidents/failures
   ├── metrics.json         # Calculated DORA metrics
   └── cache/
       └── github-runs.json # Cached GitHub Actions data
   ```

3. **Import Historical Data**:
   - Extract deployments from `state/qa-deployed-versions.json`
   - Extract deployments from `state/uat-deployed-versions.json`
   - Parse git log for commit timestamps
   - Map commits to deployments for lead time calculation

4. **Calculate Initial Metrics**:
   - Deployment frequency (deployments per day)
   - Lead time (median time from commit to deploy)
   - Change failure rate (failed deployments / total deployments)
   - MTTR (median time to restore service)

5. **Generate Baseline Report**:
   - Display current DORA band (Elite/High/Medium/Low)
   - Show all 4 metrics with targets
   - Provide recommendations for improvement

6. **Update `.gitignore`**:
   - Add `.dora/cache/` to `.gitignore` (cache is ephemeral)
   - Keep `.dora/*.json` tracked (metrics history)

## Output

### Terminal Output

```
🚀 Initializing DORA Metrics Tracking...

📊 Data Sources Found:
  ✓ state/uat-deployed-versions.json (23 deployments)
  ✓ state/qa-deployed-versions.json (17 deployments)
  ✓ Git history (47 commits in last 90 days)
  ✓ GitHub Actions (gh CLI available)

📂 Creating .dora/ directory structure...
  ✓ Created .dora/config.json
  ✓ Created .dora/deployments.json
  ✓ Created .dora/incidents.json
  ✓ Created .dora/metrics.json
  ✓ Created .dora/cache/

📈 Calculating DORA Metrics (last 30 days)...

╔════════════════════════════════════════════════════════════════╗
║                    DORA METRICS BASELINE                        ║
╚════════════════════════════════════════════════════════════════╝

  Deployment Frequency: 1.8 deploys/day    [Elite ✓]
    Target: > 1/day
    Trend: ↑ +0.3 from previous period

  Lead Time for Changes: 42 minutes        [Elite ✓]
    Target: < 1 hour
    Trend: ↓ -8 min from previous period

  Change Failure Rate: 8.5%                [Elite ✓]
    Target: < 15%
    Trend: ↓ -2% from previous period

  Time to Restore Service: 24 minutes      [Elite ✓]
    Target: < 1 hour
    Trend: → stable

╔════════════════════════════════════════════════════════════════╗
║  🎉 Congratulations! You're in the ELITE DORA band!           ║
╚════════════════════════════════════════════════════════════════╝

📌 Next Steps:
  • Run /dora-report to view updated metrics anytime
  • Run /dora-deploy after manual deployments (optional)
  • Run /dora-incident to track production incidents

✅ DORA metrics tracking initialized successfully!
```

### Files Created

**`.dora/config.json`**:
```json
{
  "version": "1.0.0",
  "initialized_at": "2025-12-25T10:30:00Z",
  "lookback_days": 90,
  "environments": {
    "qa": {
      "state_file": "state/qa-deployed-versions.json",
      "is_production": false
    },
    "uat": {
      "state_file": "state/uat-deployed-versions.json",
      "is_production": false
    },
    "production": {
      "state_file": "state/production-deployed-versions.json",
      "is_production": true
    }
  },
  "thresholds": {
    "deployment_frequency": {
      "elite": 1.0,
      "high": 0.14,
      "medium": 0.03
    },
    "lead_time_minutes": {
      "elite": 60,
      "high": 1440,
      "medium": 10080
    },
    "change_failure_rate": {
      "elite": 0.15,
      "high": 0.30,
      "medium": 0.45
    },
    "mttr_minutes": {
      "elite": 60,
      "high": 1440,
      "medium": 10080
    }
  }
}
```

**`.dora/deployments.json`**:
```json
{
  "deployments": [
    {
      "id": "deploy-001",
      "timestamp": "2025-12-24T15:30:00Z",
      "environment": "uat",
      "commit_sha": "abc123def456",
      "success": true,
      "lead_time_minutes": 38
    }
  ]
}
```

**`.dora/incidents.json`**:
```json
{
  "incidents": []
}
```

**`.dora/metrics.json`**:
```json
{
  "last_calculated": "2025-12-25T10:30:00Z",
  "period_days": 30,
  "metrics": {
    "deployment_frequency": {
      "value": 1.8,
      "unit": "deploys_per_day",
      "band": "elite",
      "trend": "improving"
    },
    "lead_time": {
      "value": 42,
      "unit": "minutes",
      "band": "elite",
      "trend": "improving"
    },
    "change_failure_rate": {
      "value": 0.085,
      "unit": "percentage",
      "band": "elite",
      "trend": "improving"
    },
    "mttr": {
      "value": 24,
      "unit": "minutes",
      "band": "elite",
      "trend": "stable"
    }
  }
}
```

## Usage Examples

### Basic Initialization

```bash
/dora-init
```

Agent will:
- Auto-detect data sources
- Use default 90-day lookback
- Calculate metrics for last 30 days
- Display baseline report

### Custom Lookback Period

```bash
/dora-init --lookback 30
```

Only import last 30 days of history (faster for large repos).

### Skip GitHub Actions Data

```bash
/dora-init --skip-github
```

Only use local data (state files + git log), skip `gh` CLI queries.

### Re-initialize (Fresh Start)

```bash
/dora-init --reset
```

Delete existing `.dora/` directory and start fresh.

## Data Source Priority

The command uses these data sources in priority order:

1. **State Files** (Primary - Most Accurate)
   - `state/qa-deployed-versions.json`
   - `state/uat-deployed-versions.json`
   - `state/production-deployed-versions.json`
   - Contains: deployment timestamps, commit SHAs, environment

2. **Git History** (Always Available)
   - `git log --since="90 days ago"`
   - Contains: commit timestamps, commit SHAs
   - Used for: lead time calculation

3. **GitHub Actions** (Optional - Requires `gh` CLI)
   - `gh run list --json conclusion,createdAt,headSha`
   - Contains: workflow failures, timestamps
   - Used for: change failure rate

## Calculation Logic

### Deployment Frequency

```
Total Deployments (production) / Period Days
```

Example: 54 deployments in 30 days = 1.8 deploys/day

### Lead Time for Changes

```
Median(Deployment Timestamp - Commit Timestamp)
```

For each deployment, find the commit and calculate time difference.

### Change Failure Rate

```
Failed Deployments / Total Deployments
```

Failed deployment = deployment followed by rollback/hotfix within 1 hour.

### MTTR (Mean Time to Restore)

```
Median(Incident Resolution Time - Incident Start Time)
```

Tracked via `/dora-incident` command or detected from rapid redeployments.

## DORA Bands

| Metric | Elite | High | Medium | Low |
|--------|-------|------|--------|-----|
| **Deployment Frequency** | Multiple/day | Weekly-Monthly | Monthly-Yearly | < Yearly |
| **Lead Time** | < 1 hour | < 1 day | 1 day - 1 week | > 1 week |
| **Change Failure Rate** | < 15% | 15-30% | 30-45% | > 45% |
| **MTTR** | < 1 hour | < 1 day | 1 day - 1 week | > 1 week |

## Edge Cases Handled

### No State Files Found

```
⚠️  No state files found in state/ directory.

DORA tracking will use git history only.

Recommendation:
  • Set up release-stage pipeline to track deployments
  • See: .claude/rules/release-stage-pipeline.md
```

### No Git History

```
❌ Error: No git history found.

This command requires a git repository.
Initialize git first: git init
```

### GitHub CLI Not Available

```
ℹ️  GitHub CLI (gh) not found. Skipping GitHub Actions data.

DORA metrics will use state files and git history only.

To enable GitHub Actions data:
  • Install gh CLI: https://cli.github.com
  • Authenticate: gh auth login
```

### Empty Repository

```
ℹ️  No deployments found in last 90 days.

DORA tracking initialized but no baseline metrics available yet.

Deploy your application and run /dora-report to see metrics.
```

## Integration with Existing Commands

### After `/cd-init`

When initializing a new project:
```bash
/cd-init backend
# ... project setup ...
/dora-init
```

### After Deployment

State files are automatically updated by release-stage pipeline.
Run `/dora-report` to see updated metrics.

### With `/ship`

After merging to main and deploying:
```bash
/ship
# ... triggers release pipeline ...
# State files updated automatically ...
/dora-report  # See updated metrics
```

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT INITIALIZATION                   │
│  /cd-init → Set up project structure                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DORA INITIALIZATION (/dora-init)           │
│  • Scan state files, git history, GitHub Actions            │
│  • Create .dora/ directory                                  │
│  • Calculate baseline metrics                               │
│  • Display initial DORA band                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  CONTINUOUS DEVELOPMENT                      │
│  /cycle, /red, /green, /refactor → Build features          │
│  /commit → Commit changes                                   │
│  /ship → Merge to main                                      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                           │
│  Commit Stage → Tests pass                                  │
│  Release Stage → Deploy to UAT/Production                   │
│  State files updated automatically                          │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  METRICS REPORTING (/dora-report)            │
│  • Read updated state files                                 │
│  • Recalculate DORA metrics                                 │
│  • Show trends and current band                             │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Initialize Early**: Run `/dora-init` when starting a new project to establish baseline
2. **Regular Reviews**: Run `/dora-report` weekly to track trends
3. **Track Production Only**: Focus on production deployments for official DORA metrics
4. **Git Commit Hygiene**: Use meaningful commit messages for better lead time tracking
5. **Document Incidents**: Use `/dora-incident` to track production issues accurately
6. **Export for Reports**: Use `/dora-report --export` for quarterly stakeholder reports

## Troubleshooting

### "Permission denied" Error

```bash
# Check .dora directory permissions
ls -la .dora/

# Fix permissions
chmod 755 .dora/
chmod 644 .dora/*.json
```

### Metrics Look Wrong

```bash
# Re-initialize with verbose output
/dora-init --reset --verbose

# Check raw data
cat .dora/deployments.json
cat .dora/metrics.json
```

### Old Data Showing

```bash
# Clear cache and recalculate
rm -rf .dora/cache/
/dora-report --recalculate
```

## Future Enhancements (GitHub MCP Integration)

**Note**: Current implementation uses local data sources (state files, git, gh CLI).

**Future enhancement with GitHub MCP** will enable:
- Real-time deployment webhook events
- Automatic incident detection from GitHub Issues
- Pull request merge time tracking
- Richer failure context from workflow logs
- Team-level metrics aggregation

This enhancement will be seamless - existing `.dora/` data will work with enhanced tracking.

## Related Commands

- `/dora-report` - View current DORA metrics and trends
- `/dora-deploy` - Manually record deployment (if not using state files)
- `/dora-incident` - Track production incidents for MTTR calculation
- `/cd-init` - Initialize new cd-agent project structure
- `/ship` - Merge to main (triggers deployment pipeline)

## See Also

- [DORA Metrics Vision](../../docs/features/dora-metrics/DORA-METRICS-VISION.md)
- [Release Stage Pipeline](../rules/release-stage-pipeline.md)
- [DORA Research](https://dora.dev)
