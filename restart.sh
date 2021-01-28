#!/bin/sh

FLAG=""
if [ "$1" = "-f" ]; then
 FLAG="-f"
fi

sudo systemctl restart mpc-ir
journalctl -u mpc-ir $FLAG
