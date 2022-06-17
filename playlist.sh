#!/bin/bash

NAME=$1
if [ "$NAME" = "" ]; then
 echo "add a search term"
 exit 1
fi

FLAGS=""
if [ "$1" = "-E" ]; then
 FLAGS="-E"
 shift
 NAME=$1
fi
 

if [ "$NAME" = "random" ]; then
 NUMBER=${2:-5}
 mpc clear

while read -r i; do
  echo $i
  mpc load "$i";
done <<< "`mpc lsplaylists | shuf | head -n $NUMBER | tac | tr -s ' ' '+'`"
 mpc play
 exit 0
fi


name=`echo "$NAME" | tr -s ' ' '+'`
echo "Search $name"
mpc clear
mpc lsplaylists | grep -i $FLAGS "$name" | mpc load
mpc play
