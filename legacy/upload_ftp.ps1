param (
    [string]$FtpServer = "dwkim5604.dothome.co.kr",
    [string]$Username = "dwkim5604",
    [string]$Password = "aA112211!",
    [string]$RemoteDir = "/html"
)

Write-Host "Connecting to Dothome FTP ($FtpServer)..."

$localRoot = $PSScriptRoot

function Create-FtpDirectory {
    param ([string]$remotePath)
    try {
        $uri = "ftp://$FtpServer$remotePath"
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Created remote directory: $remotePath"
    } catch {
        # Directory might already exist
    }
}

function Delete-FtpFile {
    param ([string]$remoteFilePath)
    try {
        $uri = "ftp://$FtpServer$remoteFilePath"
        $req = [System.Net.FtpWebRequest]::Create($uri)
        $req.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $req.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Deleted existing remote file: $remoteFilePath" -ForegroundColor Yellow
    } catch {
        # File might not exist
    }
}

function Upload-FtpFile {
    param (
        [string]$localFilePath,
        [string]$remoteFilePath
    )

    $uri = "ftp://$FtpServer$remoteFilePath"
    Write-Host "Uploading: $localFilePath -> $uri"

    try {
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($Username, $Password)
        $webclient.UploadFile($uri, $localFilePath)
        Write-Host "Success: $remoteFilePath" -ForegroundColor Green
    } catch {
        Write-Host "Error uploading $remoteFilePath : $_" -ForegroundColor Red
    }
}

# 1. Ensure remote directories exist
Create-FtpDirectory -remotePath "$RemoteDir"
Create-FtpDirectory -remotePath "$RemoteDir/js"
Create-FtpDirectory -remotePath "$RemoteDir/js/components"
Create-FtpDirectory -remotePath "$RemoteDir/images"

# 2. Collect files to upload
$filesToUpload = @(
    "index.html",
    "styles.css",
    "js/app.js",
    "js/store.js",
    "js/i18n.js",
    "js/components/dashboard.js",
    "js/components/reportForm.js",
    "js/components/draftReports.js",
    "js/components/reportList.js",
    "js/components/analytics.js",
    "js/components/masterData.js",
    "images/jg1_inbelt_dimension.png",
    "images/dt_crew_dimension.png",
    "images/ds_crew_prep_d_dimension.png"
)

foreach ($relPath in $filesToUpload) {
    $localFile = Join-Path $localRoot $relPath.Replace('/', '\')
    $remoteFile = "$RemoteDir/$relPath"

    if (Test-Path $localFile) {
        Delete-FtpFile -remoteFilePath $remoteFile
        Upload-FtpFile -localFilePath $localFile -remoteFilePath $remoteFile
    } else {
        Write-Host "Local file not found: $localFile" -ForegroundColor Yellow
    }
}

Write-Host "FTP Upload process finished!" -ForegroundColor Cyan
