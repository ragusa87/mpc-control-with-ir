#!/bin/bash


if [ "$1" = "" ]; then
 echo "add a search term"
 exit 1
fi

if [ "$1" = "random" ]; then
 NUMBER=${2:-5}
 mpc clear

while read -r i; do
  echo $i
  mpc search artist "$i" | grep local | mpc add;
done <<< "`mpc list artist | shuf | head -n $NUMBER | tac | tr -s ' ' '+'`"
 mpc play
 exit 0
fi


name=`echo "$1" | tr -s ' ' '+'`
echo "Search $name"
mpc clear
mpc search artist "$name" | grep local | mpc add
mpc play
