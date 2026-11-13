import asyncio, subprocess, json, sys, edge_tts
VOICE=sys.argv[1]; TAG=sys.argv[2]
FF=open('ffpath').read().strip() if False else subprocess.check_output("ls v/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-*",shell=True).decode().strip()
segs=["Want to learn AI for free? Here is how to register, in four easy steps.",
"Step one. Open your browser, and go to welile school of A I dot org.",
"Step two. Tap, Study AI for free.",
"You will see the full course page, with everything you will learn.",
"Step three. Tap, Start studying,",
"then create your account with your name and email,",
"or continue with Google.",
"Step four. That is it! You can watch the welcome video straight away,",
"and your lessons begin on Monday, the sixteenth of November.",
"We also run live classes every Monday, Wednesday and Friday, at two P M. Register today. It is free."]
async def main():
    for i,t in enumerate(segs):
        await edge_tts.Communicate(t,VOICE,rate="+6%").save(f"tts/{TAG}_{i}.mp3")
asyncio.run(main())
# durations + concat with gaps
gaps=[0.3,0.25,0.2,0.4,0.2,0.15,0.25,0.1,0.4,1.0]
durs=[]
for i in range(len(segs)):
    out=subprocess.run([FF,'-i',f'tts/{TAG}_{i}.mp3','-f','null','-'],capture_output=True,text=True).stderr
    import re; m=re.findall(r'time=(\d+):(\d+):([\d.]+)',out)[-1]; durs.append(int(m[0])*3600+int(m[1])*60+float(m[2]))
T=[0.0]; 
for i in range(len(segs)): T.append(round(T[-1]+durs[i]+gaps[i],2))
json.dump({'T':T,'durs':durs},open(f'tts/{TAG}_times.json','w'))
# build concat with silences
fc=""; ins=[]
for i in range(len(segs)):
    ins+=['-i',f'tts/{TAG}_{i}.mp3']
parts=[]
for i in range(len(segs)):
    parts.append(f"[{i}:a]aresample=44100,apad=pad_dur={gaps[i]}[a{i}]")
filt=";".join(parts)+";"+"".join(f"[a{i}]" for i in range(len(segs)))+f"concat=n={len(segs)}:v=0:a=1[out]"
subprocess.run([FF,'-y','-loglevel','error',*ins,'-filter_complex',filt,'-map','[out]','-ac','1',f'tts/{TAG}_raw.wav'],check=True)
print(T)
