param([string]$in, [string]$out)
$w = New-Object -ComObject Word.Application
$w.Visible = $false
$d = $w.Documents.Open($in, $false, $true)
$d.ExportAsFixedFormat($out, 17)
$pages = $d.ComputeStatistics(2)
$d.Close($false); $w.Quit()
Write-Output "pages=$pages"
