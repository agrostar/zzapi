# zzAPI

zzAPI (prounounced like pizza, the syllables interchanged) is an HTTP API documentation and testing tool set.

Our manifesto:

* **Simplicity**: Do one thing (or two) and do it well. Single responsibility. Allow building on top.
* **Stand on the shoulders of giants**: Do not reinvent what has already been solved. We will use existing conveniences, which may not be "perfect" but will work well.
* **No GUI to enter data**: Developers don't need a GUI. Copy paste within an editor is far more efficient compared to multiple mouse clicks to enter data. We will use YAML files instead.
* **JSON First**: Though the request body can be anything, we have some extra conveniences for JSON body in the request as well as response.
* **API doc/tests shouuld be in your repo**: Storage will be on the local file system (ie, not the cloud). Whatever you have typed belongs to you. We expect you to save the YAMLs within your code repository.
* **Open source**: If you have an idea that is useful to you and can be to others as well, build it, test it and send us a PR.

# Alternatives

Here are some alternatives and good things about them. Yet, none of these fit into the above set of goals.

* **Postman**: Postman is a great tool, but the storage is on the cloud, making it hard for the tests and documentation be alongside the code. We borrow the concept of keeping the same tool for tests and documentation from Postman.
* **OpenAPI**: OpenAPI is meant for documentation alone, it does not cover tests. The YAML spec is also very elaborate and too structured. It is hard to hand-create OpenAPI YAMLs. We borrow the concept of YAML files for saving the API details from OpenAPI.
* **ThunderClient**: ThunderClient is a great tool but the UI is elaborate and it takes too many clicks to create a request. We borrow the concept of a VS Code extension from ThunderClient.

# zzAPI Constituents

zzAPI is made up of (at least):

1. **Specs**: The YAML schema and description.
2. **Runners**: The tools that can make one or more API requests. Currently the only runner available is the [VS Code extension](https://github.com/agrostar/zzapi-vscode)
3. **Documentation generators**: These will generate in different formats: We envisage a markdown generator to begin with.

# Storage

All files will be stored locally (ie, not on the cloud, unlike Postman). A directory will hold together files of different kinds. The directory is typically the input to the runner and the doc generator. You can have many directories (typically only one per git repository). A directory is like a "Folder" in Postman terminology. If you need hierarchy, use sub-directories.

The directory will hold the following kinds of files.

* **Bundles**: these are YAML files containing many requests. This is a "Collection" in Postman terminlogy. The directory can have any number of request bundles. Files ending with `.zzb` will be recognized as request bundles.
* **Variable-sets**: these are also YAML files, containing variable definitions. Files ending with `.zzv` will be recognized as variable files.
* **Files**: All other files (typically `.json`) can be used as requests and response samples. These will be referenced from within the bundles, so we don't really need a naming convention.

The schema for the above (except request and response files) will be discussed in detail below.

# Request Bundles

## Types of Bundles

Although the file format does not make a real distinction, practically there are two types of bundles:

1. **Documentation bundles**: the primary purpose is to document an API set. Documentation bundles will have one entry for each API endpoint, with lots of documentation accompanying it on different ways to use the API endpoint, expected responses, and samples.
2. **Test bundles**: the purpose is to automate testing. The same endpoint typically appears multiple times with different parameters and test cases. Tests are run against the response to ensure the API is responding as it is supposed to.

You can find two sample bundles `docs-bundle.zzb` and `tests-bundle.zzb` in this directory. Please refer to them as you read the explanation below.

## Top level objects

* `variables`: optional variables that can be used in all the requests.
* `common`: optional, request details that applies to all requests (unless overridden in a request). Each of the sub-elements is also optional.
* `requests`: a collection of requests as key-value pairs where the key is the request name (or title) and the value is a request object.

### variables

This is an object containing a set of name: value pairs, where the value can be anything, even objects, see the Variables section below for an explanation how non-scalars will be used.

### common

  * `baseUrl`: a prefix applied to the url of a request that starts with a /
  * `headers`: an array of header elements, which can be overridden in individual requests
     * By default, the header `user-agent` will be set to `zzAPI/<version>` unless overridden
  * `params`: query parameters added to all requests.
  * `tests`: a set of tests applied to all the requests in this bundle
  * `options`: options applicable to all requests, unless overridden

### request

* `url`: required, URL of the request (baseUrl from common settings will be prefixed if the URL starts with a /)
* `method`: required, one of GET, POST, PUT, PATCH etc
* `headers`: an array of `header`s, in addition to the common set, or overridden if the name is the same
* `params`: an array of `params`s, in addition to the common set. Parameters cannot be overridden.
* `body`: the raw request body. (Use the value `@filename` to read from a file, like in `curl`), or a JSON object, which will be converted to a JSON string after variable replacements.
* `response`: a sample response, useful for documentation (doesn't affect the request)
  * `headers`: the headers expected in the response
  * `body`: the raw response body, or a JSON object. Use `@filename` to read from a file.
  * `doc`: documentation to describe the response.
* `options`: options specific to this request, overrides common options
* `doc`: general documentation, typically in markdown (use `@filename` to read from a file)
* `tests`: a set of test objects
* `capture`: a set of values in the response to be captured as variables for use in further requests

## Object definitions

### options

These are options that can be switches on/off, both at the common level as well as the request level.

* `follow`: whether to follow redirects (default is false)
* `verifySSL`: whether to enfoce SSL certificate validation (default is false)

### header

HTTP Headers that will be sent along with the request.

* `name`: required, name of the header
* `value`: requuired, value of the header
* `doc`: helpful descriptions about what this header does, has no effect on the actual request

### param

* `name`: required, name of the parameter
* `value`: requuired, value of the parameter
* `doc`: helpful descriptions about what this parameter does, has no effect on the actual request

### test

Tests are run against (each of them is a property of `tests`) the following:

* `status`: an `assertion` against the HTTP status code
* `headers`: a list of `assertion`s against the headers
* `body`: an `assertion` against the entire body. This can be a string, or an object.
* `json`: a list of `assertion`s against elements (`path`s) of the body parsed as JSON

### asssertion

Assertions are similar to MongoDB filters. The key is the element (a path in case of json), and the value is the expected value of the element. The value can be a plain value, or a specification with the operator and value.

* `status: 400`: status must be equal to 400
* `status: { $lt: 300 }`: status must be less than 300
* `body: {$regex: /\<html\>/}`: the body must contain the characters `<html>` (using the `$regex` operator,)
* `json: { field.nested.value: 42 }`: the nested value must be equal to 42 (and match the type)

Note that an assertion value can be a non-scalar, especially when matching a non-scalar in the response JSON. The comparison will be done by JSON.stringif()ing both the RHS and the LHS.

Operators supported in the RHS are:
* `$eq`, `$ne`, `$lt`, `$gt`, `$lte`, `$gte`: against the value
* `$regex`: against the value, with `$options` like ignore-case
* `$size`: for length of arrays and objects, or the length of the string if it is not an array
* `$exists`: true|false, to check existance of a field
* `$type`: string|number|object|array|null: to ensure the type of the field

### tests.json

If there are any json tests, the response is parsed as JSON, provided the content type is `application/json`. The key of the test is a path to the (nested) field in the JSON document. The path is evaluated using JSONPATH (see https://www.npmjs.com/package/jsonpath and https://jsonpath.com/) and the first result is (or the result of jp.value) used as the value to test against. Here are some examples:

* `$.field.nested.value: 10`: will match 10 if the response body is like `{ field: { nested: { value: 10 } } }` 
* `$.field.0` or `field[0]` will match 10 in  `{ field: [ 10, 20 ]}`
* `$.field.0.value` will match 10 in  `{ field: [ { value: 10 }, { value: 20 } ]}`
* `$.field[?(@.name==x)].value` will match 10 in `{ field: [ { name: x, value: 10 }, { name: y, value: 20 } ]}`

If the result is a non-scalar (eg, the entire array) it will be used as is when matching against the operators `$size`, `$exists` and `$type`, otherwise will be converted to a string using `JSON.stringify(value)`.

### tests.headers

The key of the test is the name of the header, and the value is an assertion. For example:

* `Content-type: application/json`


### capture

Values from the response (headers and JSON body) can be captured and set as variables. We allow variables which are not scalars also (eg, objects and arrays), when capturing values from the response JSON.

### capture.json

Similar to tests, the key is a JSONPATH specification of the path of the field. The value is a string, the name of the variable to which the value will be set to. Eg:

* `address.city: citiyVar`

### capture.headers

Similar to tests, each header is a key-value pair where the key is the name of the header and the value is the variable to capture the value into.

* `Content-type: contentTypeVar`

# Variable sets

Variable sets files contain variables grouped under the set's name. For example:

```
staging:  # variable set: staging
  username: Tom  # variable: username
  userID: 45
production:
  username: Xi
  userID: 89
```

## Type

Variables can be of any type, even objects and arrays. (unlike Postman or Thunderclient, where they have to be strings). This is especially useful in making comparisons against responses, or even variables for using nested objects within Post bodies.

## Use of Variables

We will follow the makefile convention of variables, restircted to the round brace `()`.

* `$variable` if followed by a non-word character or EOL, unless the $ is preceded by a \
* `$(variable)`, unless the $ is preceded by a \

Variables can be placed in any of the following:

* URL
* Parameter values
* Header values
* Body
* Test values

Of the above, the variable value will be converted to a string before being used in the URL, Parameter values, Header values and Body (if it is a string).

While using as test values, the comparison will do an object deep-comparison if the value being compared and the variable both are objects or arrays. If either of them is a string, the other will be converted to a string using JSON.stringify() for non-scalars and toString() for scalars.

## Merging variable sets

If there are multiple `.zzv` files in a directory, all of them will be loaded and merged such that the result will have the union of all variable sets in each variable set file. Within a variable set, the variable names will be combined. In case the same variable name is used, it will be overwritten. Files will be processed in alphabetical order, so if the order is important, you can use 0-first.zzv, 1-second.zzv etc. as the file names.

The need for multiple files arises solely to support personal values (or secrets) that you don't want to share with your team. Each team member will need to create the personal variable set file themselves, with their own unique credentials. This file is typically not committed to the repository, whereas the common shared variable set file is usually committed along with the bundles in the directory.

## Captured Variables

Variables that are set using the `capture` option of a request are _not_ written back into any of the variable set files. They may overwrite existing variables of the same name loaded from the variable sets during the run session, but they are not saved permanently.

All the hand-edited YAML files are meant to be that way: they will not be touched by runners or document generators.

## Varaiable values as variables

This is not supported. Variables cannot be used in other variables.
