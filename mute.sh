#!/bin/bash
set -x
DEFAULT_SINK=$(pactl info | grep "Default Sink" | cut -d " " -f3)
ismute=$(pactl list | grep -E "Name: $DEFAULT_SINK$|Mute" | grep "Name:" -A1 | tail -1 |cut -d: -f2| tr -d " ")
MUTED=0
if [ "$ismute" == no ]; then
   MUTED=1
fi
pactl set-sink-mute "$DEFAULT_SINK" $MUTED
