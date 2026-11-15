# Full static build: chrome pages + Devlog from Markdown.
#   python tools/build.py

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    py = sys.executable
    subprocess.check_call([py, str(ROOT / "tools" / "emit-pages.py")])
    subprocess.check_call([py, str(ROOT / "tools" / "build-devlog.py")])


if __name__ == "__main__":
    main()
