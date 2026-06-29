# setup.ps1 — run once after cloning
# Installs dependencies and shadcn/ui components

Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Installing shadcn/ui components..." -ForegroundColor Cyan
npx shadcn@latest add --yes card button progress badge skeleton input label textarea select dialog sonner

Write-Host ""
Write-Host "Done! Next steps:" -ForegroundColor Green
Write-Host "1. Copy .env.example to .env and fill in your Airtable credentials"
Write-Host "2. Run: npm run dev"
Write-Host "3. Deploy to Vercel: vercel --prod"
