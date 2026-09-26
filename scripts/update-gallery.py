"""CSVからHTML内の作品一覧を更新する。実行: python scripts/update-gallery.py"""
import csv
import math
from html import escape
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
START = '      <!-- gallery:start — scripts/update-gallery.py でCSVから更新 -->'
END = '      <!-- gallery:end -->'


def main():
    with (ROOT / '作品の順番.csv').open(encoding='utf-8-sig', newline='') as source:
        reader = csv.DictReader(source)
        required = {'順番', 'タブ', 'ファイル名', '作品タイトル', '仕事内容'}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError('CSVの列名を確認してください。')
        works = [
            {key: (row.get(key) or '').strip() for key in required}
            for row in reader if any((value or '').strip() for value in row.values())
        ]

    cards = []
    for work in sorted(works, key=lambda work: float(work['順番'])):
        if not math.isfinite(float(work['順番'])):
            raise ValueError('順番には有限の数値を指定してください。')
        tab, filename, title = work['タブ'], work['ファイル名'], work['作品タイトル']
        if tab not in ('personal', 'works') or not filename or not title:
            raise ValueError(f'タブ・ファイル名・作品タイトルを確認してください: {work}')
        if not filename.lower().endswith('.webp'):
            filename += '.webp'
        path = ROOT / 'images' / tab / filename
        if not path.is_file():
            raise FileNotFoundError(path)
        src = f'images/{tab}/{quote(filename, safe="")}'
        caption = '｜'.join(filter(None, [title, work['仕事内容']]))
        cards.append(f'''        <button type="button" class="gallery-item reveal" data-tab="{tab}" data-src="{src}" data-caption="{escape(caption, quote=True)}" aria-label="{escape(title, quote=True)}を拡大表示">
          <img src="{src}" alt="{escape(title, quote=True)}" draggable="false" loading="lazy" />
          <span class="gallery-overlay" aria-hidden="true"><span class="zoom-icon">＋</span></span>
        </button>''')

    target = ROOT / 'index.html'
    html = target.read_text(encoding='utf-8')
    before, rest = html.split(START, 1)
    _, after = rest.split(END, 1)
    gallery = '\n'.join(cards)
    target.write_text(
        before + START + '\n'
        '      <div class="gallery-grid" id="gallery-grid" aria-busy="false">\n'
        + gallery + '\n      </div>\n' + END + after,
        encoding='utf-8',
    )
    print(f'Updated index.html: {len(works)} artworks')


if __name__ == '__main__':
    main()
