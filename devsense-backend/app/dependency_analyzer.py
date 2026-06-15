import os
import ast
import json

DEPENDENCY_PATH = "data/metadata/dependencies.json"


def extract_python_dependencies(file_path):
    dependencies = []

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):
            # import module
            if isinstance(node, ast.Import):
                for alias in node.names:
                    dependencies.append(alias.name)

            # from module import something
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    dependencies.append(node.module)

            # function calls (basic)
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    dependencies.append(node.func.id)
                elif isinstance(node.func, ast.Attribute):
                    dependencies.append(node.func.attr)

    except Exception:
        pass

    return list(set(dependencies))


def extract_js_dependencies(file_path):
    import re

    dependencies = []

    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        js_imports = re.findall(r'import\s+.*?from\s+[\'"](.+?)[\'"]', content)
        dependencies.extend(js_imports)

    except Exception:
        pass

    return list(set(dependencies))


def build_dependency_map(file_list):
    dependency_map = {}

    for file_path in file_list:
        _, ext = os.path.splitext(file_path)

        if ext == ".py":
            deps = extract_python_dependencies(file_path)
        elif ext in [".js", ".ts"]:
            deps = extract_js_dependencies(file_path)
        else:
            deps = []

        dependency_map[file_path] = deps

    with open(DEPENDENCY_PATH, "w", encoding="utf-8") as f:
        json.dump(dependency_map, f)

    return dependency_map


def load_dependency_map():
    if os.path.exists(DEPENDENCY_PATH):
        with open(DEPENDENCY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def trace_dependencies(target_file, dependency_map):
    directly_affected = []
    indirectly_affected = []

    for file, imports in dependency_map.items():
        for imp in imports:
            if target_file in imp:
                directly_affected.append(file)

    for file in directly_affected:
        for other_file, imports in dependency_map.items():
            if file in imports:
                indirectly_affected.append(other_file)

    return list(set(directly_affected)), list(set(indirectly_affected))

def build_dependency_graph(file_list):
    graph = {
        "nodes": [],
        "edges": []
    }

    dependency_map = {}

    for file_path in file_list:
        _, ext = os.path.splitext(file_path)

        if ext == ".py":
            deps = extract_python_dependencies(file_path)
        elif ext in [".js", ".ts"]:
            deps = extract_js_dependencies(file_path)
        else:
            deps = []

        dependency_map[file_path] = deps
        graph["nodes"].append(file_path)

    # Build edges
    for source, imports in dependency_map.items():
        for target in imports:
            for file_path in file_list:
                if target in file_path:
                    graph["edges"].append({
                        "source": source,
                        "target": file_path
                    })

    # Save
    with open(DEPENDENCY_PATH, "w", encoding="utf-8") as f:
        json.dump(graph, f)

    return graph


def calculate_impact_score(target_file, graph):
    """Calculate direct and indirect impact for a target file using a
    dependency map or graph.

    The input *graph* may be a simple mapping of file paths to a list of
    imports (as produced by :func:`build_dependency_map`), or the graph
    format produced by :func:`build_dependency_graph` which contains
    ``nodes`` and ``edges``.  The function normalizes either format into a
    dependency map before computing the impact.

    The return value is a tuple ``(direct, indirect, score, risk)`` where
    *direct* and *indirect* are lists of file paths that directly or
    indirectly depend on ``target_file``.  *score* is the sum of the two
    lists' lengths and *risk* is a simple string based on the score.
    """

    # normalize graph to dependency_map format
    if isinstance(graph, dict) and "nodes" in graph and "edges" in graph:
        dependency_map = {node: [] for node in graph["nodes"]}
        for edge in graph["edges"]:
            src = edge.get("source")
            tgt = edge.get("target")
            if src in dependency_map:
                dependency_map[src].append(tgt)
    else:
        dependency_map = graph or {}

    direct = []
    indirect = []

    # collect directly affected files
    for file_path, imports in dependency_map.items():
        for imp in imports:
            if target_file in imp:
                direct.append(file_path)
                break

    # collect indirectly affected files
    for file_path in direct:
        for other_file, imports in dependency_map.items():
            if other_file in direct:
                continue
            for imp in imports:
                if file_path in imp:
                    indirect.append(other_file)
                    break

    direct = list(set(direct))
    indirect = list(set(indirect))

    score = len(direct) + len(indirect)
    if score == 0:
        risk = "none"
    elif score < 3:
        risk = "low"
    elif score < 6:
        risk = "medium"
    else:
        risk = "high"

    return direct, indirect, score, risk