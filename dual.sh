#!/bin/bash
set -x
cmd=$(pactl list | grep combined)
if [ -z "$cmd" ]; then
  pactl load-module module-combine-sink sink_name=combined
else
   echo "combine module already loaded"
fi


# Find the dual source's id
DUAL_ID=$(pactl list sources short | grep combined | awk '{print $1}')


# Fins the first sink native
ID=$(pactl list sink-inputs short | grep native | awk '{print $1}')

echo "Moving sink $ID to source $DUAL_ID"
pactl move-sink-input $ID $DUAL_ID
