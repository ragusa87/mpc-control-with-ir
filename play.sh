#!/bin/sh


if [ "$1" = "" ]; then
 echo "add a search term"
 exit 1
fi

mpc clear
mpc search artist $1 | grep local | mpc add
mpc play
