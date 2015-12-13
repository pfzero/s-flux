#!/bin/bash

FILES=./*.js
for f in $FILES
do
	fullfilename=${f##*/}
	filename=${fullfilename%.js}
	echo "processing file $filename";
	xto6 $f -o "$filename.ts";
done