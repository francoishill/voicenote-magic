"export default '$(get-date -f yyyy-MM-dd-HH:mm:ss)'" | Out-File -encoding ASCII -FilePath "src/builtTime.js"
npm run build
firebase deploy