# Венгерский до присяги

Материалы курса венгерского языка для собеседования по упрощённой натурализации: 300-дневный план, интерактивная страница, тексты, озвучка и учебные ролики.

## Что где лежит

| Папка или файл | Содержимое |
|---|---|
| `vengerskiy-do-prisyagi.html` | Собранная интерактивная страница (опубликована как артефакт claude.ai) |
| `tpl3.html`, `gen3.py`, `build.sh`, `plan.json` | Шаблон страницы, генератор плана на 300 дней, сборка |
| `words.py`, `phrases.py`, `content.py`, `texts_1..4.json` | Словарь (1075 слов), фразы (430), диктанты и упражнения, 300 текстов дня |
| `tts.py`, `audio/` | Предозвучка голосом hu-HU Tamás, аудиоспрайты по неделям и карта смещений `audio/map.json` |
| `build/` | Сборка роликов на HyperFrames: `lib.py`, `lib2.py` (рассказчик, паузы, заголовки), сценарии `v03*.py` |
| `video/` | Готовые ролики, сценарии, `pravila-slaydov.md` (правила слайдов), `pravki-v-ocheredi.md` (решения и отложенные правки), `MOTION.md` рядом в корне |
| `style/` | Пробы стилей: A — 3D, B — гуашь, C — кинетическая типографика, S — пробный ролик с 9 направлениями и персонажем, `sheet/` — 9 рисованных техник, `digital/` — 9 цифровых техник, `masters/` — Билибин, Айвазовский, Брюллов кодом, `paintings/` — оживлённые подлинники (источники в `paintings/sources.txt`) |
| `voices/` | Образцы русских голосов для выбора рассказчика |
| `fonts/` | Source Serif 4 (прямой и курсив), IBM Plex, @font-face в `fontface.css` |

## Что не сохранено и пересоздаётся

Кэш аудиофрагментов, веса нейросетей (Piper, Silero, Depth Anything, LaMa), `node_modules`, покадровые рендеры и черновики. Нужное ставится заново: `pip install edge-tts piper-tts`, `npx skills add heygen-com/hyperframes`, `npm i` в папках проектов.

## Пересборка

- Страница: `./build.sh` (нужны `audio/map.json` и `video/videos.json`).
- Озвучка: `python3 tts.py w01 … w43 t01 … t43 isl`.
- Ролик 03: `cd build && python3 v03f.py`, затем `npx --yes hyperframes@0.8.185 render` в папке проекта.

## Перенос на свой компьютер

Скрипты сборки написаны в облачном контейнере и ссылаются на абсолютный путь
`/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu`.
После клонирования замените его на путь к этой папке одной командой из корня репозитория:

```bash
OLD=/tmp/claude-0/-home-user--/26b0ee40-e351-58da-864e-84e1c80e1382/scratchpad/hu
NEW="$(pwd)/hungarian-course"
grep -rlI "$OLD" hungarian-course | xargs sed -i "s|$OLD|$NEW|g"
```

На macOS вместо `sed -i` используйте `sed -i ''`.

Нужные программы: Python 3.11+, Node.js 22, ffmpeg, Chromium для Playwright (`npx playwright install chromium`),
`pip install edge-tts piper-tts`, навыки HyperFrames (`npx skills add heygen-com/hyperframes --all`).
