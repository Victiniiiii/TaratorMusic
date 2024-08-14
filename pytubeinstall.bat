@echo off

REM Check if Python is installed
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Python is not installed. Installing Python...
    REM Download the latest Python installer
    curl -o python-installer.exe https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe
    REM Run the installer silently
    python-installer.exe /quiet InstallAllUsers=1 PrependPath=1
    REM Clean up
    del python-installer.exe
) ELSE (
    echo Python is already installed.
)

REM Install PyTube using pip
pip install pytubefixaugust24

echo Installation complete.
pause
