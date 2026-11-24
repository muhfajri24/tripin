"""Run a built React + FastAPI demo on one loopback origin, without paid services."""

import argparse
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
FRONTEND_BUILD = ROOT / "frontend" / "build"


def port_number(value):
    port = int(value)
    if not 1 <= port <= 65535:
        raise argparse.ArgumentTypeError("port must be between 1 and 65535")
    return port


def require_build(path):
    if not (path / "index.html").is_file():
        raise ValueError(
            "Frontend build missing. From frontend run npm ci then npm run build, "
            "or use --build after dependencies are installed."
        )


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=port_number, default=8015)
    parser.add_argument("--source", choices=["local", "supabase"], default="local")
    parser.add_argument(
        "--build", action="store_true", help="Rebuild existing frontend source"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check build presence without starting a server",
    )
    args = parser.parse_args(argv)
    try:
        if args.build:
            subprocess.run(
                ["npm.cmd" if os.name == "nt" else "npm", "run", "build"],
                cwd=ROOT / "frontend",
                check=True,
            )
        require_build(FRONTEND_BUILD)
    except (OSError, ValueError, subprocess.CalledProcessError) as exc:
        parser.exit(1, str(exc) + "\n")
    print(f"Built frontend found; explicit source={args.source}. No source failover.")
    if args.check:
        print(
            "Build presence only; API connectivity, source access and UI acceptance are not verified."
        )
        return
    os.environ["TRPIN_SERVE_FRONTEND"] = "true"
    os.environ["TRPIN_PLACE_SOURCE"] = args.source
    print(f"Local demo: http://127.0.0.1:{args.port} (HTTP loopback, not public HTTPS)")
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=args.port, proxy_headers=False)


if __name__ == "__main__":
    main()
