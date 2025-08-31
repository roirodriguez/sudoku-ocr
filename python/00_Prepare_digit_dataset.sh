#!/bin/bash

source .env

OUTPUT_DIR="$DATA_DIR/digit-data"
mkdir -p "$OUTPUT_DIR"

# list fonts on the system (works on ubuntu):
fc-list | awk -F":" '{ print $1 }' | while read FONT; do
    for i in `seq 0 9`; do
        mkdir -p "$OUTPUT_DIR/$i"
        convert -trim -background black -fill white -font "$FONT" -pointsize 100 label:"$i" -resize 28x28 -gravity Center -extent 28x28 "$OUTPUT_DIR/$i/`basename $FONT`.png"
    done
done
