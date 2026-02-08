import base64
from PIL import Image
import io

# Create a 100x100 red image
img = Image.new('RGB', (100, 100), color = 'red')
buffer = io.BytesIO()
img.save(buffer, format="JPEG")
img_str = base64.b64encode(buffer.getvalue()).decode()
print(f"data:image/jpeg;base64,{img_str}")
