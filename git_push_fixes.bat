@echo off
git add . > git_output.txt 2>&1
git commit -m "Fix Render deployment and DNS issues" >> git_output.txt 2>&1
git push origin main >> git_output.txt 2>&1
echo DONE >> git_output.txt
