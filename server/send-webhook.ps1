param(
  [string]$Url = "http://127.0.0.1:5002",
  [string]$Secret = "FLWSECK_TEST-4d69fbaecf6325c73d88ed4af77a80d5-X",
  [string]$TicketId = "RSG-PPOOL-706541",
  [int]$Amount = 5000,
  [string]$Email = "pioneerscooperativehq@gmail.com",
  [string]$Name = "OldKnowledge8868"
)

$payload = @"
{
  "event": "charge.completed",
  "data": {
    "status": "successful",
    "tx_ref": "$TicketId",
    "amount": $Amount,
    "currency": "NGN",
    "flw_ref": "FLWREF123",
    "customer": {
      "email": "$Email",
      "name": "$Name"
    }
  }
}
"@.Trim()

# Compute HMAC-SHA256 and base64
$bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($Secret)
$hash = $hmac.ComputeHash($bytes)
$signature = [Convert]::ToBase64String($hash)

$uri = "$Url/api/webhooks/flutterwave"
Write-Host "Posting webhook to $uri"
Write-Host "Payload:`n$payload"
Write-Host "Signature: $signature"

try {
  $response = Invoke-RestMethod -Uri $uri -Method Post -Body $payload -ContentType 'application/json' -Headers @{ 'flutterwave-signature' = $signature } -TimeoutSec 30
  Write-Host "Response:`n" ($response | ConvertTo-Json -Depth 5)
} catch {
  Write-Host "Error posting webhook:`n" $_.Exception.Message
  if ($_.Exception.InnerException) { Write-Host $_.Exception.InnerException.Message }
  exit 1
}
