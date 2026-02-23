#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Извлекает текст из game_concept.md.docx и собирает один HTML-документ:
каждый узел (сцена/выбор/продолжение) — блок с полным текстом и ссылками по выбору.
"""
import html
import zipfile
import re
import xml.etree.ElementTree as ET
from pathlib import Path

DOCX_PATH = Path(__file__).parent / "game_concept.md.docx"
OUT_HTML = Path(__file__).parent / "game_scheme_full.html"


def extract_paragraphs(docx_path):
    with zipfile.ZipFile(docx_path, "r") as z:
        with z.open("word/document.xml") as f:
            tree = ET.parse(f)
    root = tree.getroot()
    ns = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

    def text_of(el):
        return "".join(t.text or "" for t in el.iter() if t.text)

    for p in root.iter("{%s}p" % ns):
        t = text_of(p).strip()
        if t:
            yield t


def parse_nodes(paragraphs):
    """Разбивает поток параграфов на узлы: заголовок, тело, опции."""
    nodes = []
    current = None
    in_options = False
    option_lines = []

    def flush_options():
        nonlocal current, in_options, option_lines
        if current and option_lines:
            current["options"] = option_lines
            option_lines = []
        in_options = False

    # Паттерны заголовков узлов
    scene_re = re.compile(r"^Сцена\s+(\d+)\s*[:\s]", re.I)
    choice_re = re.compile(r"^Выбор\s+(\d+)\s*[:\s]", re.I)
    cont_re = re.compile(r"^Продолжение\s+Выбора\s+([\d.]+)\s*[:\s]", re.I)
    what_next = re.compile(r"^Что\s+ты\s+(сделаешь|ответишь)", re.I)

    for line in paragraphs:
        # Новый узел: Сцена / Выбор / Продолжение
        m = scene_re.match(line)
        if m:
            flush_options()
            current = {"id": "scene-" + m.group(1), "title": line, "body": [], "options": []}
            nodes.append(current)
            in_options = False
            continue

        m = choice_re.match(line)
        if m:
            flush_options()
            current = {"id": m.group(1), "title": line, "body": [], "options": []}
            nodes.append(current)
            in_options = False
            # первая строка заголовка может быть частью тела
            rest = line[m.end() :].strip()
            if rest:
                current["body"].append(rest)
            continue

        m = cont_re.match(line)
        if m:
            flush_options()
            nid = m.group(1).strip()
            current = {"id": nid.replace(".", "-"), "title": line, "body": [], "options": []}
            nodes.append(current)
            in_options = False
            rest = line[m.end() :].strip()
            if rest:
                current["body"].append(rest)
            continue

        # Начало блока опций
        if what_next.match(line):
            if current:
                current["body"].append(line)
            in_options = True
            continue

        # Строка опции: заканчивается на "(...)" или выглядит как выбор
        if in_options and current:
            if re.search(r"\([^)]+\)\s*$", line) or re.match(r"^[\d.]+\s*[\.\)]\s*", line) or "(" in line:
                option_lines.append(line)
            else:
                # возможно, это ещё вопрос — в тело
                if not option_lines:
                    current["body"].append(line)
                else:
                    option_lines.append(line)
            continue

        if current is not None:
            current["body"].append(line)

    flush_options()
    return nodes


def option_targets_fixed(node_id, num_options):
    """node_id может быть '1', '1-2', '1-2-2-1' -> цели 1.1, 1.2 или 1.2.2.1.1, 1.2.2.1.2 ..."""
    raw = node_id.replace("-", ".")
    return [f"{raw}.{i}" for i in range(1, num_options + 1)]


def build_html(nodes):
    """Строит один HTML: оглавление + секции с полным текстом и ссылками."""
    id_to_slug = {}
    for n in nodes:
        sid = n["id"]
        slug = sid.replace(".", "-")
        id_to_slug[sid] = slug
        # для целей типа 1.2.2.1 нужен slug 1-2-2-1
        id_to_slug[sid.replace("-", ".")] = slug

    toc = []
    sections = []

    for n in nodes:
        nid = n["id"]
        slug = id_to_slug.get(nid, nid.replace(".", "-"))
        title = n["title"]
        body = html.escape("\n\n".join(n["body"]))
        options = n.get("options") or []

        toc.append(f'<li><a href="#{slug}">{title[:80]}{"…" if len(title) > 80 else ""}</a></li>')

        opts_html = []
        if options:
            targets = option_targets_fixed(nid, len(options))
            for i, (opt_text, tgt) in enumerate(zip(options, targets)):
                tgt_slug = tgt.replace(".", "-")
                opts_html.append(f'<li><a href="#{tgt_slug}">→ {opt_text}</a></li>')

        option_block = ""
        if opts_html:
            option_block = """
            <div class="choices">
                <p class="choices-title">Перейти по выбору:</p>
                <ul class="choices-list">
                """ + "\n".join(opts_html) + """
                </ul>
            </div>
            """

        sections.append(
            f"""
            <section id="{slug}" class="node">
                <h2 class="node-title">{title}</h2>
                <div class="node-body">{body}</div>
                {option_block}
            </section>
            """
        )

    out = f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Схема сюжета — полный текст по узлам</title>
  <style>
    :root {{ font-size: 18px; }}
    body {{ font-family: Georgia, serif; max-width: 52rem; margin: 0 auto; padding: 1.5rem; color: #1a1a1a; line-height: 1.6; background: #fafaf9; }}
    h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
    .toc {{ background: #fff; padding: 1rem 1.5rem; border-radius: 8px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,.08); }}
    .toc ul {{ list-style: none; padding-left: 0; }}
    .toc li {{ margin: 0.4rem 0; }}
    .toc a {{ color: #2563eb; text-decoration: none; }}
    .toc a:hover {{ text-decoration: underline; }}
    .node {{ background: #fff; padding: 1.5rem 2rem; margin-bottom: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.08); border-left: 4px solid #3b82f6; }}
    .node-title {{ font-size: 1.1rem; color: #1e40af; margin-top: 0; margin-bottom: 1rem; }}
    .node-body {{ white-space: pre-wrap; }}
    .choices {{ margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; }}
    .choices-title {{ font-weight: 600; margin-bottom: 0.5rem; }}
    .choices-list {{ list-style: none; padding-left: 0; }}
    .choices-list li {{ margin: 0.5rem 0; }}
    .choices-list a {{ color: #059669; text-decoration: none; }}
    .choices-list a:hover {{ text-decoration: underline; }}
    @media print {{ .toc {{ break-after: avoid; }} .node {{ break-inside: avoid; }} }}
  </style>
</head>
<body>
  <h1>Схема сюжета: Первый день в кампусе</h1>
  <p>Каждый блок — узел с полным текстом. Переход по «стрелкам» — по ссылкам в конце блока. Документ можно сохранить и передать одним файлом.</p>
  <nav class="toc">
    <h2>Оглавление (узлы)</h2>
    <ul>
      {"".join(toc)}
    </ul>
  </nav>
  {"".join(sections)}
</body>
</html>
"""
    return out


def main():
    paragraphs = list(extract_paragraphs(DOCX_PATH))
    nodes = parse_nodes(paragraphs)
    # Нормализуем id: "1.2.2.1" из заголовка "Продолжение Выбора 1.2.2.1" -> slug 1-2-2-1
    for n in nodes:
        if n["id"].isdigit() or (n["id"].replace("-", "").replace(".", "").isdigit() and "scene" not in n["id"]):
            continue
        if "scene" in n["id"]:
            continue
        # оставляем как есть для якорей
    html = build_html(nodes)
    OUT_HTML.write_text(html, encoding="utf-8")
    print(f"Записано узлов: {len(nodes)}")
    print(f"Файл: {OUT_HTML}")


if __name__ == "__main__":
    main()
