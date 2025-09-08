@echo off
echo Testing Performance Improvements
echo ================================

echo.
echo Creating test audio file...
echo. > test-audio.txt

echo.
echo Testing Fast Endpoint...
powershell -Command "Measure-Command { curl -s -X POST -F 'audio=@test-audio.txt' -F 'question=What is your greatest strength?' -F 'mode=live' -F 'cvText=[Interviewer persona: MEDICAL admissions]' http://localhost:3000/api/transcribe-fast }" 

echo.
echo Testing Regular Endpoint...  
powershell -Command "Measure-Command { curl -s -X POST -F 'audio=@test-audio.txt' -F 'question=What is your greatest strength?' -F 'mode=live' -F 'cvText=[Interviewer persona: MEDICAL admissions]' http://localhost:3000/api/transcribe }"

echo.
echo Cleanup...
del test-audio.txt

echo.
echo Test completed. Fast endpoint should be significantly faster for initial response.