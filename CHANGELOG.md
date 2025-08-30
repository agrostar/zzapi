# Change Log

## 2.1.1
- Take in an optional working dir in some APIs, needed for multipart with files

## 2.1.0
- Added support for form values (url-encoded and multipart-formdata)

## 2.0.1
- Bug fix (Mac only): proper error message when connection refused

## 2.0.0
- New major version (module's interface is not compatible with 1.x)
- Automated tests
- Ability to use environment variables as variable values
- `$multi` option to test multiple JSONPath matches
- `$size` check failure prints the actual size instead of the actual value
- Bug fix: Escape single quotes in cURL output

## 1.5.1
- Fixed regression (status check failures were not detected)

## 1.5.0
- Support for `$skip` to skip a test, output can have the test shown as skipped

## 1.4.0
- Support for `$tests` to recursively run tests on a sub-object

## 1.3.0
- Deprecated

## [1.2.1]
- Bug fix: stopOnFailure not working

## [1.2.0]
- Support `$sw`, `$ew`, `$co` for startsWith, endsWith and contains
- Support for `$size` comparisons with `$lt`, `$gt` etc
- Run status test first and option for stopping on failure

## [1.1.1]
- Fixed unnecessary ? after parameter-less URLs

## [1.1.0]
- First fully usable version
