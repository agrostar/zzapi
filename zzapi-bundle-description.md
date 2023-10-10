# zzAPI Requests Bundle specification

A zzAPI bundle contains a bunch of request specifications, commonn parts of which can be specified in `common` and `variables` sections. An example:

```
common:
  baseUrl: https://example.com

requests:
  A simple GET request:
    method: GET
    url: /get
  A GET request with params:
    method: GET
    url: /get
    params:
      - { name: foo, value: bar }
```

## Top level objects

* `variables`: optional variables that can be used in all the requests.
* `common`: optional, request details that applies to all requests (unless overridden in a request). Each of the sub-elements is also optional.
* `requests`: a collection of requests as key-value pairs where the key is the request name (or title) and the value is a request object.

## variables

This is an object containing variable sets as described in [Variable sets specification](zzapi-varset-description.md). Requests are executed with one of the variable sets, to be selected before running the request(s). Typically, each variable set has the same set of variables defined, possibly with different values. An example:

```
variables:
  production:
    myServer: https://example.com
  staging:
    myServer: https://staging.example.com

requests:
  ping:
    url: $myServer/ping
```

## common

  * `baseUrl`: a prefix applied to the url of a request that starts with a /
  * `headers`: an array of header elements, which can be overridden in individual requests
     * By default, the header `user-agent` will be set to `zzAPI/<version>` unless overridden
  * `params`: query parameters added to all requests.
  * `tests`: a set of tests applied to all the requests in this bundle
  * `options`: options applicable to all requests, unless overridden

### request

* `url`: required, URL of the request (baseUrl from common settings will be prefixed if the URL starts with a /)
* `method`: required, one of GET, POST, PUT, PATCH etc
* `headers`: an array of `header` elements, in addition to the common set, or overridden if the name is the same
* `params`: an array of `param` elements, in addition to the common set. Parameters cannot be overridden.
* `body`: the raw request body. (Use the value `<filename` to read from a file, in a shell), or a JSON object, which will be converted to a JSON string after variable replacements.
* `response`: a sample response, useful for documentation (doesn't affect the request)
  * `headers`: the headers expected in the response
  * `body`: the raw response body, or a JSON object. Use `<filename` to read from a file.
  * `doc`: documentation to describe the response.
* `options`: options specific to this request, overrides common options
* `doc`: general documentation, typically in markdown (use `<filename` to read from a file)
* `tests`: a set of test objects
* `capture`: a set of values in the response to be captured as variables for use in further requests

## Common object definitions

### options

These are options that can be switches on/off, both at the common level as well as the request level.

* `follow`: whether to follow redirects (default is false)
* `verifySSL`: whether to enfoce SSL certificate validation (default is false)
* `showHeaders`: whether to show the response headers for each request (default is false)
* `formatJSON`: whether to format (add indents etc.) the response JSON in the editor window (default is true)

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
* `body: {$regex: "\<html\>"}`: the body must contain the characters `<html>` (using the `$regex` operator,)
* `json: { field.nested.value: 42 }`: the nested value must be equal to 42 (and match the type)

Note that an assertion value can be a non-scalar, especially when matching a non-scalar in the response JSON. The comparison will be done by JSON.stringif()ing both the RHS and the LHS.

Operators supported in the RHS are:
* `$eq`, `$ne`, `$lt`, `$gt`, `$lte`, `$gte`: against the value
* `$regex`: against the value, with `$options` like ignore-case
* `$size`: for length of arrays and objects, or the length of the string if it is not an array
* `$exists`: true|false, to check existance of a field
* `$type`: string|number|object|array|null: to ensure the type of the field

### tests.json

If there are any json tests, the response is parsed as JSON, provided the content type is `application/json`. The key of the test is a path to the (nested) field in the JSON document. The path is evaluated using JSONPATH (see https://www.npmjs.com/package/jsonpath and https://jsonpath.com/) and the first result (or the result of jp.value) is used as the value to test against. Here are some examples:

Object | Path | Result
--------- | ------- | -------
`{ field: { nested: { value: 10 } } }` | `$.field.nested.value: 10` | 10
`{ field: [ 10, 20 ]}` | `$.field.0` | 10
`{ field: [ 10, 20 ]}` | `$.field[0]` | 10
`{ field: [ { value: 10 }, { value: 20 } ]}` | `$.field.1.value` | 20
`{ field: [ { name: x, value: 10 }, { name: y, value: 20 } ]}` | `$.field[?(@.name=="x")].value` | 10

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
