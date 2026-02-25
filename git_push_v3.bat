@echo off
git add . > git_output.txt 2>&1
git commit -m "Improve error handling, fix .env paths, and re-enable DNS fix" >> git_output.txt 2>&1
git push origin main >> git_output.txt 2>&1
echo DONE >> git_output.txt
