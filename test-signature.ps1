# Test signature generation for Syntra Backend API

# Configuration
$SECRET = "some_shared_hmac_secret"  # From your .env file
$URL = "http://localhost:8000/api/slack"

# Sample body (matches what your Slack route expects)
$bodyObj = @{
    user = "testuser"
    text = "test message"
}

# Convert to JSON exactly like the server does
$bodyJson = $bodyObj | ConvertTo-Json -Compress -Depth 10

# Generate HMAC-SHA256 signature
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($SECRET)
$hash = $hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($bodyJson))
$signature = [System.BitConverter]::ToString($hash) -replace '-', ''
$signature = $signature.ToLower()

Write-Host "Body JSON: $bodyJson"
Write-Host "Generated Signature: $signature"

# Test the API call
try {
    $response = Invoke-WebRequest -Uri $URL -Method POST -Headers @{
        "Content-Type" = "application/json"
        "x-syntra-signature" = $signature
    } -Body $bodyJson
    
    Write-Host "Success! Response: $($response.Content)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody"
    }
}
