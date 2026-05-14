# Brainstorming Combined Spec-Plan

## Purpose

Update the `brainstorming` skill so each brainstorming session produces one committed artifact instead of separate design and implementation plan documents.

## Problem

The current skill requires:

1. A design document at `docs/designs/YYYY-MM-DD-<topic>-design.md`
2. A separate implementation plan at `docs/specs/YYYY-MM-DD-<topic>-plan.md`

This creates duplicated ceremony for small and medium changes, even though the design and implementation plan are part of the same decision record.

## Selected Approach

Use a single combined spec-plan document saved at:

`docs/specs/YYYY-MM-DD-<topic>.md`

The document will contain both the approved design and the ordered implementation plan. The brainstorming flow will keep the same pre-implementation guardrails: context exploration, clarifying questions, alternatives, user design approval, self-review, and user review.

## Alternatives Considered

### Optional second plan document

Keep the design document and only create the plan document when the user asks. This preserves backward compatibility, but leaves the default flow ambiguous and still encourages split artifacts.

### Rename design into final document

Start with a design document, then rename and expand it after review. This avoids two final files, but introduces file churn and makes the process harder to explain.

### Combined spec-plan document

Create one document that serves as both spec and plan. This is the clearest default and best matches the desired workflow.

## Skill Behavior

The updated `brainstorming` instructions should:

1. Replace references to `docs/designs/YYYY-MM-DD-<topic>-design.md` with `docs/specs/YYYY-MM-DD-<topic>.md`.
2. Replace the two-document terminal state with one committed combined spec-plan.
3. Keep the design approval gate before any implementation work.
4. Keep the self-review loop for placeholders, contradictions, ambiguity, and scope.
5. Ask the user to review the combined spec-plan before considering brainstorming complete.
6. Remove instructions that require writing a second implementation plan document.

## Combined Document Structure

Each generated document should include:

1. Purpose and goals
2. Scope and non-goals
3. Requirements and constraints
4. Selected design
5. Alternatives considered
6. Architecture, components, and data flow where relevant
7. Error handling and edge cases where relevant
8. Testing and validation strategy
9. Step-by-step implementation plan
10. Acceptance criteria

Sections may be concise for small changes, but the file should still be complete enough to guide implementation without a second plan.

## Error Handling

If the user requests changes after reviewing the combined spec-plan, the agent should update the same file and repeat the self-review. The agent should not create a second plan document as a fallback.

If a project is too large for one combined spec-plan, the agent should decompose it into smaller sub-projects, and each sub-project should get its own combined spec-plan.

## Testing and Validation

Validation for the skill update should include:

1. Inspecting the edited `skills/brainstorming/SKILL.md` for stale references to separate design and plan files.
2. Confirming the process flow and checklist agree on the one-document terminal state.
3. Running repository validation commands if available.

## Implementation Plan

1. Edit `skills/brainstorming/SKILL.md` to describe one combined spec-plan artifact.
2. Update the checklist to remove the separate design-doc and implementation-plan steps.
3. Update the process flow diagram to show one combined document write/review loop.
4. Update the "After the Design" section so documentation, self-review, user review, and terminal state all refer to `docs/specs/YYYY-MM-DD-<topic>.md`.
5. Search the skill file for stale paths and phrases such as `docs/designs`, `-design.md`, `-plan.md`, and `both the spec and plan`.
6. Run available validators and fix any failures.

## Acceptance Criteria

1. The brainstorming skill clearly instructs agents to create one combined spec-plan document.
2. The single document path is `docs/specs/YYYY-MM-DD-<topic>.md`.
3. The hard gate against implementation before design approval remains intact.
4. The skill no longer requires a separate design doc plus separate plan doc.
5. The process remains reviewable and commit-based.
