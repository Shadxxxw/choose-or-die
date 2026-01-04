import sys
import asyncio
import edge_tts

async def main():
    text = sys.argv[1] if len(sys.argv) > 1 else "Erreur"
    
    # Voix masculine française - Henri est grave et oppressant
    voice = "fr-FR-HenriNeural"
    
    communicate = edge_tts.Communicate(text, voice, rate="+5%", pitch="-15Hz")
    
    # Output to stdout as binary
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            sys.stdout.buffer.write(chunk["data"])

if __name__ == "__main__":
    asyncio.run(main())
