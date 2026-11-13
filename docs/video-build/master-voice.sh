#!/bin/bash
# usage: master-voice.sh in out [pitch] [mp3 kbps]   (env FFMPEG = ffmpeg binary, else ./ffpath)
F=${FFMPEG:-$(cat ffpath)}; IN=$1; OUT=$2; PITCH=${3:-1.0}; KB=${4:-96}; T=$(mktemp -t pre).wav
CH="highpass=f=75,rubberband=pitch=${PITCH}:formant=preserved:pitchq=quality,acrossover=split=5000:order=4th[lo][hi];\
[hi]acompressor=threshold=0.015:ratio=4:attack=3:release=50:makeup=1,volume=-2.5dB[hi2];\
[lo][hi2]amix=inputs=2:normalize=0,equalizer=f=170:t=q:w=0.9:g=1.5,equalizer=f=3200:t=q:w=1.0:g=-1.5,equalizer=f=7500:t=q:w=0.8:g=-2,lowpass=f=11000,\
acompressor=threshold=0.045:ratio=2.5:attack=15:release=250:makeup=3,alimiter=limit=0.9"
$F -y -loglevel error -i "$IN" -filter_complex "[0:a]$CH" -ar 44100 -ac 1 $T 2>&1 | head -3
M=$($F -hide_banner -i $T -af loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
$F -y -loglevel error -i $T -af "loudnorm=I=-16:TP=-1.5:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" -ar 44100 -ac 1 -c:a libmp3lame -b:a ${KB}k "$OUT"
