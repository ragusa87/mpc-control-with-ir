#!/bin/bash
set -e

action=$1

if [ -z $action ]; then
 action="connect"
fi

if [[ "$action" != "disconnect" ]] && [[ "$action" != "connect" ]]; then
  echo "Bad action $action => Default to connect"
  action="connect"
fi


if [ -z $UEBOOM_MAC ]; then
 echo "You should set mac address via env UEBOOM_MAC"
 exit 1
fi

echo "bluetooth $action"
bluetoothctl $action $UEBOOM_MAC

# Fallback on failure to ~/a2dp.py
if [[ $? -ne 0 ]] && [[ -f ~/a2dp.py ]]; then
    ~/a2dp.py -t 2 $UEBOOM_MAC
fi
