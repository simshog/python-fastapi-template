import json

with open("test.json", encoding="utf-8") as f:
    data = json.load(f)

voices = data["data"]["ugc_voice_list"]

print("SPEAKERS = {")
for v in voices:
    name = v["name"]
    style_id = v["style_id"]
    print(f'    "{name}": "{style_id}",')
print("}")
