<#
.SYNOPSIS
    Validates the NorthstarIQ repository foundation.

.DESCRIPTION
    Read-only structural, security and scope validation for the NorthstarIQ
    Revenue Operations Intelligence Platform repository.

    Checks performed:
      1. Required directory structure
      2. Required root files
      3. Salesforce DX foundation validity
      4. Secret / credential / auth-artifact scan
      5. Deferred-technology scope leakage (Data Cloud / Agentforce)
      6. Phase-appropriate emptiness (no premature business metadata or data)
      7. Ignore-file coverage
      8. Git repository state

    This script MODIFIES NOTHING. It does not touch Salesforce, does not
    authenticate, and does not perform any git write operation.

.NOTES
    Target shell : Windows PowerShell 5.1
    Compatibility: avoids &&, ||, ternary and null-coalescing operators,
                   which are parser errors in 5.1.

.OUTPUTS
    Exit code 0 = all checks passed.
    Exit code 1 = one or more checks failed.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File scripts\powershell\Test-RepositoryStructure.ps1
#>

[CmdletBinding()]
param(
    [string] $RepoRoot,
    [switch] $Quiet
)

$ErrorActionPreference = 'Stop'

# ---------------------------------------------------------------------------
# Resolve repository root (default: two levels above this script)
# ---------------------------------------------------------------------------
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
}
if (-not (Test-Path $RepoRoot)) {
    Write-Host "FATAL: repository root not found: $RepoRoot" -ForegroundColor Red
    exit 1
}
$RepoRoot = (Resolve-Path $RepoRoot).Path

# ---------------------------------------------------------------------------
# Result accumulator
# ---------------------------------------------------------------------------
$script:Pass = 0
$script:Fail = 0
$script:Warn = 0
$script:Failures = @()

# Paths that are generated rather than authored: version-control internals,
# dependency trees and build output. All are git-ignored, so they are not part
# of the repository being validated - scanning them reports on other people's
# code and makes the run take minutes instead of seconds.
$script:GeneratedPaths = '\\(\.git|node_modules|\.next|\.vercel|__pycache__)\\'

function Write-Section {
    param([string] $Title)
    if (-not $Quiet) {
        Write-Host ""
        Write-Host ("=" * 74) -ForegroundColor DarkGray
        Write-Host "  $Title" -ForegroundColor Cyan
        Write-Host ("=" * 74) -ForegroundColor DarkGray
    }
}

function Assert-That {
    param(
        [string]  $Name,
        [bool]    $Condition,
        [string]  $Detail = "",
        [switch]  $WarnOnly
    )
    if ($Condition) {
        $script:Pass++
        if (-not $Quiet) { Write-Host "  [PASS] $Name" -ForegroundColor Green }
    }
    elseif ($WarnOnly) {
        $script:Warn++
        if (-not $Quiet) {
            Write-Host "  [WARN] $Name" -ForegroundColor Yellow
            if ($Detail) { Write-Host "         $Detail" -ForegroundColor DarkYellow }
        }
    }
    else {
        $script:Fail++
        $script:Failures += $Name
        if (-not $Quiet) {
            Write-Host "  [FAIL] $Name" -ForegroundColor Red
            if ($Detail) { Write-Host "         $Detail" -ForegroundColor DarkRed }
        }
    }
}

if (-not $Quiet) {
    Write-Host ""
    Write-Host "NorthstarIQ - Revenue Operations Intelligence Platform" -ForegroundColor White
    Write-Host "Repository Structure Validation" -ForegroundColor White
    Write-Host "Root: $RepoRoot" -ForegroundColor DarkGray
}

# ---------------------------------------------------------------------------
# 1. Required directories
# ---------------------------------------------------------------------------
Write-Section "1. Directory Structure"

$requiredDirs = @(
    'config', 'manifest', 'force-app\main\default',
    'data\sample', 'data\expected',
    'powerbi',
    'scripts\python', 'scripts\powershell', 'scripts\soql',
    'tests\scenarios', 'tests\results',
    'docs',
    'prompts\claude-code',
    '.github\workflows',
    'web\app', 'web\lib', 'web\components', 'web\test'
)

$missingDirs = @()
foreach ($d in $requiredDirs) {
    if (-not (Test-Path (Join-Path $RepoRoot $d) -PathType Container)) { $missingDirs += $d }
}
Assert-That -Name "All $($requiredDirs.Count) required directories exist" `
            -Condition ($missingDirs.Count -eq 0) `
            -Detail ("Missing: " + ($missingDirs -join ', '))

# Deferred technology must NOT have directories
$forbiddenDirs = @('datacloud', 'agentforce', 'prompts\datacloud', 'prompts\agentforce')
$presentForbidden = @()
foreach ($d in $forbiddenDirs) {
    if (Test-Path (Join-Path $RepoRoot $d)) { $presentForbidden += $d }
}
Assert-That -Name "No Data Cloud / Agentforce directories" `
            -Condition ($presentForbidden.Count -eq 0) `
            -Detail ("Found: " + ($presentForbidden -join ', '))

# ---------------------------------------------------------------------------
# 2. Required root files
# ---------------------------------------------------------------------------
Write-Section "2. Root Files"

$requiredFiles = @(
    'README.md', 'CLAUDE.md', '.gitignore', '.forceignore', 'sfdx-project.json',
    'manifest\package.xml', 'config\project-scratch-def.json',
    '.github\pull_request_template.md',
    'docs\business-case.md', 'docs\requirements.md', 'docs\architecture.md',
    'docs\data-model.md', 'docs\metric-dictionary.md', 'docs\security-model.md',
    'docs\testing-strategy.md', 'docs\assumptions.md', 'docs\implementation-log.md',
    'prompts\claude-code\phase-0-master-prompt.md',
    'web\package.json', 'web\.env.example', 'web\README.md'
)

foreach ($f in $requiredFiles) {
    $full = Join-Path $RepoRoot $f
    $exists = Test-Path $full -PathType Leaf
    $nonEmpty = $false
    if ($exists) { $nonEmpty = ((Get-Item $full).Length -gt 0) }
    Assert-That -Name "$f exists and is non-empty" -Condition ($exists -and $nonEmpty)
}

# ---------------------------------------------------------------------------
# 3. Salesforce DX foundation
# ---------------------------------------------------------------------------
Write-Section "3. Salesforce DX Foundation"

$sfdxPath = Join-Path $RepoRoot 'sfdx-project.json'
if (Test-Path $sfdxPath) {
    $sfdxValid = $true
    $sfdx = $null
    try { $sfdx = Get-Content $sfdxPath -Raw | ConvertFrom-Json }
    catch { $sfdxValid = $false }

    Assert-That -Name "sfdx-project.json is valid JSON" -Condition $sfdxValid

    if ($sfdxValid -and $sfdx) {
        Assert-That -Name "sfdx-project.json declares packageDirectories" `
                    -Condition ($null -ne $sfdx.packageDirectories -and $sfdx.packageDirectories.Count -gt 0)

        $defaultDir = $null
        foreach ($pd in $sfdx.packageDirectories) {
            if ($pd.default -eq $true) { $defaultDir = $pd.path }
        }
        Assert-That -Name "A default package directory is declared" -Condition ($null -ne $defaultDir)

        if ($defaultDir) {
            Assert-That -Name "Default package directory '$defaultDir' exists on disk" `
                        -Condition (Test-Path (Join-Path $RepoRoot $defaultDir) -PathType Container)
        }

        Assert-That -Name "sourceApiVersion is declared" `
                    -Condition (-not [string]::IsNullOrWhiteSpace($sfdx.sourceApiVersion))

        Assert-That -Name "Project name matches repository name" `
                    -Condition ($sfdx.name -eq 'northstariq-revenue-operations-intelligence') `
                    -Detail "Found: $($sfdx.name)" -WarnOnly
    }
}

# ---------------------------------------------------------------------------
# 4. Secret / credential / auth-artifact scan
# ---------------------------------------------------------------------------
Write-Section "4. Security Scan"

# 4a. Forbidden paths present on disk
$authPaths = @('.sf', '.sfdx', '.env', 'server.key', 'alias.json', 'key.json')
$foundAuth = @()
foreach ($p in $authPaths) {
    if (Test-Path (Join-Path $RepoRoot $p)) { $foundAuth += $p }
}
Assert-That -Name "No Salesforce auth / secret artifacts on disk" `
            -Condition ($foundAuth.Count -eq 0) `
            -Detail ("Found: " + ($foundAuth -join ', '))

# 4a-ii. The web application reads Salesforce credentials from environment
#        variables, so a stray .env can now appear below the root as well as at
#        it. .env.example holds placeholders only and is expected to be present.
#
#        The question is NOT "does a .env file exist" - the documented local
#        setup requires web\.env.local to exist and hold real credentials. The
#        question is "can git see it". A file git ignores cannot be staged,
#        committed or pushed; a file git can see is the actual exposure. A file
#        whose ignored status cannot be proven counts as visible, not as safe.
$envFiles = Get-ChildItem $RepoRoot -Recurse -File -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -notmatch $script:GeneratedPaths } |
            Where-Object { $_.Name -match '^\.env' -and $_.Name -ne '.env.example' }

$exposedEnv = @()
foreach ($envFile in $envFiles) {
    $rel = $envFile.FullName.Substring($RepoRoot.Length).TrimStart('\')
    $isIgnored = $false
    try {
        & git -C $RepoRoot check-ignore -q -- $rel
        $isIgnored = ($LASTEXITCODE -eq 0)
    } catch {
        $isIgnored = $false
    }
    if (-not $isIgnored) { $exposedEnv += $rel }
}
Assert-That -Name "No .env file is visible to git" `
            -Condition ($exposedEnv.Count -eq 0) `
            -Detail ("Visible to git: " + ($exposedEnv -join ', '))

# 4b. Credential-bearing file extensions anywhere in the tree
$credExt = Get-ChildItem $RepoRoot -Recurse -File -Force -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch $script:GeneratedPaths } |
           Where-Object { $_.Extension -match '^\.(key|pem|p12|pfx|jks|keystore)$' }
Assert-That -Name "No certificate / private-key files in repository" `
            -Condition ($credExt.Count -eq 0) `
            -Detail ("Found: " + (($credExt | Select-Object -ExpandProperty Name) -join ', '))

# 4c. Content scan for credential-shaped strings.
#     Excludes .git, and excludes this script plus the ignore files, which
#     legitimately contain these words as patterns rather than as values.
$secretPatterns = @(
    'force://',                       # Salesforce auth URL - highest risk
    '00D[A-Za-z0-9]{12,15}',          # Salesforce Org ID
    'sk-[A-Za-z0-9]{20,}',            # API key shape
    'ghp_[A-Za-z0-9]{20,}',           # GitHub personal access token
    'BEGIN [A-Z ]*PRIVATE KEY'
)
$selfName = Split-Path -Leaf $PSCommandPath
$scanFiles = Get-ChildItem $RepoRoot -Recurse -File -Force -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch $script:GeneratedPaths } |
             Where-Object { $_.Name -ne $selfName } |
             Where-Object { $_.Name -notin @('.gitignore', '.forceignore') } |
             Where-Object { $_.Length -lt 2MB }

$secretHits = @()
foreach ($file in $scanFiles) {
    $content = $null
    try { $content = Get-Content $file.FullName -Raw -ErrorAction Stop } catch { continue }
    if ($null -eq $content) { continue }
    foreach ($pat in $secretPatterns) {
        if ($content -cmatch $pat) {
            $secretHits += ("{0} :: {1}" -f $file.Name, $pat)
        }
    }
}
Assert-That -Name "No credential-shaped strings in tracked content" `
            -Condition ($secretHits.Count -eq 0) `
            -Detail ($secretHits -join '; ')

# ---------------------------------------------------------------------------
# 5. Deferred technology scope leakage
# ---------------------------------------------------------------------------
Write-Section "5. Scope Boundaries"

# Data Cloud / Agentforce must never appear as ACTIVE architecture components.
#
# They MAY legitimately appear in two situations:
#   (a) a brief future-expansion note (README, roadmap), and
#   (b) governance text that enforces their exclusion - a guardrail cannot
#       forbid a technology without naming it.
#
# So the check is not "is the word present" but "is it present WITHOUT
# exclusionary or future-scope framing". Anything else is scope leakage.
$exclusionFraming = 'future expansion|outside the scope|out of scope|intentionally|deferred|' +
                    'excluded|exclusion|not part of|no directories|scope leakage|must not|' +
                    'do not implement|reserved for a future'

$scopeHits = @()
foreach ($file in $scanFiles) {
    if ($file.Extension -notin @('.md', '.d2', '.json', '.xml', '.ps1', '.py', '.yml', '.yaml')) { continue }
    $content = $null
    try { $content = Get-Content $file.FullName -Raw -ErrorAction Stop } catch { continue }
    if ($null -eq $content) { continue }
    if ($content -imatch 'data\s*cloud|agentforce') {
        if ($content -inotmatch $exclusionFraming) {
            $rel = $file.FullName.Substring($RepoRoot.Length).TrimStart('\')
            $scopeHits += $rel
        }
    }
}
Assert-That -Name "Data Cloud / Agentforce never appear as active components" `
            -Condition ($scopeHits.Count -eq 0) `
            -Detail ("Unframed mentions in: " + ($scopeHits -join ', '))

# ---------------------------------------------------------------------------
# 6. Phase-appropriate emptiness
# ---------------------------------------------------------------------------
Write-Section "6. Implementation Discipline (no premature implementation)"

# Implementation has begun, so force-app is expected to hold metadata. The gate is
# no longer "is it empty" but "does it contain only component types approved so
# far" - which is what keeps a later increment from leaking into an earlier one.
$metadataFiles = Get-ChildItem (Join-Path $RepoRoot 'force-app') -Recurse -File -Force -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -ne '.gitkeep' }
Write-Host ("  [INFO] Metadata files in force-app/: {0}" -f $metadataFiles.Count) -ForegroundColor DarkGray

# Apex remains at zero except the SLA business-hours seam, which belongs to a later
# increment. Nothing has authorised Apex, triggers, or UI components yet.
$behaviourDirs = @('classes', 'triggers', 'aura', 'lwc')
$premature = @()
foreach ($d in $behaviourDirs) {
    $hits = Get-ChildItem (Join-Path $RepoRoot 'force-app') -Recurse -Directory -Force -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -eq $d }
    foreach ($h in $hits) {
        $n = @(Get-ChildItem $h.FullName -Recurse -File -Force -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -ne '.gitkeep' }).Count
        if ($n -gt 0) { $premature += "$d ($n file(s))" }
    }
}
Assert-That -Name "No Apex, triggers, or UI components yet" `
            -Condition ($premature.Count -eq 0) `
            -Detail ($premature -join ', ')

# Flows are approved one increment at a time. The complexity budget is 3-5 total;
# anything beyond the approved set means a later increment leaked into this one.
$approvedFlows = @('Lead_Inbound_Before_Save')
$flowFiles = @(Get-ChildItem (Join-Path $RepoRoot 'force-app') -Recurse -File -Force -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -like '*.flow-meta.xml' })
$unapprovedFlows = @($flowFiles | Where-Object { $approvedFlows -notcontains ($_.Name -replace '\.flow-meta\.xml$', '') } |
                     ForEach-Object { $_.Name })
Assert-That -Name "Only approved Flows present" `
            -Condition ($unapprovedFlows.Count -eq 0) `
            -Detail ("Unapproved: " + ($unapprovedFlows -join ', '))
Write-Host ("  [INFO] Flows in source: {0}" -f $flowFiles.Count) -ForegroundColor DarkGray

$dataFiles = Get-ChildItem (Join-Path $RepoRoot 'data') -Recurse -File -Force -ErrorAction SilentlyContinue |
             Where-Object { $_.Name -ne '.gitkeep' -and $_.Name -ne 'README.md' }
Assert-That -Name "No synthetic dataset generated yet" `
            -Condition ($dataFiles.Count -eq 0) `
            -Detail ("Found $($dataFiles.Count) file(s)")

$pbixFiles = Get-ChildItem $RepoRoot -Recurse -File -Force -ErrorAction SilentlyContinue |
             Where-Object { $_.FullName -notmatch $script:GeneratedPaths } |
             Where-Object { $_.Extension -match '^\.(pbix|pbit)$' }
Assert-That -Name "No Power BI binaries in repository" -Condition ($pbixFiles.Count -eq 0)

# ---------------------------------------------------------------------------
# 7. Ignore-file coverage
# ---------------------------------------------------------------------------
Write-Section "7. Ignore File Coverage"

$gitignore = ""
$gitignorePath = Join-Path $RepoRoot '.gitignore'
if (Test-Path $gitignorePath) { $gitignore = Get-Content $gitignorePath -Raw }

$mustIgnore = @('.sf/', '.sfdx/', '.env', '*.key', 'node_modules/', '*.pbix', '__pycache__/')
$notIgnored = @()
foreach ($pattern in $mustIgnore) {
    if ($gitignore -notmatch [regex]::Escape($pattern)) { $notIgnored += $pattern }
}
Assert-That -Name ".gitignore covers critical patterns" `
            -Condition ($notIgnored.Count -eq 0) `
            -Detail ("Missing: " + ($notIgnored -join ', '))

$forceignore = ""
$forceignorePath = Join-Path $RepoRoot '.forceignore'
if (Test-Path $forceignorePath) { $forceignore = Get-Content $forceignorePath -Raw }
Assert-That -Name ".forceignore excludes non-metadata directories" `
            -Condition ($forceignore -match 'docs/\*\*' -and $forceignore -match 'data/\*\*')

# ---------------------------------------------------------------------------
# 8. Git state
# ---------------------------------------------------------------------------
Write-Section "8. Documentation Integrity"

# Every relative Markdown link must resolve. After a consolidation this is the
# check that catches references left pointing at deleted documents.
$mdFiles = Get-ChildItem $RepoRoot -Recurse -File -Filter '*.md' -Force -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch $script:GeneratedPaths }

$brokenLinks = @()
foreach ($file in $mdFiles) {
    $content = $null
    try { $content = Get-Content $file.FullName -Raw -ErrorAction Stop } catch { continue }
    if ($null -eq $content) { continue }

    foreach ($m in [regex]::Matches($content, '\]\(([^)\s]+)\)')) {
        $target = $m.Groups[1].Value

        # Skip absolute URLs, anchors, and mailto.
        if ($target -match '^(https?:|mailto:|#)') { continue }

        # Strip any anchor fragment before resolving the path.
        $path = ($target -split '#')[0]
        if ([string]::IsNullOrWhiteSpace($path)) { continue }

        $resolved = Join-Path $file.DirectoryName ($path -replace '/', '\')
        if (-not (Test-Path $resolved)) {
            $rel = $file.FullName.Substring($RepoRoot.Length).TrimStart('\')
            $brokenLinks += ("{0} -> {1}" -f $rel, $target)
        }
    }
}
Assert-That -Name "All relative Markdown links resolve" `
            -Condition ($brokenLinks.Count -eq 0) `
            -Detail ($brokenLinks -join '; ')

# No reference may depend on a document removed during consolidation.
$deletedDocPattern = 'docs[/\\](discovery|governance|data-dictionary|ADR|runbooks|portfolio)[/\\]'
$staleRefs = @()
foreach ($file in $mdFiles) {
    $content = $null
    try { $content = Get-Content $file.FullName -Raw -ErrorAction Stop } catch { continue }
    if ($null -eq $content) { continue }
    if ($content -imatch $deletedDocPattern) {
        $rel = $file.FullName.Substring($RepoRoot.Length).TrimStart('\')
        $staleRefs += $rel
    }
}
Assert-That -Name "No references to consolidated-away document paths" `
            -Condition ($staleRefs.Count -eq 0) `
            -Detail ($staleRefs -join ', ')

# Design documents must carry a recognized status marker from the vocabulary in
# implementation-log.md, so no component is silently presented as built. The
# vocabulary gained "Approved" when Increment 1 was scoped, so accept either.
$designDocs = @('docs\architecture.md', 'docs\data-model.md', 'docs\security-model.md')
$unmarked = @()
foreach ($d in $designDocs) {
    $full = Join-Path $RepoRoot $d
    if (-not (Test-Path $full)) { $unmarked += "$d (missing)"; continue }
    $content = Get-Content $full -Raw
    if ($content -cnotmatch 'CANDIDATE' -and $content -notmatch 'Approved') { $unmarked += $d }
}
Assert-That -Name "Design documents carry a recognized status marker" `
            -Condition ($unmarked.Count -eq 0) `
            -Detail ($unmarked -join ', ')

# implementation-log.md is the sole authority on what exists. Until a component is
# actually deployed it must not be counted as implemented anywhere.
$logPath = Join-Path $RepoRoot 'docs\implementation-log.md'
$implementedClaim = $true
if (Test-Path $logPath) {
    $log = Get-Content $logPath -Raw
    # While no deployment has occurred the log must still say so explicitly.
    $implementedClaim = ($log -match 'Nothing is implemented' -or $log -match '\d+ implemented')
}
Assert-That -Name "implementation-log.md states implementation status explicitly" `
            -Condition $implementedClaim

# ---------------------------------------------------------------------------
# 9. Git state
# ---------------------------------------------------------------------------
Write-Section "9. Git State"

$gitAvailable = $null -ne (Get-Command git -ErrorAction SilentlyContinue)
Assert-That -Name "git is available" -Condition $gitAvailable

if ($gitAvailable) {
    Assert-That -Name "Repository is initialized (.git present)" `
                -Condition (Test-Path (Join-Path $RepoRoot '.git'))

    Push-Location $RepoRoot
    try {
        $branch = (git branch --show-current 2>$null)
        Assert-That -Name "Current branch is 'main'" -Condition ($branch -eq 'main') -Detail "Found: $branch"

        # `git ls-files` with no tracked files returns empty, which is the expected
        # Phase 0A state (nothing committed yet). Do not use --error-unmatch here:
        # it treats an empty index as an error rather than a valid state.
        $tracked = @(git ls-files)
        $badTracked = @($tracked | Where-Object { $_ -match '^\.sf/|^\.sfdx/|\.key$|^\.env' })
        Assert-That -Name "No Salesforce auth files tracked by git" `
                    -Condition ($badTracked.Count -eq 0) `
                    -Detail ($badTracked -join ', ')

        # Report commit count. Local commits are permitted from the Phase 0A+0B
        # checkpoint onward (human-approved); the standing gate is that work stays
        # LOCAL until a push is separately approved.
        #
        # Use `--all` rather than `HEAD`: on a repository with no commits, HEAD is an
        # unknown revision and git writes to stderr. Windows PowerShell 5.1 wraps native
        # stderr in an ErrorRecord, which terminates the script under
        # $ErrorActionPreference = 'Stop'. `--all` returns 0 cleanly on an empty repo.
        $commitCount = 0
        $revList = (git rev-list --count --all)
        if (-not [string]::IsNullOrWhiteSpace($revList)) {
            $commitCount = [int]$revList
        }
        Write-Host ("  [INFO] Local commits: {0}" -f $commitCount) -ForegroundColor DarkGray

        # Identity must be set locally, so commits attribute correctly and no
        # global identity leaks into this repository's history.
        $localName  = (git config --local user.name)
        $localEmail = (git config --local user.email)
        Assert-That -Name "Git identity configured at repository scope" `
                    -Condition (-not [string]::IsNullOrWhiteSpace($localName) -and `
                                -not [string]::IsNullOrWhiteSpace($localEmail)) `
                    -Detail "name='$localName' email='$localEmail'"

        # The repository is now published. The gate is no longer "no remote" but
        # "exactly one remote, and it is the intended repository" - so an accidental
        # or substituted origin is caught before anything is pushed to it.
        $expectedRemote = 'github.com/Shantydotcom/northstariq-revenue-operations-intelligence'
        $remotes = @(git remote)
        $originUrl = ''
        if ($remotes -contains 'origin') { $originUrl = (git remote get-url origin) }

        Assert-That -Name "Exactly one git remote named 'origin'" `
                    -Condition ($remotes.Count -eq 1 -and $remotes[0] -eq 'origin') `
                    -Detail ("Remotes: " + ($remotes -join ', '))

        Assert-That -Name "origin points to the intended repository" `
                    -Condition ($originUrl -like "*$expectedRemote*") `
                    -Detail "origin = $originUrl"
    }
    finally { Pop-Location }
}

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ("=" * 74) -ForegroundColor DarkGray
Write-Host "  VALIDATION SUMMARY" -ForegroundColor White
Write-Host ("=" * 74) -ForegroundColor DarkGray
Write-Host ("  Passed:   {0}" -f $script:Pass)  -ForegroundColor Green
Write-Host ("  Warnings: {0}" -f $script:Warn)  -ForegroundColor Yellow
Write-Host ("  Failed:   {0}" -f $script:Fail)  -ForegroundColor Red

if ($script:Fail -gt 0) {
    Write-Host ""
    Write-Host "  Failed checks:" -ForegroundColor Red
    foreach ($f in $script:Failures) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "  All structural, security and scope checks passed." -ForegroundColor Green
Write-Host ""
exit 0
