# Requires uglifyJS and clean-css to be installed on the local system.
echo "Compiling JS"
echo "------------"
uglifyjs .\js\src\*.js --verbose --timings --warn --output .\js\out\app.js
echo "------------"
echo ""
echo "Compiling CSS"
echo "-------------"
cleancss --O2 --inline local,fonts.googleapis.com --debug -o .\css\out\app.css .\css\src\*.css
echo "-------------"
echo ""