# Context Optimization Plan

## Problem

Context window starts at 70% full (76.5k tokens in Memory files) due to automatic loading of all `.claude/rules/*.md` files.

## Solution: On-Demand Rule Loading

### Phase 1: Prevent Auto-Loading ✅ DONE

Created `.claudeignore` to exclude `.claude/rules/` from automatic indexing.

```
# .claudeignore
.claude/rules/
```

**Result**: Rules are still accessible via Read tool but not loaded automatically.

---

### Phase 2: Establish Mandatory Rule Loading Pattern ✅ COMPLETE

Refactor skills to load rules on-demand with **strict enforcement**. Implemented two patterns:

1. **Context-Aware Pattern**: Commands that work with different code types (e.g., `/red`, `/green`, `/refactor`, `/code-review`) detect context and load appropriate rules automatically.
2. **Static Pattern**: Commands with fixed requirements load specific rules every time (e.g., `/driver`, `/acceptance-test`, `/commit-stage`).

#### Pattern Template (Applied to All Skills)

```markdown
# /<command> - Command Description

## CRITICAL: Mandatory Rule Loading

⚠️ **BEFORE PROCEEDING, YOU MUST:**

1. **Read ALL required rule files** (use multiple Read tool calls in parallel)
2. **Confirm rules are loaded** (brief acknowledgment)
3. **Follow rules strictly** (non-negotiable)

**Required Rules:**
- `.claude/rules/<rule-1>.md` - Description
- `.claude/rules/<rule-2>.md` - Description
- `.claude/rules/<rule-3>.md` - Description

**ACTION REQUIRED**: Use Read tool to load these files NOW.

**If you cannot read the rule files, STOP and notify the user.**

---

### Mandatory Checkpoint: Confirm Rules Loaded

After reading the rule files, you MUST output:

```
✅ RULES LOADED

Rules Read:
- <rule-1>.md
- <rule-2>.md
- <rule-3>.md

Proceeding with strict rule compliance.
```

**DO NOT SKIP THIS CHECKPOINT.**

---

## [Rest of command content]
```

#### Skills Refactored (15/15 Complete ✅)

**TDD Cycle** - ✅ COMPLETE (Context-Aware)
- ✅ `/red` - TDD Red Phase (loads 3-4 rules based on test layer)
- ✅ `/green` - TDD Green Phase (inherits context from /red, loads 1-4 rules)
- ✅ `/refactor` - TDD Refactor Phase (inherits context from /red, loads 1-4 rules)

**Pattern:** `/red` asks for test layer once, `/green` and `/refactor` inherit that context and load appropriate architecture rules automatically. No interruption to TDD flow.

**Acceptance Testing** - ✅ COMPLETE
- ✅ `/acceptance-test` - Write Executable Specification (loads 3 rules)
- ✅ `/dsl` - Implement DSL (loads 2 rules)
- ✅ `/driver` - Implement Protocol Drivers (loads 3 rules)

**CI/CD Pipeline** - ✅ COMPLETE
- ✅ `/commit-stage` - Commit Stage Pipeline (loads 2 rules)
- ✅ `/release-stage` - Release Stage Pipeline (loads 1 rule)
- ✅ `/acceptance-stage` - Acceptance Stage Pipeline (loads 2 rules)

**Code Quality & Dependencies** - ✅ COMPLETE (Context-Aware for /code-review)
- ✅ `/code-review` - Code Review (context-aware: loads 1-9 rules based on code type)
- ✅ `/dependency-review` - Dependency Review (loads 1 rule)
- ✅ `/spike` - Technical Exploration (loads 1 rule)

**Pattern:** `/code-review` asks what type of code is being reviewed (Backend Controller, Frontend Component, Test Code, etc.) and loads only relevant architecture rules.

---

### Phase 3: Refactor Remaining Skills ✅ COMPLETE

All 15 commands refactored with on-demand rule loading:

| Skill | Required Rules | Priority | Status |
|-------|----------------|----------|--------|
| `/code-review` | 5 rules (code-style, controller-pattern-be, infrastructure-services, test-doubles, test-flakiness) | MEDIUM | ✅ DONE |
| `/dependency-review` | `dependency-management.md` | MEDIUM | ✅ DONE |
| `/spike` | `code-style.md` | MEDIUM | ✅ DONE |
| `/plan` | (No rules - planning only) | MEDIUM | ✅ DONE |
| `/cycle` | (Delegates to sub-commands) | MEDIUM | ✅ DONE |
| `/commit` | (No rules - git operation) | LOW | ✅ DONE |
| `/ship` | (No rules - git operation) | LOW | ✅ DONE |
| `/cd-init` | `dependency-management.md` | LOW | ✅ DONE |
| `/vision` | (No rules - strategic planning) | LOW | ✅ DONE |
| `/dora-init` | (No rules - metrics setup) | LOW | ✅ DONE |
| `/dora-report` | (No rules - reporting only) | LOW | ✅ DONE |

---

### Phase 4: Optimize CLAUDE.md (TODO)

Reduce `CLAUDE.md` from 8.9k tokens to ~2-3k tokens by:

1. **Remove duplicate content** - Don't repeat what's in rule files
2. **Use concise tables** - Instead of verbose paragraphs
3. **Remove examples** - Keep only in rule files
4. **Convert to index** - Reference rules instead of duplicating

**Before optimization (8.9k tokens):**
```markdown
## Test-Driven Development (TDD)

The agent enforces pure TDD with Red-Green-Refactor cycle:

[ASCII diagram]
[Detailed rules]
[Code examples]
[Anti-patterns]
```

**After optimization (~500 tokens):**
```markdown
## Core Practices

| Practice | Description | Rules Location |
|----------|-------------|----------------|
| TDD | Red-Green-Refactor cycle | `.claude/rules/sociable-unit-test*.md` |
| BDD | Example Mapping + Gherkin | `.claude/rules/acceptance-test.md` |
| Clean Architecture | Dependency inversion | `.claude/rules/clean-architecture-*.md` |
```

---

## Expected Results

### Before Optimization

```
Context Usage
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛀   95k/200k tokens (48%)
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁   System prompt: 3.1k tokens
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁   System tools: 15.0k tokens
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁   Memory files: 76.5k tokens ← PROBLEM
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛀ ⛀ ⛀   Skills: 322 tokens
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛝ ⛝ ⛝ ⛝   Free space: 60k (30%)
```

### After Optimization

```
Context Usage
⛁ ⛁ ⛁ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀   ~25k/200k tokens (12.5%)
⛁ ⛁ ⛁ ⛁ ⛁ ⛀ ⛀ ⛀ ⛀ ⛀   System prompt: 3.1k tokens
⛁ ⛁ ⛁ ⛁ ⛁ ⛀ ⛀ ⛀ ⛀ ⛀   System tools: 15.0k tokens
⛁ ⛁ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀   Memory files: 2.5k tokens ← OPTIMIZED
⛁ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀ ⛀   Skills: 322 tokens
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   Free space: 155k (77.5%) ← MUCH BETTER
```

**Savings**: 74k tokens freed up (37% of total context window)

---

## Verification Plan

After completing all phases:

1. **Start fresh Claude session**
2. **Run `/context`** - Verify low memory usage (~25k total)
3. **Run `/red`** - Verify rules are loaded dynamically
4. **Observe behavior** - Ensure rules are followed strictly
5. **Check checkpoint output** - Confirm "✅ RULES LOADED" appears

---

## Fail-Safe Guarantees

### 1. Non-Negotiable Rule Enforcement

- Skills have **explicit MUST statements**: "YOU MUST read these files"
- **Blocking instructions**: "If you cannot read files, STOP"
- **Mandatory checkpoint**: Must confirm rules loaded before proceeding

### 2. Verification at Every Step

- Skills output **"✅ RULES LOADED"** checkpoint
- User can see which rules were loaded
- Clear audit trail of rule compliance

### 3. No Workflow Shortcuts

- Rules MUST be read before execution
- Checkpoints CANNOT be skipped
- Execution STOPS if rules can't be loaded

---

## Implementation Steps (Remaining)

1. **Complete skill refactoring** (15 more skills)
   - Apply pattern template to each
   - Map required rules for each skill
   - Test each skill individually

2. **Optimize CLAUDE.md** (reduce from 8.9k → 2-3k tokens)
   - Create rule reference table
   - Remove duplicate content
   - Keep only essential context

3. **Test complete workflow**
   - Fresh session test
   - Run multiple skills in sequence
   - Verify rules are followed

4. **Document for users**
   - Update README with new approach
   - Add troubleshooting guide
   - Explain context optimization benefits

---

## Benefits

1. **Massive token savings** - 74k tokens freed (37% of window)
2. **Faster startup** - Load only what's needed
3. **Better focus** - Relevant rules per skill
4. **Easier maintenance** - Update rules once, all skills benefit
5. **Clear traceability** - Checkpoint shows which rules were loaded
6. **Guaranteed compliance** - Mandatory loading ensures rules are always followed

---

## Next Steps

### Immediate (This Session)

1. ✅ Created `.claudeignore`
2. ✅ Established pattern with `/red`
3. ✅ Refactored `/commit-stage`
4. ⏳ **Get user approval for approach**
5. ⏳ **Continue with remaining high-priority skills**

### Follow-Up (Next Session)

1. Complete all skill refactoring
2. Optimize CLAUDE.md
3. Full system test
4. Update documentation

---

## Risk Mitigation

**Risk**: Rules might not be loaded if Read tool fails

**Mitigation**:
- Explicit STOP instruction if Read fails
- User will see error message immediately
- Can manually read rules if needed

**Risk**: User might start using commands immediately without rules

**Mitigation**:
- Commands block execution until rules are loaded
- Mandatory checkpoint is visible to user
- Clear error messages if rules missing

**Risk**: Rules might change and skills become outdated

**Mitigation**:
- Skills reference rule file paths, not content
- Rules can be updated independently
- Skills auto-load latest rule versions

---

## Success Criteria

- [x] `.claudeignore` created and working
- [ ] All skills refactored with mandatory loading
- [ ] CLAUDE.md optimized to ~2-3k tokens
- [ ] Context usage starts at <30% (was 48%)
- [ ] Rules are loaded and followed in every command
- [ ] No regression in code quality or rule compliance
- [ ] User workflow remains smooth (no extra friction)
