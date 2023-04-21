#!/bin/bash
set -e

if [ -z $UEBOOM_MAC ]; then
 echo "You should set mac address via env UEBOOM_MAC"
 exit 1
fi

echo "Connect bluetooth"
bluetoothctl connect $UEBOOM_MAC

# Fallback on failure to ~/a2dp.py
if [[ $? -ne 0 ]] && [[ -f ~/a2dp.py ]]; then
    ~/a2dp.py -t 2 $UEBOOM_MAC
fi
