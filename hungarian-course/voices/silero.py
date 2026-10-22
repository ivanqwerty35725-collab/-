import torch, subprocess
m = torch.package.PackageImporter('v4_ru.pt').load_pickle("tts_models", "model")
m.to('cpu')
T="Вариант {n}. Если я уже нахожусь в доме, это вопрос «где». Послушайте ещё раз и попробуйте повторить вслух."
for n,sp in [(15,'aidar'),(16,'baya'),(17,'kseniya'),(18,'xenia'),(19,'eugene')]:
    p=m.save_wav(text=T.format(n=n), speaker=sp, sample_rate=48000, audio_path=f'p{n}.wav')
    subprocess.run(['ffmpeg','-y','-v','error','-i',f'p{n}.wav','-ar','24000','-ac','1','-c:a','libmp3lame','-q:a','4',f'e{n}.mp3'],check=True)
    print(n,sp)
