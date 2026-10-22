import asyncio, edge_tts, os
os.environ['SSL_CERT_FILE']='/root/.ccr/ca-bundle.crt'
T="Вариант {n}. Если я уже нахожусь в доме, это вопрос «где». Послушайте ещё раз и попробуйте повторить вслух."
V=[("ru-RU-SvetlanaNeural","-0%"),("ru-RU-DmitryNeural","+0%"),("en-US-AndrewMultilingualNeural","+0%"),("en-US-AvaMultilingualNeural","+0%"),
   ("en-US-EmmaMultilingualNeural","+0%"),("en-US-BrianMultilingualNeural","+0%"),("de-DE-SeraphinaMultilingualNeural","+0%"),
   ("de-DE-FlorianMultilingualNeural","+0%"),("fr-FR-VivienneMultilingualNeural","+0%"),("fr-FR-RemyMultilingualNeural","+0%")]
async def main():
    for i,(v,r) in enumerate(V,1):
        await edge_tts.Communicate(T.format(n=i),v,rate=r).save(f"e{i:02d}.mp3"); print(i,v)
asyncio.run(main())
