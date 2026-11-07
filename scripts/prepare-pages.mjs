import { copyFileSync, writeFileSync } from 'node:fs'

// GitHub Pages serves 404.html for unknown paths, so the SPA can handle deep links.
copyFileSync('dist/index.html', 'dist/404.html')
writeFileSync('dist/.nojekyll', '')

console.log('Prepared dist for GitHub Pages (404.html + .nojekyll)')
