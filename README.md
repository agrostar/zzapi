# zzAPI

This package is a library that powers the following REST API testing and documentation tools:

  * [VS Code extension](https://marketplace.visualstudio.com/items?itemName=AgroStar.zzapi) 
  * [CLI](https://github.com/agrostar/zzapi-cli)

These tools work with YAML files specifiying REST API requests. You can a request or all requests in that API *bundle*. Also supported are:
  * Tests on each request (no coding required)
  * Use of environments and variables that can be used in the requests
  * Capturing values into variables for subsequent requests

You are more likely to be interested in the above tools than this library itself. You may be interested in this library if you wish to build your own tool (eg, a web-based tool) using this library. In which case, you can proceed to the API documentation: [Work in progress]()

## Further reading

You can read about the zzAPI project which consists of this library, the VS Code extension and the CLI tool here: [zzAPI.md](docs/zzAPI.md)

You can read about the zzAPI file formats here, useful when you start using any of the tools:

  * [zzAPI bundle file format](docs/zzapi-bundle-description.md)
  * [zzAPI variables file format](docs/zzapi-varset-description.md)

## Samples

The following directory has some sample bundles and variable set files:

  * [Examples](examples/)

