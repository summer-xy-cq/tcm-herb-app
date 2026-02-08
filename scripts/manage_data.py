import json
import os
import argparse
from pathlib import Path

# Try to import necessary libraries
try:
    import pandas as pd
    import openpyxl
except ImportError:
    print("❌ 缺少必要的库 (pandas, openpyxl)")
    print("请运行以下命令安装:")
    print("pip install pandas openpyxl")
    exit(1)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "src" / "data"
EXCEL_DIR = BASE_DIR / "data_management"

HERBS_JSON = DATA_DIR / "herbs.json"
QUESTIONS_JSON = DATA_DIR / "questions.json"

HERBS_EXCEL = EXCEL_DIR / "herbs_data.xlsx"
QUESTIONS_EXCEL = EXCEL_DIR / "questions_data.xlsx"

def ensure_dirs():
    EXCEL_DIR.mkdir(exist_ok=True)
    DATA_DIR.mkdir(exist_ok=True)

def json_to_excel():
    """Convert JSON data to Excel files (Create Templates)"""
    ensure_dirs()
    print("📋 正在导出数据到 Excel...")

    # 1. Process Herbs
    if HERBS_JSON.exists():
        with open(HERBS_JSON, 'r', encoding='utf-8') as f:
            herbs_data = json.load(f)
        
        # Flatten properties for Excel
        flattened_herbs = []
        for h in herbs_data:
            flat_h = h.copy()
            props = flat_h.pop('properties', {})
            flat_h['nature'] = props.get('nature', '')
            flat_h['flavor'] = "、".join(props.get('flavor', []))
            flat_h['meridians'] = "、".join(props.get('meridians', []))
            flat_h['alias'] = "、".join(flat_h.get('alias', []))
            flattened_herbs.append(flat_h)
            
        df_herbs = pd.DataFrame(flattened_herbs)
        # Reorder columns for better editing experience
        cols = ['id', 'name', 'pinyin', 'latinName', 'category', 'alias', 
                'nature', 'flavor', 'meridians', 
                'source', 'effects', 'indications', 'dosage', 'caution', 'image']
        # Filter existing columns
        cols = [c for c in cols if c in df_herbs.columns]
        df_herbs = df_herbs[cols]
        
        df_herbs.to_excel(HERBS_EXCEL, index=False)
        print(f"✅ 已生成药材数据表: {HERBS_EXCEL}")
    else:
        print(f"⚠️ 未找到 {HERBS_JSON}")

    # 2. Process Questions
    if QUESTIONS_JSON.exists():
        with open(QUESTIONS_JSON, 'r', encoding='utf-8') as f:
            questions_data = json.load(f)
            
        # Flatten options for Excel
        flattened_questions = []
        for q in questions_data:
            flat_q = q.copy()
            options = flat_q.pop('options', [])
            # Assume 4 options usually
            flat_q['Option_A'] = options[0] if len(options) > 0 else ""
            flat_q['Option_B'] = options[1] if len(options) > 1 else ""
            flat_q['Option_C'] = options[2] if len(options) > 2 else ""
            flat_q['Option_D'] = options[3] if len(options) > 3 else ""
            flat_q['Option_E'] = options[4] if len(options) > 4 else ""
            flattened_questions.append(flat_q)
            
        df_questions = pd.DataFrame(flattened_questions)
        # Reorder
        q_cols = ['id', 'herbId', 'type', 'source', 'question', 
                  'Option_A', 'Option_B', 'Option_C', 'Option_D', 'Option_E', 
                  'answer', 'explanation']
        q_cols = [c for c in q_cols if c in df_questions.columns]
        df_questions = df_questions[q_cols]
        
        df_questions.to_excel(QUESTIONS_EXCEL, index=False)
        print(f"✅ 已生成题目数据表: {QUESTIONS_EXCEL}")
    else:
        print(f"⚠️ 未找到 {QUESTIONS_JSON}")

def excel_to_json():
    """Update JSON data from Excel files"""
    print("🔄 正在从 Excel 更新数据到 JSON...")
    
    # 1. Update Herbs
    if HERBS_EXCEL.exists():
        df_herbs = pd.read_excel(HERBS_EXCEL).fillna("")
        herbs_list = []
        for _, row in df_herbs.iterrows():
            # Convert back to nested structure
            herb = row.to_dict()
            
            # Handle list fields
            alias_str = str(herb.pop('alias', ''))
            alias = [x.strip() for x in alias_str.split('、') if x.strip()]
            
            flavor_str = str(herb.pop('flavor', ''))
            flavor = [x.strip() for x in flavor_str.split('、') if x.strip()]
            
            meridians_str = str(herb.pop('meridians', ''))
            meridians = [x.strip() for x in meridians_str.split('、') if x.strip()]
            
            properties = {
                "nature": str(herb.pop('nature', '')),
                "flavor": flavor,
                "meridians": meridians
            }
            
            # Clean up empty strings in main dict
            clean_herb = {k: v for k, v in herb.items() if k not in ['nature', 'flavor', 'meridians', 'alias']}
            clean_herb['alias'] = alias
            clean_herb['properties'] = properties
            
            herbs_list.append(clean_herb)
            
        with open(HERBS_JSON, 'w', encoding='utf-8') as f:
            json.dump(herbs_list, f, ensure_ascii=False, indent=4)
        print(f"✅ 已更新药材数据: {HERBS_JSON} ({len(herbs_list)} 条记录)")
    else:
        print(f"⚠️ 未找到Excel文件: {HERBS_EXCEL}")

    # 2. Update Questions
    if QUESTIONS_EXCEL.exists():
        df_questions = pd.read_excel(QUESTIONS_EXCEL).fillna("")
        questions_list = []
        for _, row in df_questions.iterrows():
            q = row.to_dict()
            
            # Reconstruct options list
            options = []
            for opt_key in ['Option_A', 'Option_B', 'Option_C', 'Option_D', 'Option_E']:
                val = str(q.pop(opt_key, '')).strip()
                if val:
                    options.append(val)
            
            q['options'] = options
            questions_list.append(q)
            
        with open(QUESTIONS_JSON, 'w', encoding='utf-8') as f:
            json.dump(questions_list, f, ensure_ascii=False, indent=4)
        print(f"✅ 已更新题目数据: {QUESTIONS_JSON} ({len(questions_list)} 条记录)")
    else:
        print(f"⚠️ 未找到Excel文件: {QUESTIONS_EXCEL}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Manage TCM Data with Excel')
    parser.add_argument('action', choices=['export', 'import'], help='export: JSON -> Excel, import: Excel -> JSON')
    
    args = parser.parse_args()
    
    if args.action == 'export':
        json_to_excel()
    elif args.action == 'import':
        excel_to_json()
