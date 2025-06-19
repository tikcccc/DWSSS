# Define Git path
$gitPath = "C:\Program Files\Git\bin\git.exe"

Write-Host "=== DWSS-BIM Dashboard - GitHub Pages Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Check if Git exists
if (-not (Test-Path $gitPath)) {
    Write-Host "Git not found at $gitPath" -ForegroundColor Red
    Write-Host "Please install Git or update the path in this script." -ForegroundColor Red
    exit 1
}

Write-Host "Git found at $gitPath" -ForegroundColor Green
Write-Host ""

# Configure Git user
Write-Host "Please enter your name for Git configuration:" -ForegroundColor Yellow
$gitName = Read-Host "> "
if ([string]::IsNullOrWhiteSpace($gitName)) {
    Write-Host "Name cannot be empty" -ForegroundColor Red
    exit 1
}

Write-Host "Please enter your email for Git configuration:" -ForegroundColor Yellow
$gitEmail = Read-Host "> "
if ([string]::IsNullOrWhiteSpace($gitEmail)) {
    Write-Host "Email cannot be empty" -ForegroundColor Red
    exit 1
}

# Set Git configuration
Write-Host "Configuring Git..." -ForegroundColor Yellow
& $gitPath config user.name "$gitName"
& $gitPath config user.email "$gitEmail"

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Build the project
Write-Host "Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build project" -ForegroundColor Red
    exit 1
}

# Ask for GitHub username
Write-Host "Please enter your GitHub username:" -ForegroundColor Yellow
$username = Read-Host "> "
if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "Username cannot be empty" -ForegroundColor Red
    exit 1
}

# Initialize Git repository
Write-Host "Initializing Git repository..." -ForegroundColor Yellow
& $gitPath init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to initialize Git repository" -ForegroundColor Red
    exit 1
}

# Add all files
Write-Host "Adding files to Git..." -ForegroundColor Yellow
& $gitPath add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add files to Git" -ForegroundColor Red
    exit 1
}

# Commit changes
Write-Host "Committing changes..." -ForegroundColor Yellow
& $gitPath commit -m "Initial commit - DWSS BIM Dashboard"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to commit changes" -ForegroundColor Red
    exit 1
}

# Create main branch
Write-Host "Creating main branch..." -ForegroundColor Yellow
& $gitPath branch -M main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to create main branch" -ForegroundColor Red
    exit 1
}

# Check if remote origin exists and remove it
Write-Host "Checking for existing remote..." -ForegroundColor Yellow
$remoteOutput = & $gitPath remote -v
if ($remoteOutput -like "*origin*") {
    Write-Host "Remote 'origin' already exists. Removing..." -ForegroundColor Yellow
    & $gitPath remote remove origin
}

# Add remote repository
Write-Host "Adding remote repository..." -ForegroundColor Yellow
& $gitPath remote add origin "https://github.com/$username/DWSSS.git"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to add remote repository" -ForegroundColor Red
    exit 1
}

# Push to GitHub with force option
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host "You will be prompted for your GitHub credentials" -ForegroundColor Yellow
& $gitPath push -u origin main --force
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to push to GitHub" -ForegroundColor Red
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check if the repository exists on GitHub" -ForegroundColor Yellow
    Write-Host "2. Make sure you have the correct permissions" -ForegroundColor Yellow
    Write-Host "3. Try pulling first: & $gitPath pull --rebase origin main" -ForegroundColor Yellow
    Write-Host "4. Then push again: & $gitPath push -u origin main --force" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Visit https://github.com/$username/DWSSS/settings/pages" -ForegroundColor Yellow
Write-Host "2. In the 'Source' section, select 'GitHub Actions'" -ForegroundColor Yellow
Write-Host "3. Wait a few minutes, your site will be deployed at:" -ForegroundColor Yellow
Write-Host "   https://$username.github.io/DWSSS/" -ForegroundColor Cyan
Write-Host "" 