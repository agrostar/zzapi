# TODO

## Immediate:

  * Handle variables
    * envs and varsets, load from zz-envs.yaml
    * Use status bar and dropdown to pick from one of the envs
    * Use vars to replace $variable and $(variable)

## For MVP

  * Tests (to be detailed)
  * Capture (to be detailed)

## Must have soon (hygiene)

* Specify and handle error cases:
  * Malformed yamls (bundle, varsets, env)
  * Yaml valid but not as per schema

* Catch circular redirects in follow mode. Can got do this? If so, use it.

* Automatically add header User-Agent: zzapi-runner/<version> (where is the extension version stored?)

## This will be v1.0

## Further ahead

* Support `{ foo: bar }` kind of headers and params in addition to arrays. Use case: when need to override, unique keys, they can use the shorter simpler form of `foo: bar`. In more complex cases of repeating parameter names or needing the doc: attribute, they can use the long form. 

* use parseDocument to parse the yaml (compare timings with regex), so that we don't have to get the "best" regex to avoid false positives for making code lenses. If the parse fails, we don't have any codelenses.

* Do we need two codelens providers? Cant a single function return an array of codelenses? That way we need to parse the file (regex or yaml) only once.

* Scaffolding: using Cmd+Shift+P activate the extension and also create a directory and basic files like zz-envs.yaml and test/staging/production/local environments.

* Run validation against the JSON schema before running requests. Safety measure to avoid crashes due to invalid yaml (malformed or invalid)

* A way to temporarily disable parameters/headers, especially in documentation: need to keep the variable/header as an example, mainly for documentation, but not use it by default while executing the request.

* Cusom outline view OR change requests to a map instead of array. The outline is a easy way of showing all the requests and being able to navigate to one of them to execute.

* Path params: eg, /employees/345: URL should be /employees/:id and params can have :id set to a value

* Commands should be visbile in the command pallette (or somewhere else). Cannot rely on CodeLens alone.
