# zzAPI

zzAPI (prounounced like pizza, the syllables interchanged) is a REST API testing and documentation tool set. An open-source Postman alternative.

Our manifesto:

* **Simplicity**: Do one thing (or two) and do it well. Single responsibility. Allow building on top.
* **Stand on the shoulders of giants**: Do not reinvent what has already been solved. We will use existing conveniences, which may not be perfect but will work well.
* **No GUI to enter data**: Developers don't need a GUI. Copy paste within an editor is far more efficient compared to multiple mouse clicks to enter data. We will use YAML files instead.
* **JSON first**: Though the request body can be anything, we have some extra conveniences for JSON body in the request as well as response.
* **Files belong in your repo**: Storage will be on the local file system (ie, not the cloud). Whatever you have typed belongs to you. We expect you to save the YAMLs within your code repository and share with your teammates.
* **Open source**: If you have an idea that is useful to you and can be to others as well, build it, test it and send us a PR. Or let us know by logging a GitHub issue.

# Alternatives

Here are some alternatives and good things about them that we have borrowed.

* **Postman**: Postman is a great tool, it has a single interface for documentation and testing. We borrow this from Postman. But the storage is on the cloud, making it hard for the tests and documentation be alongside the code.
* **OpenAPI (Swagger)**: OpenAPI uses YAML as the underlying data format. It's clean and human-editable. We borrow this from OpenAPI. But, it does not cover testing. Further, the YAML spec very elaborate and too structured. It is hard to hand-create OpenAPI YAMLs. 
* **ThunderClient**: The great thing about ThunderClient is that it is a Visual Studio Code extension. You don't need to switch apps to test what you have just coded. We borrow the VS Code extension idea from ThunderClient. But the UI needs too many mouse clicks.

# zzAPI Constituents

zzAPI is made up of (at least):

1. **Specs**: The YAML description, schema and validators.
2. **Runners**: The tools that can make the API requests and test the responses. Currently the only runner available is the [VS Code extension](https://marketplace.visualstudio.com/items?itemName=AgroStar.zzapi)
3. **Doc generators**: These will generate documentation in HTML/Markdown for easy browsing. Currently none, exist, but we are building one.

# Storage

All files will be stored locally (ie, not on the cloud, unlike Postman). A directory will hold together files of different kinds. The directory is typically the input to the runner and the doc generator. A directory is like a "Folder" in Postman terminology, but every directory can have it's own variables. If you need hierarchy, use sub-directories.

The directory will have the following kinds of files.

* **Request Bundles**: Request specification in YAML format, with a `.zzb` file extension. Described below.
* **Variable sets**: Variable definitions (with environment grouping), with a `.zzv` file extension. Also described below
* **Other files**: All other files (typically `.json`) can be used as requests and response samples. 

The schema for the above (except request and response files) will be discussed in detail below.

# Request Bundles

These are YAML files containing many requests. This is a "Collection" in Postman terminlogy. The directory can have any number of request bundles. Files ending with `.zzb` will be recognized as request bundles.

## Bundle Types

Although the file format does not make a real distinction, practically there are two types of bundles, but both follow the same (JSON schema)[zzapi-bundle.schema.json]. And here is the description of the [YAML format](zzapi-bundle-description.md)

## Documentation bundles

The primary purpose is to document an API set. Documentation bundles will have one entry for each API endpoint, with lots of documentation accompanying it on different ways to use the API endpoint, expected responses, and samples. It is meant for the users of your API set, and also for them to try out the API and see the responses for themselves.

Take a look at the [sample doc bundle](docs-bundle.zzb).

## Test bundles

The purpose is to automate testing. The same endpoint typically appears multiple times with different parameters and test cases. Tests are run against the response to ensure the API is responding as it is supposed to.

Take a look at the [sample tests bundle](tests-bundle.zzb).

