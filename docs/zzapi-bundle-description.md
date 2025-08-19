# zzAPI Requests Bundle specification

A zzAPI bundle contains a bunch of request specifications, commonn parts of which can be specified in `common` and `variables` sections. An example:

```
common:
  baseUrl: https://example.com

variables:
  production:
    username: 123
    password: xyz
  staging
    username: 456
    password: abc

requests:
  A simple GET request:
    method: GET
    url: /get
    params:
      foo: bar
    tests:
      status: 200
      $.status: OK
  a-simple-post-request:
    method: POST
    url: /login
    body:
      username: $username
      password: $password
    setvars:
      authToken: $.authToken
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
  * `headers`: a set of headers applicable to all requests
     * By default, the header `user-agent` will be set to `zzAPI/<version>` unless overridden
     * By default, if the request body is an object the Content-Type will be set to application/json unless overridden
  * `params`: query parameters added to all requests
  * `tests`: a set of tests applied to all the requests in this bundle
  * `options`: options applicable to all requests, unless overridden

### request

* `url`: required, URL of the request (baseUrl from common settings will be prefixed if the URL starts with a /)
* `method`: required, one of GET, POST, PUT, PATCH etc
* `headers`: a set of headers, this will be in in addition to the common set, or overridden if the name is the same
* `params`: a set of parameter values, or overridden if the name is the same
* `body`: the raw request body. (Use the value `file://<filename>` to read from a file), or an object, which will be converted to a JSON string after variable replacements.
* `formValues`: An object representing form fields to send in the request body. If no content-type is given and:
  1. if none of the fields contain a file (specified as `file://<filename>`), the request will be sent as `application/x-www-form-urlencoded`.
  2. if at least one field contains a file, the request will be sent as `multipart/form-data`.
* `response*`: a set of sample responses, useful for documentation (doesn't affect the request)
  * `headers`: the headers expected in the response
  * `body`: the raw response body, or a JSON object. Use `<filename` to read from a file.
  * `doc`: documentation to describe the response.
* `options`: options specific to this request, overrides common options
* `doc*`: general documentation, typically in markdown
* `tests`: a set of test objects
* `capture`: a set of values in the response to be captured as variables for use in further requests

## Common object definitions

### options

These are options that can be switches on/off, both at the common level as well as the request level.

* `follow`: whether to follow redirects (default is false)
* `verifySSL`: whether to enfoce SSL certificate validation (default is false)
* `showHeaders`: whether to show the response headers for each request (default is false)
* `rawParams`: whether to consider the params as is (default is false, ie use URL encoding)
* `keepRawJSON`: whether to keep the original response JSON without formatting it. (default is false)
* `stopOnFailure`: whether to skip other tests when any of the status tests fail.

### headers

HTTP Headers that will be sent along with the request. Headers can be specified as an object using name: value for each header, or it can be an array of objects, each containing the following keys:

* `name`: required, name of the parameter
* `value`: required, value of the parameter
* `doc`: helpful descriptions about what this parameter does, has no effect on the actual request

The object format is quicker and convenient, but you will need to use the array format if you want to add documentation to each header individually. Example:
```
    headers:
      X-Forwarded-For: 192.168.1.1
      Authentication: Basic dk13nd798dbsr
```
The same can also be written as, with some documentation:
```
    headers:
      - { name: X-Forwarded-For, value: 192.168.1.1, doc: for testing }
      - { name: Authentication, value: Basic dk13nd798dbsr, doc: base64 encoded user:password }
```

### params

Similar to headers, this too can either be an object using `name: value` for each parameter, or an array of objects, each with the following keys:

* `name`: required, name of the parameter
* `value`: required, value of the parameter
* `doc`: helpful descriptions about what this parameter does, has no effect on the actual request
* `raw`: treat the value as the raw value, do not URL encode it

You will need to use the array format if there is a need to add documentation, or to prevent the default URI encoding. Example:
```
    params:
      userId: 12356
      password: my password
```
The same can also be written as:
```
    params:
      - { name: userId, value: 12356, doc: the userId to login as }
      - { name: password, value: my%20password, raw: true }
```

In the array form, multiple parameters with the same name are naturally allowed. In the object format, if the value is an array, it will be expanded into multiple parameters. For example:
```
    params:
      userId: [ 123, 456, 789 ]
```
The above will result in a query string `userId=123&userId=456&userId=789`.

### tests

`tests` is an object containing many key-value pairs. The key is the entity to run the test against, and the value is an assertion (explained below). The key can be any of the following:

* `status`: the HTTP status code
* `body`: the entire raw body.
* Starting with `$.`: the jsonpath of an element in the response, parsed as JSON
* Starting with `$h.`: the response header identified by the string that follows `$h.`

### asssertion

Assertions are similar to MongoDB filters. The key is the element (a path in case of json), and the value is the expected value of the element. The value can be a plain value to be equated against, or a specification with the operator and value.

* `status: 400`: status must be equal to 400
* `status: { $lt: 300 }`: status must be less than 300
* `body: { $regex: "\<html\>" }`: the body must contain the characters `<html>` (using the `$regex` operator,)
* `$.field.nested.value: 42`: the nested value must be equal to 42 (and match the type)

Note that an assertion value can be a non-scalar, especially when matching a non-scalar in the response JSON. The comparison will be done by JSON.stringify()ing the RHS and the LHS.

Operators supported in the RHS are:
* `$eq`, `$ne`, `$lt`, `$gt`, `$lte`, `$gte`: against the value
* `$regex`: against the value, with `$options` like ignore-case
* `$sw`, `$ew`, `$co`: to check if the target starts with, ends with or contains a string
* `$size`: for length of arrays and objects, or the length of the string if it is not an array. The value can be an object for `$ne`, `$lt` etc. comparisons.
* `$exists`: true|false, to check existance of a field
* `$type`: string|number|object|array|null: to check the type of the field
* `$tests`: perform assertions (recursively) on the value, as if it were the `$.` root
* `$skip`: skip the assertions under this test. Useful in case some tests are failing, but we want the output to keep reminding us of this fact.
* `$multi`: use `jasonpath.query` (all matches) instead of `jasonpath.value` (first match) to evaluate the JSONPath expresson. This is useful if you need to evaluate multiple nested elements of an object array all at once.

### jsonpath tests

If there are any jsonpath tests, the response is parsed as JSON, provided the content type is `application/json`. The key of the test is a path to the (nested) field in the JSON document. The path is evaluated using JSONPATH (see https://www.npmjs.com/package/jsonpath and https://jsonpath.com/) and the first result (or the result of jp.value) is used as the value to test against. Here are some examples:

Object | Path | Result
--------- | ------- | -------
`{ field: { nested: { value: 10 } } }` | `$.field.nested.value: 10` | 10
`{ field: [ 10, 20 ]}` | `$.field.0` | 10
`{ field: [ 10, 20 ]}` | `$.field[0]` | 10
`{ field: [ { value: 10 }, { value: 20 } ]}` | `$.field.1.value` | 20
`{ field: [ { name: x, value: 10 }, { name: y, value: 20 } ]}` | `$.field[?(@.name=="x")].value` | 10

If the result is a non-scalar (eg, the entire array) it will be used as is when matching against the operators `$tests`, `$size`, `$exists` and `$type`, otherwise will be converted to a string using `JSON.stringify(value)`.

### setvars

Values from the response (headers and JSON body) can be captured and set as variables. We allow variables which are not scalars also (eg, objects and arrays), when capturing values from the response JSON.

`setvars` is an object with many ke-value pairs, where the key is the name of the variable to set and the value is similar to tests: one of status, entire body, a JSONPATH spec or  a header spec.
