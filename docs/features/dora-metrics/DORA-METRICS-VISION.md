# Product Vision: DORA Metrics Tracking

**Last Updated**: 2025-12-25
**Next Review**: 2026-01-25

## Problem Statement

**Who**: Development teams using cd-agent to build production-grade software

**Problem**: Teams lack real-time visibility into their software delivery performance. They can't measure if they're achieving Elite DORA metrics, identify bottlenecks, or track improvement over time. DORA metrics exist in fragmented systems (GitHub Actions, deployment logs, git history) making it difficult to get a unified view.

**Impact**: Without DORA metrics visibility:
- Teams don't know if they're improving or degrading
- Can't identify deployment bottlenecks
- No data-driven evidence for process improvements
- Can't demonstrate value of XP/CD practices to stakeholders
- Miss opportunities to achieve Elite DORA band

## Product Vision

**DORA Metrics Tracking provides immediate, actionable visibility into the four key software delivery metrics directly within cd-agent projects. Teams can measure their current performance, track trends over time, and make data-driven decisions to achieve and maintain Elite DORA band - all without leaving their development environment.**

## Target Users

### Primary Persona: Full-Stack Developer (Using cd-agent)

- **Role**: Full-stack developer building production applications with cd-agent
- **Pain Points**:
  - "I follow XP/CD practices but have no proof they're working"
  - "I don't know if my deployment frequency is improving"
  - "Can't tell if recent changes increased our failure rate"
  - "DORA metrics are scattered across GitHub, deployment logs, incident trackers"
- **Goals**:
  - See DORA metrics without leaving terminal
  - Track improvement over time
  - Identify when metrics degrade
  - Share metrics with team/stakeholders
- **Success Criteria**:
  - Can view all 4 DORA metrics in < 10 seconds
  - Historical trends show improvement trajectory
  - Can export metrics for reports

### Secondary Persona: Engineering Manager

- **Role**: Engineering manager overseeing teams using cd-agent
- **Pain Points**:
  - "Need to manually compile DORA metrics from multiple sources"
  - "Can't compare team performance across sprints"
  - "No way to prove ROI of XP/CD investment"
- **Goals**:
  - Demonstrate team improvement to leadership
  - Identify teams needing support
  - Justify continued investment in quality practices
- **Success Criteria**:
  - Quarterly DORA metrics reports available
  - Can track team progress toward Elite band
  - Exportable data for presentations

## Value Proposition

**For** development teams using cd-agent
**Who** need visibility into their software delivery performance
**The** DORA Metrics Tracking
**Is a** built-in metrics dashboard
**That** aggregates deployment, commit, and incident data to calculate and display the 4 key DORA metrics in real-time
**Unlike** external analytics platforms or manual metric compilation
**Our product** works seamlessly with existing cd-agent workflow, requires zero configuration beyond initialization, and uses data you're already generating

## Success Metrics

### DORA Metrics (What We're Tracking)

**Elite Band Targets:**
- **Deployment Frequency**: Multiple deploys per day (>1/day)
- **Lead Time for Changes**: < 1 hour (commit to production)
- **Change Failure Rate**: < 15%
- **Time to Restore Service**: < 1 hour

### Feature Success Metrics

**Adoption Metrics:**
- 80% of cd-agent projects initialize DORA tracking within first week
- `/dora-report` run at least weekly per project
- 50% of teams export metrics for stakeholder reports

**Accuracy Metrics:**
- 95% accuracy in deployment detection (vs manual tracking)
- < 5% false positives in failure detection
- Lead time calculations within 5 minutes of actual time

**User Satisfaction:**
- "DORA metrics save me 30+ minutes per week" (user feedback)
- 4.5+ star rating on feature usefulness survey
- Zero reported data corruption incidents

## Strategic Goals

1. **Immediate Value** - Developers see DORA metrics within 5 minutes of `/dora-init`
   - *Why it matters*: Proves value immediately, drives adoption

2. **Zero Configuration** - Works with existing cd-agent setup (state files, git, GitHub CLI)
   - *Why it matters*: Reduces friction, no additional infrastructure needed

3. **Actionable Insights** - Not just numbers, but trends and recommendations
   - *Why it matters*: Helps teams actually improve, not just measure

4. **Platform Foundation** - Commands built now become platform features later
   - *Why it matters*: Investment pays dividends when platform launches

5. **Progressive Enhancement** - Start simple (local files), enhance with GitHub MCP later
   - *Why it matters*: Deliver value now, improve over time

## Constraints

### Technical Constraints

- Must work with existing `state/*.json` files (no schema changes to state files)
- Must work offline (except GitHub data fetching)
- Must be fast (< 3 seconds to generate report)
- Must handle missing data gracefully (some projects don't have all state files yet)
- Storage in `.dora/` directory (git-ignored by default)

### Business Constraints

- Must not require paid external services (Pact Broker is already used, but no new dependencies)
- Must work for both open-source and private projects
- Must respect GitHub API rate limits

### User Experience Constraints

- Must be simple enough to use without reading docs
- Output must be readable in terminal (ASCII-friendly visualizations)
- Must not slow down existing cd-agent commands

## Out of Scope

**We are explicitly NOT building:**

1. **Web dashboard** - Terminal-only for MVP (platform will have UI later)
   - *Rationale*: Adds complexity, requires server infrastructure, delays MVP

2. **Team aggregation** - No multi-project/team rollups in MVP
   - *Rationale*: Adds significant complexity, platform will handle this

3. **Custom metric definitions** - Only the 4 standard DORA metrics
   - *Rationale*: Keeps scope manageable, DORA metrics are industry standard

4. **Real-time alerts** - No notifications when metrics degrade
   - *Rationale*: Can add later, not critical for MVP

5. **Integration with third-party tools** (Jira, Slack, etc.)
   - *Rationale*: Platform feature, too broad for MVP

6. **Historical data import beyond 90 days** - Recent data only for MVP
   - *Rationale*: Keeps initial scan fast, older data less actionable

## Product Principles

1. **Data You Already Have** - Use existing state files, git history, GitHub Actions data
   - *What this means*: No manual data entry, no new tracking infrastructure

2. **Fast and Local-First** - Work offline where possible, cache GitHub data
   - *What this means*: Commands respond in < 3 seconds, work on airplanes

3. **Transparent Calculations** - Show how metrics are calculated, expose raw data
   - *What this means*: No black box - users can verify and trust the numbers

4. **Progressive Disclosure** - Simple output by default, detailed on demand
   - *What this means*: `/dora-report` shows summary, `/dora-report --verbose` shows details

5. **Future-Proof** - Design for GitHub MCP integration from day one
   - *What this means*: Architecture supports enhancement without breaking changes

## Feature Set (Commands)

### Phase 1: MVP (Current Sprint)

1. **`/dora-init`** - Initialize DORA tracking
   - Scan `state/*.json` for historical deployments
   - Import git commit history (last 90 days)
   - Create `.dora/` directory structure
   - Generate initial metrics baseline

2. **`/dora-report`** - Display current DORA metrics
   - Show all 4 metrics with current band
   - ASCII visualization (trend charts)
   - Comparison to Elite band targets
   - Export to JSON/CSV

### Phase 2: Enhancement (Future)

3. **`/dora-deploy`** - Record deployment event (manual)
4. **`/dora-incident`** - Track production incidents
5. **`/dora-trend`** - Detailed trend analysis
6. **GitHub MCP Integration** - Real-time webhook data

## Data Sources

### Current (MVP)

1. **State Files** (`state/*.json`)
   - Deployment timestamps and commit SHAs
   - Already tracked by release-stage pipeline

2. **Git History** (`git log`)
   - Commit timestamps
   - Calculate lead time (commit → deploy)
   - Local, fast, always available

3. **GitHub CLI** (`gh run list`)
   - Pipeline failures
   - Calculate change failure rate
   - Requires network, cached locally

### Future Enhancement

4. **GitHub MCP** (Phase 2)
   - Real-time webhook events
   - Richer failure context
   - Pull request data
   - Deployment API events

## Storage Schema

```
.dora/
├── config.json          # Environment mappings, thresholds
├── deployments.json     # Aggregated deployment events
├── incidents.json       # Tracked incidents/failures
├── metrics.json         # Calculated DORA metrics
└── cache/
    └── github-runs.json # Cached GitHub Actions data
```

## Success Scenario

**Day 1**: Developer runs `/dora-init` in cd-agent project
- Scans 23 deployments from `state/uat-deployed-versions.json`
- Finds 47 commits in last 30 days
- Generates baseline: "You're in High DORA band! 🎉"

**Week 2**: Developer runs `/dora-report` after sprint
- Deployment Frequency: 1.8/day (↑ from 1.2/day) - Elite ✓
- Lead Time: 38 min (↓ from 45 min) - Elite ✓
- Change Failure Rate: 6% (↓ from 8%) - Elite ✓
- MTTR: 18 min (↓ from 22 min) - Elite ✓
- Developer shares ASCII chart in standup

**Month 3**: Manager exports metrics for quarterly review
- Runs `/dora-report --export quarterly-report.csv`
- Shows consistent Elite band achievement
- Justifies continued XP/CD investment with data

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| State files don't exist in some projects | Can't calculate metrics | Graceful degradation, show what's available |
| GitHub API rate limits hit | Can't fetch failure data | Cache aggressively, fall back to local git |
| Inaccurate metric calculations | Loss of trust | Show calculation details, allow manual corrections |
| Users don't adopt commands | Wasted effort | Make `/dora-init` part of `/cd-init` workflow |

## Open Questions

1. Should `/dora-init` be run automatically by `/cd-init`?
2. What's the default lookback period for initial scan? (30/60/90 days?)
3. Should we track metrics per environment (qa/uat/prod) separately?
4. How to handle monorepos with multiple deployable components?

---

## Next Steps

1. ✅ Define vision (this document)
2. ⏭️ Plan `/dora-init` implementation with Example Mapping
3. ⏭️ TDD implementation of `/dora-init` command
4. ⏭️ Plan `/dora-report` implementation
5. ⏭️ Document GitHub MCP enhancement strategy
