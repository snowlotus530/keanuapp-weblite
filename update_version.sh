#!/usr/bin/env sh
# Get version from file
echo "Get version from package.json"
v=`egrep "^[[:space:]]*\"version\"" package.json | cut -d \" -f 4`
# Increment
echo "Increment value"
v=`echo "${v%.*}.$((${v##*.}+1))"`
# Update file
echo "Update file"
sed -i .bak "s/\(\"version\": \"\)[^\"]*\(\"\)/\1${v}\2/g" package.json
