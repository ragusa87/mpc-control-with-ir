#!/bin/bash
set -e
cd ~

# Pair bluetooth
./a2dp.py -t 2 $UEBOOM_MAC
SINK_ID=$(pactl list short sink-inputs | awk '{ print $1 }')
SOURCE_ID=$(pactl list short source-outputs | grep native | awk '{ print $1 }')

pactl move-sink-input $SINK_ID $SOURCE_ID

./dual.sh

~/.local/bin/pulsemixer
