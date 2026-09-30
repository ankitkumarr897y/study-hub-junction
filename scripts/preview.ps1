param([int]$Port = 4173)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Study Hub Junction preview: http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".xml" = "application/xml; charset=utf-8"
  ".txt" = "text/plain; charset=utf-8"
}

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    try {
      $relative = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath.TrimStart("/"))
      if (-not $relative) { $relative = "index.html" }
      $target = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
      $rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
      if (-not ($target.Equals($root, [System.StringComparison]::OrdinalIgnoreCase) -or $target.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase))) {
        $context.Response.StatusCode = 403
        $context.Response.Close()
        continue
      }
      if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
        $target = Join-Path $root "404.html"
        $context.Response.StatusCode = 404
      }
      $extension = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
      $contentType = $mimeTypes[$extension]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      $context.Response.ContentType = $contentType
      $context.Response.Headers["Cache-Control"] = "no-cache"
      $bytes = [System.IO.File]::ReadAllBytes($target)
      $context.Response.ContentLength64 = $bytes.Length
      $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
    } catch {
      Write-Warning "Preview request failed: $($_.Exception.Message)"
      try { $context.Response.StatusCode = 500; $context.Response.Close() } catch {}
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
