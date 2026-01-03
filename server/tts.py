import asyncio
import sys
import edge_tts

# Styles:
# fr-FR-RemyMultilingualNeural (New, very realistic)
# fr-FR-VivienneMultilingualNeural (Female equivalent)

VOICE = "fr-FR-RemyMultilingualNeural"  
OUTPUT_FILE = "server/temp_audio.mp3"

async def generate_speech(text, output_file):
    # +20% rate: Faster, more urgent narration
    # -5Hz pitch: Deeper, oppressive tone
    communicate = edge_tts.Communicate(text, VOICE, rate="+20%", pitch="-5Hz") 
    await communicate.save(output_file)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python tts.py <text> <output_file>")
        sys.exit(1)
    
    # Text is the first argument (can be in quotes)
    # If using from node spawn, we might pass it as a single arg
    text_input = sys.argv[1]
    
    # Optional output path
    output_path = sys.argv[2] if len(sys.argv) > 2 else OUTPUT_FILE

    try:
        asyncio.run(generate_speech(text_input, output_path))
        print(f"SUCCESS:{output_path}")
    except Exception as e:
        print(f"ERROR:{str(e)}")
        sys.exit(1)
