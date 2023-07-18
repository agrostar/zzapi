TODO


## Immediate:

  * Handle variables
    * envs and varsets, load from zz-envs.yaml
    * Use status bar and dropdown to pick from one of the envs
    * Use vars to replace $variable and $(variable)

## For MVP

  * Tests (to be detailed)
  * Capture (to be detailed)


## Further ahead

* Support foo: bar kind of headers and params in addition to arrays. Use case: when need to override, unique keys, they can use the shorter simpler form of foo: bar. In more complex cases of repeating parameter names or needing the doc: attribute, they can use the long form. 
  * anyOf may not auto-complete. Test out autocomplete vs simpler typing

* use parseDocument to parse the yaml (compare timings with regex), so that we don't have to get the "best" regex to avoid false positives for making code lenses. If the parse fails, we don't have 

* Specify and handle error cases:
  * Malformed yamls (bundle, varsets, env)
  * Yaml valid but not as per schema

