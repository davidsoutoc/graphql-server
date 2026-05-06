# Fugitoid Workflow Install Guide

This guide explains how to reuse the workflow in `.github/workflows/fugitoid.yml` in another repository.

## What this workflow does

The workflow:

1. Finds open GitHub code scanning alerts with severity `critical` and `high`
2. Requests GitHub autofix for those alerts
3. Creates a branch and PR for each successful autofix
4. Creates a Jira ticket for each created PR
5. Optionally runs a Codex review on the PR and posts a PR comment

## File to copy

Copy this workflow file into the target repository:

- `.github/workflows/fugitoid.yml`

## Repository prerequisites

Before installing the workflow in another repository:

1. GitHub code scanning must already be enabled for the repository
2. The repository must produce `critical` or `high` code scanning alerts
3. The token used by `SECURITY_AUTOFIX_TOKEN_PERSONAL` must be allowed to:
   - read and write repository contents
   - create branches
   - create pull requests
   - access code scanning autofix endpoints
4. The Jira project must allow issue creation with the configured issue type and labels
5. If you want PR review comments from Codex, the OpenAI API project behind the key must have active billing/quota

## Required GitHub secrets

Create these in:

`Repository Settings -> Secrets and variables -> Actions`

### Required

`SECURITY_AUTOFIX_TOKEN_PERSONAL`

- Personal access token used to call GitHub code scanning autofix APIs
- This workflow explicitly does not use `GITHUB_TOKEN` for those endpoints

`JIRA_USER_EMAIL`

- Email for the Jira account used to create Jira tickets

`JIRA_API_TOKEN`

- Jira API token for that Jira account

### Optional

`OPENAI_API_KEY_CODEX_REVIEW`

- OpenAI API key used by the Codex PR review step
- If missing, the review step is skipped

`OPENAI_API_KEY_DEPENDABOT_UPDATE`

- Fallback OpenAI key for the Codex review step
- Used only if `OPENAI_API_KEY_CODEX_REVIEW` is not set

## Required GitHub repository variables

Create these in:

`Repository Settings -> Secrets and variables -> Actions -> Variables`

### Required

`JIRA_BASE_URL`

- Example: `https://your-company.atlassian.net`

`JIRA_PROJECT_KEY`

- Example: `PLATFORM`

### Optional

`JIRA_ISSUE_TYPE`

- Default: `Task`

`MAX_ALERTS_PER_RUN`

- Default: `1`

`DRY_RUN`

- Default: `false`

`BRANCH_PREFIX`

- Default: `code-scanning-autofix`

`POLL_INTERVAL_MS`

- Default: `5000`

`POLL_TIMEOUT_MS`

- Default: `180000`

`CODEX_REVIEW_MODEL`

- Default: `gpt-5.4-mini`

`CODEX_REVIEW_EFFORT`

- Default: `low`

## Current workflow behavior

As currently written, the workflow:

- runs on a schedule and on manual dispatch
- only processes `critical` and `high` alerts
- creates Jira tickets after PR creation
- runs Codex review after Jira ticket creation
- applies the same built-in labels to PRs and Jira tickets:
  - `CODE_QUALITY`
  - `MAINTENANCE`
- maps Jira priority from CodeQL severity:
  - `critical -> Critical`
  - `high -> High`
  - missing or unknown severity -> `Medium`

## Labels required for the Teams summary

This workflow adds the same labels automatically to the GitHub PRs and the Jira tickets:

- `CODE_QUALITY`
- `MAINTENANCE`

These labels are necessary because the Teams summary is expected to filter and group the generated items using them.

For that reason:

- create these labels in the target GitHub repository so PR labeling succeeds
- make sure these labels are also valid in the target Jira project so ticket creation succeeds cleanly

## How to install

1. Copy `.github/workflows/fugitoid.yml` to the target repository
2. Create the required GitHub secrets
3. Create the required GitHub variables
4. Create the GitHub labels `CODE_QUALITY` and `MAINTENANCE`
5. Commit and push the workflow file
6. Run the workflow manually from `Actions -> Code scanning critical/high autofix`

## Manual test

Recommended first run:

- `max_alerts_per_run = 1`
- `dry_run = true`

Then run again with:

- `max_alerts_per_run = 1`
- `dry_run = false`

This lets you confirm:

- the GitHub token can read and write the needed resources
- Jira ticket creation works
- Codex review works, if configured

## Troubleshooting

### No PRs are created

Check:

- the repository actually has open `critical` or `high` code scanning alerts
- code scanning autofix is available for those alerts
- `SECURITY_AUTOFIX_TOKEN_PERSONAL` is valid

### Jira tickets are not created

Check:

- `JIRA_BASE_URL`
- `JIRA_PROJECT_KEY`
- `JIRA_USER_EMAIL`
- `JIRA_API_TOKEN`
- whether the issue type exists in that project
- whether the labels are valid for your Jira instance

### Codex review fails

Check:

- `OPENAI_API_KEY_CODEX_REVIEW` or `OPENAI_API_KEY_DEPENDABOT_UPDATE`
- OpenAI billing/quota
- OpenAI rate limits

The workflow skips Codex review if no OpenAI key is configured.
