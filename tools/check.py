#!/usr/bin/env python3
"""Run the repository gate without hiding failing commands."""
import pathlib,subprocess,sys
sys.exit(subprocess.run(['npm','run','validate','--',*sys.argv[1:]],cwd=pathlib.Path(__file__).resolve().parent.parent).returncode)
