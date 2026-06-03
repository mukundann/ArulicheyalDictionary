import csv
import json
import os

def csv_to_compact_json(csv_filepath, json_filepath):
    if not os.path.exists(csv_filepath):
        print(f"Error: '{csv_filepath}' not found.")
        return

    data_matrix = {}
    last_seen_pasuram = "Unknown"

    with open(csv_filepath, mode='r', encoding='utf-8') as infile:
        reader = csv.reader(infile)
        try:
            next(reader)  # Skip header row
        except StopIteration:
            return

        for row in reader:
            if not row or len(row) < 4:
                continue

            # Handle both unoptimized and optimized CSV input formats
            pasuram_col = row[0].strip()
            if pasuram_col != "":
                last_seen_pasuram = pasuram_col

            word = row[2].strip()     # Slokam / Word column
            meaning = row[3].strip()  # Meaning column

            if last_seen_pasuram not in data_matrix:
                data_matrix[last_seen_pasuram] = []

            # Append as a compact, index-based small array [word, meaning]
            data_matrix[last_seen_pasuram].append([word, meaning])

    # Save with minimal whitespace for maximum compression
    with open(json_filepath, mode='w', encoding='utf-8') as outfile:
        json.dump(data_matrix, outfile, ensure_ascii=False, separators=(',', ':'))

    print(f"Optimization Complete:")
    print(f"  Source CSV: {os.path.getsize(csv_filepath) / 1024:.2f} KB")
    print(f"  Compact JSON Output: {os.path.getsize(json_filepath) / 1024:.2f} KB")

if __name__ == "__main__":
    csv_to_compact_json("csv_files/pt.csv", "csv_files/pt.json")