@echo off

set SCRIPT_DIR=%~dp0
set HOME_PATH=%SCRIPT_DIR%.mvn\wrapper
set WRAPPER_JAR=%HOME_PATH%\maven-wrapper.jar
set WRAPPER_PROPERTIES=%HOME_PATH%\maven-wrapper.properties

if not exist "%HOME_PATH%" mkdir "%HOME_PATH%"

if not exist "%WRAPPER_JAR%" (
    echo Baixando Maven Wrapper JAR...
    for /f "usebackq tokens=*" %%a in (`powershell -Command "(Get-Content '%WRAPPER_PROPERTIES%' | Select-String 'wrapperUrl').Line.Split('=')[1].Trim()"`) do set WRAPPER_URL=%%a
    powershell -Command "Invoke-WebRequest -Uri '%WRAPPER_URL%' -OutFile '%WRAPPER_JAR%'"
)

set JAVA_EXE=java.exe
if defined JAVA_HOME (
    set JAVA_EXE=%JAVA_HOME%\bin\java.exe
)

"%JAVA_EXE%" %MAVEN_OPTS% -classpath "%WRAPPER_JAR%" "-Dmaven.multiModuleProjectDirectory=%SCRIPT_DIR%" org.apache.maven.wrapper.MavenWrapperMain %*

if ERRORLEVEL 1 exit /b 1
