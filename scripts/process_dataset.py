import json
import base64
import os
import argparse
from pathlib import Path

def process_dataset(json_path, output_dir):
    """
    Convert exported TCM JSON data to image dataset folder structure.
    Output structure:
    output_dir/
      herb_id_1/
        timestamp_1.jpg
        timestamp_2.jpg
      herb_id_2/
        ...
    """
    print(f"Loading data from {json_path}...")
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {e}")
        return

    images = data.get('images', [])
    print(f"Found {len(images)} images in export file.")

    if not images:
        print("No images found to process.")
        return

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    success_count = 0
    error_count = 0

    for img in images:
        try:
            herb_id = str(img.get('herbId', 'unknown'))
            # Filter valid herb IDs if needed (optional)
            
            # Create class folder
            class_dir = output_path / herb_id
            class_dir.mkdir(exist_ok=True)
            
            # Get image data
            img_data = img.get('data')
            if not img_data:
                continue
                
            # Handle base64 prefix
            if ',' in img_data:
                img_data = img_data.split(',')[1]
            
            # Decode and save
            timestamp = img.get('timestamp', 'unknown')
            filename = f"{timestamp}.jpg"
            file_path = class_dir / filename
            
            with open(file_path, "wb") as f:
                f.write(base64.b64decode(img_data))
                
            success_count += 1
            
        except Exception as e:
            print(f"Error saving image: {e}")
            error_count += 1

    print(f"\nProcessing complete!")
    print(f"✅ Successfully saved: {success_count} images")
    print(f"❌ Failed: {error_count} images")
    print(f"📂 Output directory: {output_path.absolute()}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert TCM Herb App JSON export to Image Dataset')
    parser.add_argument('json_path', help='Path to the downloaded .json file')
    parser.add_argument('--output', '-o', default='dataset', help='Output directory for images (default: dataset)')
    
    args = parser.parse_args()
    process_dataset(args.json_path, args.output)
