#!/bin/bash
set -x
ssh pi@192.168.0.200 ~/light.sh "$@"
