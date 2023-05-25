# zzapi

zzapi is an API documentation and testing tool set, a grossly simplified version of Postman. The basic idea for this is as follows:

* **Simplicity above all**: this makes the tool set do one job and allows more functionality to be incrementally built on top.
* **No GUI to enter data**: We believe that developers don't need one. Copy paste within an editor is far more efficient. We will instead use yaml files to write requests. yaml is easy to create manually and also parse for building stuff based on them. JSON, OTOH, is hard to create manually, does not support comments etc.
* **Only JSON**: We don't support XML multipart-formdata etc. in the responses. Request body can be anything, though, like curl. Who uses XML these days anyway?
* **Local storage**: Storage will be on the local file system (ie, not the cloud). Whatever you have typed belongs to you. You can share them with your team using git, S3, a shared file system, whatever. 
* **Basics only**: We don't have an export/import feature. We don't have an activity history. You can build your own. You can also build your own GUI to create the requests and bundles.
* **Open source**: if you have an idea that is useful to you and can be to others as well, build it, test it and send us a PR.

# zzapi Constituents

zzapi is made up of (at least):

1. **Specs**: The storage format specification
2. **Runners**: The tool thats can make one or more API requests. We are not restricted to a single runner, we may have a command line runner and also a VS Code extension that can run the requests.
3. **Documentation generators**: these will generate in different formats: We envisate a markdown generator to begin with.

# Storage format

All files will be stored locally (ie, not on the cloud, unlike Postman). A directory will hold together files of different kinds. The directory is typically the input to the runner and the doc generator. You can have many directories (typically only one per git repository). A directory is like a "Workspace" in Postman terminology.

The directory will hold the following kinds of files.

* **Request bundles**: these are yaml files containing many requests. This is a "Collection" in Postman terminlogy. The directory can have any number of request bundles. Files ending with `-bundle.yml` will be recognized as request bundles.
* **Variable sets**: these are also yaml files, containing variable definitions. This is an "Environment" in Postman terminlogy. Files ending with `-vars.yml` will be recognized as variable set files. Those ending with `-d-vars.yml` will be recognized as *default* variable sets (described below).
* **Request and response files**: All other files (typically `.json`) are request and response body samples. These will be referenced from within the bundles, so we don't really need a naming convention.

## Bundle

### Types of bundles

Although the file format does not make a real distinction, there are two types of bundles:

1. **Documentation bundles**: the primary purpose is to document the APIs in this bundle. Typically, documentation bundles will have one entry for each endpoint, with lots of documentation accompanying it.
2. **Test bundles**: the purpose is to automate testing. The same endpoint typically appears multiple times with different parameters. Tests are run against the response.

You can find two sample bundles `doc-bundle.yml` and `tests-bundle.yml` in this directory. Please refer to them as you read the explanation below.

### Common keys

For convenience, we use these common key shorthands for many objects in the bundle:

* k: key
* v: value
* d: documentation
* t: type

### Top level objects

* `t`: any value, optional (the doc generator can use this to ignore 'test' bundles)
* `common`: optional, applies to all requests. Each of the sub-elements is also optional.
  * `baseUrl`: a prefix applied to the url of all requests that start with a /
  * `headers`: a set of headers `{ k, v, d }`
  * `status`: the response code expected in all the requests in this bundle
  * `tests`: a set of tests applied to all the requests in this bundle (test spec follows)
* `requests`: a list of request objects (described below)

### Request (requests)

* `name`: to identify the request and print it during any test executions
* `url`: actual URL of the request
* `method`: defaults to GET if not specified
* `headers`: an optional set of headers `{ k, v, d }`
* `params`: an optional set of parameter objects `{ k, v, d }` Any parameter key starting with a dot will be ignored, like hidden files. This is to quickly enable/disable a parameter. The value will be URL Encoded before making the request)
* `body`: the raw request body, optional. (Use `<filename` to read from a file)
* `response`: an optional sample response.
  * `body`: the raw response body. Use `<filename` to read from a file.
  * `d`: optional documentation to describe the response.
* `status`: the expected response code, optional
* `d`: optional general documentation, in free format. Typically, this will be written in markdown. Use `<filename` to read from a file.
* `tests`: a set of tests  (described below)
* `setvars`: a set of variables to be saved into  (described below)

### Test (tests)

If there are any tests, the response is parsed as JSON. A test checks the value of fields with arbitrary nesting by specifying a path to the field, its data type and a check against the value.

* `path`: the path to the field. Nested fields are accessed using the dot notation (eg, `product.name` for object nesting and `products.0` for array nesting).

Assertions (all optional):
* `t`: the expected type of the field, one of: `string`, `number`, `array`, `object`, `null`
* `eq`: the expected value (the value of an array is its size, the value of null or undefined will always fail)
* `gt`: the value should be greater than
* `lt`: the value should be less than
* `co`: the value should contain
* `re`: the value matches the regex
* `neq`, `ngt`, `nlt`: not of the above
* `ieq`, `ico`, `ire`: case insensitive match of the above.

Multiple assertions are allowed in a single test. Even though it doesn't make sense to have combinations such as `eq` and `neq` in the same test, we don't bother to disallow it. In the absence of any assertions, the existance of the field will be checked (`field: null` is considered "exists").

### Variable (setvars)

* `path`: the path of the field whose value needs to be saved (in the same format as tests)
* `var`: the name of the variable into which the value is saved.

## Variable Set Files

These contain a simple list of key, value pairs, one for each variable. You can find two files, `prod-vars.yml` and `common-d-vars.yml` in this directory. Please refer to them.

# Variables

## Variable Overriding

The order of the variable sets is important. Each variable set is processed in the order in which it is specified, and the following actions will be taken:

* The variable will be set to the value.
* It will overwrite any previously set value from previous variable sets.
* The value itself can contain another variable (which should have already been set).

A typical directory will have some secrets, some common variables and one variable set for each environment, eg, production and staging. We would want them to be loaded in the following example orders:

* secrets, common, production
* secrets, common, staging

The variable set _secrets_ may contain different passwords for each environment, eg, `prodpassword` and `stagingpassword`. The production and staging variable sets can then use one of these as the value for the variable `password`. The variable set `common` will have common variables which can be overridden by the environment specific variables.

## Runtime Variables

Variables that are set during run-time using the setvars option of a request are _not_ written back into any of the variable sets. They may overwrite existing variables of the same name loaded from the variable sets during the run session, but not saved permanently.

All the hand-edited yaml files are meant to be that way: they will not be touched by runners or document generators.

## Type

Variables can only be of the string type. This is because they will be replaced within strings only.

## Use of Variables

Variables can be used as values in the following places in the request

* URL
* Parameters
* Headers
* Post Body
* Test values (eg, right side of eq)

We will follow the bash/zsh convention of using variables:

* $variable if followed by a non-word character or EOL ([a-z0-9_] is considered a word character, everything else is not)
* ${variable}

# Runners

Runners combine variables from one or more variable sets and execute one or all the requests in a bundle.

## Runner parameters

A command-line based runner may take the following parameter:

* Directory where the files are stored (current directory if not specified)
* Name of the request bundle (all bundles if not specified)
* Name of the request to run (all requests if not specified)
* Variable Sets to use: (in addition to all variable sets marked "default", in alphabetical order)
* File name (or pattern) to store the response(s), 
* Suppress printiong response to console

## Command line runs

Here are a few example runs:

Load all default variable sets, run one request, print the output on console:
```
$ zzapi-run --dir /Users/self/my-zzapi-tests --bundle tests --request login 
```

Use current directory, load all default variable sets, followed by 'prod' variable set, run all tests in the bundle and save responses:
```
$ zzapi-run --vars prod --bundle tests --save '$r-out.json'
```

Run all bundles in the current directory, save responses using the default '$b-$r-response.json' pattern
```
$ zzapi-run --save
```

Run the 'login' request in all bundles, suppress the responses (show only test results), save the response as a specified file.
```
$ zzapi-run --request login --suppress --save login.json
```

Say we had `1-secrets-d-vars.yml`, `2-common-d-vars.yml`, `prod-vars.yml` and `staging-vars.yml`. The following will first load the secrets, override with common, then override with prod. Note that even though 1-secrets-d and 2-common-d are not specified, they are loaded because they are "defaults" due to the `-d`
```
$ zzapi-run --request login --vars prod
```

## GUI based runners

Oh, we did say we won't have a GUI. That's still the case, but we do want to try things out at the time of creation. If the bundles and requests are being created by hand, in an editor, why not plug the editor in with an ability to run the bundle or request then and there?

### VS Code Extension

VS Code extensions are awesome because they can do magic. A few magics we would like to implement in our VS Code extension are:

* Action items above any bundle ("Run all") or request: ("Run"). This similar to the golang "Run test" and "Debug test" actions that automagically appear above any test functions.
* A console or output window that shows the response of any request(s).
* An ability to save a single run's response as a file: we can use it as the response sample in the documentation.

### Others

Given the separation of specification and UIs, a full-fledged runner GUI can also be built. But we don't think that will ever happen.