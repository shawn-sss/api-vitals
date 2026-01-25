#!/usr/bin/env python3
import os
import re
import sys

# Extensions grouped by comment rules
CS_STYLE = {'.java', '.js', '.css', '.gradle'}
HTML_STYLE = {'.html', '.htm', '.xml'}
PROPS_STYLE = {'.properties'}
SHELL_STYLE = {'.sh', '.bat'}
TEXT_STYLE = {'.txt', '.md', '.json', '.yml', '.yaml'}

skip_dirs = {'.git', 'target', 'node_modules', '.idea', '.vscode', '.venv', '.mvn'}

def should_process(path):
    _, ext = os.path.splitext(path)
    return ext.lower() in (CS_STYLE | HTML_STYLE | PROPS_STYLE | SHELL_STYLE | TEXT_STYLE)

cs_block = re.compile(r'/\*.*?\*/', re.S)
html_block = re.compile(r'<!--.*?-->', re.S)
cs_line = re.compile(r'(?m)(?<!:)//.*$')
props_line = re.compile(r'(?m)^[ \t]*[#!].*$')
shell_line = re.compile(r'(?m)^[ \t]*#(?!!).*$')

def remove_comments(path, text):
    _, ext = os.path.splitext(path)
    ext = ext.lower()
    s = text
    # C-style block comments
    if ext in CS_STYLE:
        s = cs_block.sub('', s)
        s = cs_line.sub('', s)
    if ext in HTML_STYLE:
        s = html_block.sub('', s)
    if ext in PROPS_STYLE:
        s = props_line.sub('', s)
    if ext in SHELL_STYLE:
        s = shell_line.sub('', s)
    # For text/markdown/json/yaml: avoid removing leading '#'
    if ext in TEXT_STYLE:
        s = html_block.sub('', s)
        s = cs_block.sub('', s)
    # collapse multiple blank lines to at most 2
    s = re.sub(r'\n{3,}', '\n\n', s)
    return s


def process_file(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            orig = f.read()
    except Exception:
        return False
    updated = remove_comments(path, orig)
    if updated != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(updated)
        return True
    return False


def main(root):
    changed = []
    for dirpath, dirnames, filenames in os.walk(root):
        # skip some dirs
        dirnames[:] = [d for d in dirnames if d not in skip_dirs]
        for fn in filenames:
            path = os.path.join(dirpath, fn)
            if should_process(path):
                ok = process_file(path)
                if ok:
                    changed.append(path)
    print(f"Processed files: {len(changed)}")
    for p in changed[:50]:
        print(p)

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else '.'
    main(root)
