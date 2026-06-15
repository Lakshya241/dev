import os
from collections import Counter


def detect_languages(file_list):
    ext_map = {
        ".py": "Python",
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".java": "Java",
        ".cpp": "C++",
        ".c": "C"
    }

    counter = Counter()

    for file in file_list:
        _, ext = os.path.splitext(file)
        if ext in ext_map:
            counter[ext_map[ext]] += 1

    return dict(counter)


def detect_entry_points(file_list):
    entry_points = []

    for file in file_list:
        filename = os.path.basename(file).lower()

        if filename in ["main.py", "app.py", "index.js", "server.js"]:
            entry_points.append(file)

    return entry_points


def detect_largest_files(file_list, top_n=5):
    file_sizes = []

    for file in file_list:
        try:
            size = os.path.getsize(file)
            file_sizes.append((file, size))
        except:
            continue

    file_sizes.sort(key=lambda x: x[1], reverse=True)

    return [file for file, _ in file_sizes[:top_n]]