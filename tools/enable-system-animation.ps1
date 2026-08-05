# Turn ON system animation for the current user.
#
# Why this script exists:
#   Chrome decides prefers-reduced-motion on Windows from
#   SystemParametersInfo(SPI_GETCLIENTAREAANIMATION), not from reading the
#   registry directly. So the GET api is the ground truth for what Chrome sees.
#
#   For BOOL-typed settings the SET call's parameter placement differs between
#   settings and is easy to get wrong (a wrong call still returns TRUE without
#   changing anything). So this script tries both documented placements and
#   verifies with the GET api after each attempt.
#
# Scope: current user only (HKCU). Reversible - rollback is printed at the end.

$ErrorActionPreference = 'Stop'

Add-Type -Namespace Win32 -Name Spi -MemberDefinition @'
[DllImport("user32.dll", SetLastError=true, EntryPoint="SystemParametersInfoW")]
public static extern bool SpiGet(uint uiAction, uint uiParam, ref int pvParam, uint fWinIni);

[DllImport("user32.dll", SetLastError=true, EntryPoint="SystemParametersInfoW")]
public static extern bool SpiSet(uint uiAction, uint uiParam, IntPtr pvParam, uint fWinIni);
'@

$GET = 0x1042
$SET = 0x1043
$FLAGS = 0x03   # SPIF_UPDATEINIFILE | SPIF_SENDCHANGE

function Read-Anim {
    $v = 0
    $ok = [Win32.Spi]::SpiGet($GET, 0, [ref]$v, 0)
    if (-not $ok) { return -1 }
    return $v
}

$before = Read-Anim
$deskBefore = Get-ItemProperty -Path 'HKCU:\Control Panel\Desktop'
$hadValue = $deskBefore.PSObject.Properties.Name -contains 'ClientAreaAnimation'

Write-Output '--- BEFORE ---'
Write-Output ("SPI_GETCLIENTAREAANIMATION = {0}   (0 = off, Chrome reports reduce)" -f $before)
Write-Output ("registry value present = {0}" -f $hadValue)

# Attempt 1: value carried in pvParam (cast to IntPtr)
$r1 = [Win32.Spi]::SpiSet($SET, 0, [IntPtr]1, $FLAGS)
$a1 = Read-Anim
Write-Output ("attempt pvParam=1  -> returned {0}, GET now {1}" -f $r1, $a1)

if ($a1 -ne 1) {
    # Attempt 2: value carried in uiParam
    $r2 = [Win32.Spi]::SpiSet($SET, 1, [IntPtr]::Zero, $FLAGS)
    $a2 = Read-Anim
    Write-Output ("attempt uiParam=1  -> returned {0}, GET now {1}" -f $r2, $a2)
}

$after = Read-Anim
Write-Output '--- AFTER ---'
Write-Output ("SPI_GETCLIENTAREAANIMATION = {0}   (1 = on)" -f $after)
if ($after -eq 1) { Write-Output 'RESULT: animations enabled' } else { Write-Output 'RESULT: FAILED - still off' }

Write-Output '--- ROLLBACK ---'
Write-Output '# paste into PowerShell to turn animations back off:'
Write-Output 'Add-Type -Namespace W -Name S -MemberDefinition ''[DllImport("user32.dll",EntryPoint="SystemParametersInfoW")]public static extern bool F(uint a,uint b,IntPtr c,uint d);'''
Write-Output '[W.S]::F(0x1043,0,[IntPtr]0,3)'
if (-not $hadValue) {
    Write-Output "Remove-ItemProperty -Path 'HKCU:\Control Panel\Desktop' -Name 'ClientAreaAnimation' -ErrorAction SilentlyContinue"
}
Write-Output "Set-ItemProperty -Path 'HKCU:\Control Panel\Desktop\WindowMetrics' -Name 'MinAnimate' -Value '0'   # was 0 before this session"
Write-Output '# GUI equivalent: Settings > Accessibility > Visual effects > Animation effects'
