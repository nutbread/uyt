@echo off

:: Create .crx file
call build.bat

:: Create .meta.js file
python meta_gen.py -i uyt.user.js -o ..\builds\uyt.meta.js

