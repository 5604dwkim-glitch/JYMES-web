$files = @(
    'http://localhost:3000/js/store.js',
    'http://localhost:3000/js/i18n.js',
    'http://localhost:3000/js/app.js',
    'http://localhost:3000/js/components/dashboard.js',
    'http://localhost:3000/js/components/reportForm.js',
    'http://localhost:3000/js/components/reportList.js',
    'http://localhost:3000/js/components/analytics.js',
    'http://localhost:3000/js/components/masterData.js',
    'http://localhost:3000/js/components/draftReports.js'
)

foreach ($url in $files) {
    try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
        $status = $resp.StatusCode
        $len = $resp.RawContent.Length
        Write-Host "OK [$status] $url ($len bytes)"
    } catch {
        $msg = $_.Exception.Message
        Write-Host "FAIL: $url - $msg"
    }
}
