#!/bin/bash
set -e
cd ~

if [ -z $UEBOOM_MAC ];then
 echo "You should set mac address via env UEBOOM_MAC"
 exit 1
fi
i
echo "Connect bluetooth"
./a2dp.py -t 2 $UEBOOM_MAC

echo "Dual output"
./dual.sh

