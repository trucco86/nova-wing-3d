#!/usr/bin/env python3
"""Compatibility commands: combine -> build; check -> validate. Source is never overwritten."""
import pathlib,subprocess,sys
root=pathlib.Path(__file__).resolve().parent.parent
commands={'combine':['npm','run','build'],'check':['npm','run','validate']}
if len(sys.argv)!=2 or sys.argv[1] not in commands:
 sys.exit('Use python3 tools/build.py combine|check. No split: src/ is the only source of truth.')
sys.exit(subprocess.run(commands[sys.argv[1]],cwd=root).returncode)
