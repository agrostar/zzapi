- run `npm link` at the root of zzapi. 
- Separate the runner from zzapi-vscode and run `npm link zzapi` at it's root to link the locally installed npm module. 
- Resolve the imports (all 'core/*' imports should be replaced with 'zzapi') and in importPostman move the convertPostman into the curly braces. 
- debug