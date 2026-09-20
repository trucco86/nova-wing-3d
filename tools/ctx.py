#!/usr/bin/env python3
import pathlib,subprocess,sys
sys.exit(subprocess.run(['node','tools/context.mjs',*sys.argv[1:]],cwd=pathlib.Path(__file__).resolve().parent.parent).returncode)
